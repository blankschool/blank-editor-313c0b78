#!/usr/bin/env python3
"""
Extrai as 12 paginas do PDF para model.json + assets/ + fonts/.

Saida (model.json):
  {"pages":[{"n":1,"w":1080,"h":1440,"bg":"#002820","layers":[...]}], "fonts":{...}}

Cada layer e uma das formas:
  {"t":"fill",  "rect":[x,y,w,h], "color":"#rrggbb"}
  {"t":"image", "src":"assets/xx.jpg", "rect":[x,y,w,h], "flip_y":bool}
  {"t":"text",  "font":"NYTFranklin-Bold", "size":f, "color":"#rrggbb",
                "x":f, "baseline":f, "text":"...", "ls":f}
"""
import base64, io, json, re, zlib
from pathlib import Path
from PIL import Image
from pdfextract import PDF, Walker

HERE = Path(__file__).parent
PDF_PATH = HERE / "carrossel.pdf"
ASSETS = HERE / "assets"
FONTS = HERE / "fonts"
# Largura de saida. A ALTURA nao e fixa: sai da proporcao do MediaBox de cada
# pagina. Fixar as duas assumia que todo design tem o formato do primeiro que
# passou por aqui — um 1080x1350 saia esticado para 1440.
W = 1080


# ------------------------------------------------------------ recursos
def res_dict(pdf, page_res, key):
    """resolve /Key como dict inline ou referencia indireta -> texto do dict"""
    m = re.search(r"/" + key + r"\s+(\d+)\s+0\s+R", page_res)
    if m:
        return pdf.dict_of(int(m.group(1)))
    m = re.search(r"/" + key + r"\s*<<(.*?)>>", page_res, re.S)
    return m.group(1) if m else ""


def to_unicode(pdf, fnum):
    b = pdf.dict_of(fnum)
    m = re.search(r"/ToUnicode\s+(\d+)\s+0\s+R", b)
    if not m:
        return {}
    cm = pdf.stream(int(m.group(1))).decode("latin1")
    out = {}
    for blk in re.findall(r"beginbfchar(.*?)endbfchar", cm, re.S):
        for a, c in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
            out[int(a, 16)] = "".join(chr(int(c[i:i + 4], 16))
                                      for i in range(0, len(c), 4))
    for blk in re.findall(r"beginbfrange(.*?)endbfrange", cm, re.S):
        for lo, hi, d in re.findall(
                r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
            lo, hi, d = int(lo, 16), int(hi, 16), int(d, 16)
            for i in range(hi - lo + 1):
                out[lo + i] = chr(d + i)
    return out


def base_font(pdf, fnum):
    b = pdf.dict_of(fnum)
    m = re.search(r"/DescendantFonts\s*\[\s*(\d+)", b)
    b2 = pdf.dict_of(int(m.group(1))) if m else b
    mm = re.search(r"/BaseFont\s*/([^\s/>]+)", b2)
    return mm.group(1).split("+")[-1] if mm else "?"


def font_file(pdf, fnum):
    """devolve (nome_base, bytes_ttf) do FontFile2 do descendente"""
    b = pdf.dict_of(fnum)
    m = re.search(r"/DescendantFonts\s*\[\s*(\d+)", b)
    if not m:
        return None, None
    d2 = pdf.dict_of(int(m.group(1)))
    fd = re.search(r"/FontDescriptor\s+(\d+)\s+0\s+R", d2)
    if not fd:
        return None, None
    ff = re.search(r"/FontFile2\s+(\d+)\s+0\s+R", pdf.dict_of(int(fd.group(1))))
    if not ff:
        return None, None
    return base_font(pdf, fnum), pdf.stream(int(ff.group(1)))


# ------------------------------------------------------------- imagens
def save_image(pdf, num, out_dir):
    dt = pdf.dict_of(num)
    w = int(re.search(r"/Width\s+(\d+)", dt).group(1))
    h = int(re.search(r"/Height\s+(\d+)", dt).group(1))
    sm = re.search(r"/SMask\s+(\d+)\s+0\s+R", dt)
    if "/DCTDecode" in dt and not sm:
        p = out_dir / f"img{num}.jpg"
        p.write_bytes(pdf.stream(num, decode=False))
        return p.name, (w, h), False
    # RGB + alpha
    if "/DCTDecode" in dt:
        img = Image.open(io.BytesIO(pdf.stream(num, decode=False))).convert("RGB")
    else:
        img = Image.frombytes("RGB", (w, h), pdf.stream(num)[:w * h * 3])
    if sm:
        sn = int(sm.group(1))
        sdt = pdf.dict_of(sn)
        sw = int(re.search(r"/Width\s+(\d+)", sdt).group(1))
        sh = int(re.search(r"/Height\s+(\d+)", sdt).group(1))
        a = (Image.open(io.BytesIO(pdf.stream(sn, decode=False))).convert("L")
             if "/DCTDecode" in sdt
             else Image.frombytes("L", (sw, sh), pdf.stream(sn)[:sw * sh]))
        if a.size != img.size:
            a = a.resize(img.size, Image.LANCZOS)
        img = img.convert("RGBA")
        img.putalpha(a)
    p = out_dir / f"img{num}.png"
    img.save(p, optimize=True)
    return p.name, (w, h), sm is not None


# --------------------------------------------------------------- main
def main():
    ASSETS.mkdir(exist_ok=True)
    FONTS.mkdir(exist_ok=True)
    pdf = PDF(PDF_PATH)
    pages_out, images_done, font_subsets = [], {}, {}

    for pi, pnum in enumerate(pdf.pages(), 1):
        res = pdf.dict_of(pnum)
        mb = [float(x) for x in
              re.search(r"/MediaBox\s*\[([^\]]*)\]", res).group(1).split()]
        sx = W / (mb[2] - mb[0])
        H = round((mb[3] - mb[1]) * sx)
        to_px = (lambda top: (lambda x, y: (x * sx, (top - y) * sx)))(mb[3])
        ct = int(re.search(r"/Contents\s+(\d+)", res).group(1))

        wk = Walker(pdf, [1, 0, 0, 1, 0, 0], to_px)
        wk.run(pdf.stream(ct), res)

        # as fontes podem estar nos recursos de um Form, nao da pagina:
        # o walker resolve cada /Fnn para o numero do objeto
        fobjs = {o["fontobj"] for o in wk.out
                 if o["op"] == "text" and o.get("fontobj")}
        tu = {v: to_unicode(pdf, v) for v in fobjs}
        bf = {v: base_font(pdf, v) for v in fobjs}
        for v in fobjs:
            name, ttf = font_file(pdf, v)
            if ttf:
                font_subsets.setdefault(name, []).append((ttf, tu[v]))

        layers, bg = [], "#FFFFFF"
        full = [o for o in wk.out if o["op"] == "fill"
                and o["rect"][2] >= W - 1 and o["rect"][3] >= H - 1]
        if full:
            bg = full[-1]["color"]

        pend = []          # glifos aguardando agrupamento
        pend_path = []     # contornos vetoriais, agrupados por cor mais abaixo
        for o in wk.out:
            if o["op"] == "fill":
                if o in full:
                    continue
                layers.append(dict(t="fill", rect=[round(v, 4) for v in o["rect"]],
                                   color=o["color"],
                                   opacity=round(o.get("alpha", 1.0), 4)))
            elif o["op"] == "image":
                if o["xobj"] not in images_done:
                    images_done[o["xobj"]] = save_image(pdf, o["xobj"], ASSETS)
                fn, size, alpha = images_done[o["xobj"]]
                lay = dict(t="image", src=f"assets/{fn}",
                           rect=[round(v, 4) for v in o["rect"]],
                           flip_y=o["flip_y"], intrinsic=list(size),
                           alpha_channel=alpha,
                           opacity=round(o.get("alpha", 1.0), 4))
                # o Canva desenha a imagem maior e recorta na moldura visivel
                c = o.get("clip")
                if c and c[0] == "rect":
                    cx, cy, cw, chh = c[1:]
                    x, y, ww, hh = o["rect"]
                    if (cx > x + .5 or cy > y + .5
                            or cx + cw < x + ww - .5 or cy + chh < y + hh - .5):
                        lay["clip"] = [round(v, 4) for v in (cx, cy, cw, chh)]
                elif c and c[0] == "circle":
                    lay["clip_circle"] = [round(v, 4) for v in c[1:]]
                layers.append(lay)
            elif o["op"] == "path":
                pend_path.append(o)

            elif o["op"] == "text":
                pend.append(o)

        # Junta os contornos vetoriais por cor.
        #
        # Um desenho com halftone chega como milhares de pontinhos, cada um um
        # path. Emitir um por camada faria o documento crescer sem limite e
        # encheria a lista de camadas do editor com ruido. Agrupados por cor,
        # viram um <path> so por cor — que e como o desenho e percebido.
        if pend_path:
            por_cor: dict[str, list] = {}
            for o in pend_path:
                por_cor.setdefault(o["color"], []).append(o)
            for cor, grupo in por_cor.items():
                xs0 = min(g["rect"][0] for g in grupo)
                ys0 = min(g["rect"][1] for g in grupo)
                xs1 = max(g["rect"][0] + g["rect"][2] for g in grupo)
                ys1 = max(g["rect"][1] + g["rect"][3] for g in grupo)
                layers.append(dict(
                    t="path", color=cor,
                    rect=[round(xs0, 4), round(ys0, 4),
                          round(xs1 - xs0, 4), round(ys1 - ys0, 4)],
                    d=" ".join(g["d"] for g in grupo),
                    n=len(grupo),
                    opacity=round(grupo[0].get("alpha", 1.0), 4)))

        # agrupa glifos consecutivos com mesmo (fonte, corpo, baseline, cor)
        runs = []
        for o in pend:
            key = (o["fontobj"], round(o["size"], 3),
                   round(o["baseline"], 2), o["color"], round(o.get("rot", 0), 2))
            if runs and runs[-1]["key"] == key:
                runs[-1]["gl"].append(o)
            else:
                runs.append(dict(key=key, gl=[o]))
        for r in runs:
            k, size, base, color, ang = r["key"]
            gl = sorted(r["gl"], key=lambda o: o["x"])
            # um Tj pode trazer varios glifos: dentro dele o avanco e natural.
            # guardar (x_do_bloco, texto) permite medir o tracking corretamente.
            chunks = [[round(o["x"], 4),
                       "".join(tu[k].get(c, "") for c in o["cids"])] for o in gl]
            layers.append(dict(t="text", font=bf[k], size=round(size, 4),
                               color=color, x=round(gl[0]["x"], 4),
                               baseline=round(base, 4), rot=ang,
                               text="".join(c[1] for c in chunks),
                               chunks=chunks))

        pages_out.append(dict(n=pi, w=W, h=H, bg=bg, layers=layers))
        ntxt = sum(1 for l in layers if l["t"] == "text")
        nimg = sum(1 for l in layers if l["t"] == "image")
        print(f"  pagina {pi:2d}: {len(layers):2d} camadas "
              f"({nimg} imagem, {ntxt} texto)  bg {bg}")

    (HERE / "model.json").write_text(
        json.dumps(dict(pages=pages_out), ensure_ascii=False, indent=1),
        encoding="utf-8")
    (HERE / "_font_subsets.json").write_text(json.dumps(
        {k: [[base64.b64encode(t).decode(), {str(a): b for a, b in u.items()}]
             for t, u in v] for k, v in font_subsets.items()}))
    print(f"\nmodel.json escrito | imagens: {len(images_done)} | "
          f"familias de fonte: {list(font_subsets)}")


if __name__ == "__main__":
    main()

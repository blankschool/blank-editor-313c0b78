#!/usr/bin/env python3
"""
Funde os subsets de fonte das 12 paginas numa fonte por familia.

Cada pagina do PDF traz seu proprio subset com `Identity-H` e sem `cmap`
utilizavel, contendo so os glifos daquela pagina. Aqui se junta a uniao de todos,
indexada por unicode via `ToUnicode`.

Os contornos sao decompostos com DecomposingRecordingPen: glifos acentuados sao
compostos e referenciam componentes por indice, que nao sobrevive a copia entre
fontes. Decompor evita ter que remapear os indices.
"""
import base64, io, json
from pathlib import Path
from fontTools.ttLib import TTFont, newTable
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable

HERE = Path(__file__).parent
OUT = HERE / "fonts"


def gname(ch):
    return "u%04X" % ord(ch)


def build(family, entries):
    glyphs, adv, lsb, base, upem = {}, {}, {}, None, None
    for b64, uni in entries:
        f = TTFont(io.BytesIO(base64.b64decode(b64)))
        if base is None:
            base, upem = f, f["head"].unitsPerEm
        order, gs, hm = f.getGlyphOrder(), f.getGlyphSet(), f["hmtx"].metrics
        for cid_s, ch in uni.items():
            cid = int(cid_s)
            if cid >= len(order) or len(ch) != 1 or ch in glyphs:
                continue
            src = order[cid]
            rec = DecomposingRecordingPen(gs)   # resolve componentes em contornos
            gs[src].draw(rec)
            pen = TTGlyphPen(None)
            rec.replay(pen)
            glyphs[ch] = pen.glyph()
            # o lsb precisa vir junto: com lsb=0 o rasterizador desloca o
            # contorno e o texto sai mais estreito
            adv[ch], lsb[ch] = hm[src]

    chars = sorted(glyphs)
    order = [".notdef"] + [gname(c) for c in chars]
    out = TTFont()
    out.setGlyphOrder(order)

    glyf = newTable("glyf")
    glyf.glyphOrder = order
    glyf.glyphs = {".notdef": TTGlyphPen(None).glyph()}
    metrics = {".notdef": (int(upem * 0.5), 0)}
    for c in chars:
        glyf.glyphs[gname(c)] = glyphs[c]
        metrics[gname(c)] = (int(adv[c]), int(lsb[c]))
    out["glyf"] = glyf
    # loca e gerada ao compilar glyf, mas precisa existir na lista de tabelas
    out["loca"] = newTable("loca")

    hmtx = newTable("hmtx")
    hmtx.metrics = metrics
    out["hmtx"] = hmtx

    for t in ("head", "hhea", "maxp", "OS/2"):
        out[t] = base[t]
    out["maxp"].numGlyphs = len(order)
    out["hhea"].numberOfHMetrics = len(order)

    post = newTable("post")
    post.formatType = 3.0
    post.italicAngle = 0
    post.underlinePosition = -100
    post.underlineThickness = 50
    post.isFixedPitch = 0
    post.minMemType42 = post.maxMemType42 = 0
    post.minMemType1 = post.maxMemType1 = 0
    out["post"] = post

    cmap_dict = {ord(c): gname(c) for c in chars}
    subs = []
    for pid, eid in ((3, 1), (0, 3)):
        s = CmapSubtable.newSubtable(4)
        s.platformID, s.platEncID, s.language = pid, eid, 0
        s.cmap = dict(cmap_dict)
        subs.append(s)
    cm = newTable("cmap")
    cm.tableVersion = 0
    cm.tables = subs
    out["cmap"] = cm

    nm = newTable("name")
    nm.names = []
    out["name"] = nm
    for nid in (1, 4, 6):
        out["name"].setName(family, nid, 3, 1, 0x409)
    out["name"].setName("Regular", 2, 3, 1, 0x409)

    OUT.mkdir(exist_ok=True)
    ttf = OUT / f"{family}.ttf"
    out.save(ttf)
    w = TTFont(ttf)          # recarrega do disco: garante glyf/loca consistentes
    w.flavor = "woff2"
    w.save(OUT / f"{family}.woff2")
    return chars, (OUT / f"{family}.woff2").stat().st_size


SUFIXOS = ("-Bd", "-Bold", "-Rg", "-Regular", "-Lt", "-Light", "-Md", "-Medium",
           "-Sb", "-Semibold", "-Blk", "-Black", "-It", "-Italic", "-Th", "-Thin")


def familia_de(base: str) -> str:
    """TTCommonsPro-Bd -> "TT Commons Pro". O peso vem do OS/2, entao o sufixo
    do arquivo so atrapalha: mante-lo faria Bold e Regular virarem familias
    diferentes e o browser nao alternaria entre elas."""
    import re as _re
    nome = base
    for s in SUFIXOS:
        if nome.endswith(s):
            nome = nome[: -len(s)]
            break
    if " " not in nome and "-" not in nome:
        nome = _re.sub(r"(?<=[a-z])(?=[A-Z])", " ", nome)
    return nome.strip() or base


def metricas() -> dict:
    """familia, peso e metricas verticais de cada fonte gerada.

    Sai daqui e nao de quem chama porque e aqui que o fontTools existe — o
    orquestrador roda no python do sistema. Grava fonts.json ao lado das fontes.
    """
    out = {}
    for arq in sorted(OUT.glob("*.ttf")):
        f = TTFont(arq)
        u = f["head"].unitsPerEm
        o = f["OS/2"]
        # USE_TYPO_METRICS decide quais metricas o browser usa para montar a
        # caixa de linha; o conjunto errado desloca todo o texto.
        typo = bool(o.fsSelection & (1 << 7))
        out[arq.stem] = {
            "familia": familia_de(arq.stem),
            "peso": o.usWeightClass or 400,
            "asc": (o.sTypoAscender / u) if typo else (o.usWinAscent / u),
            "desc": (-o.sTypoDescender / u) if typo else (o.usWinDescent / u),
            "arquivo": arq.stem + ".woff2",
        }
    return out


if __name__ == "__main__":
    subs = json.loads((HERE / "_font_subsets.json").read_text())
    for family, entries in sorted(subs.items()):
        chars, size = build(family, entries)
        print(f"  {family:22s} {len(chars):3d} glifos  {size/1024:6.1f} KB")
        print(f"      {''.join(chars)!r}")
    met = metricas()
    (OUT / "fonts.json").write_text(json.dumps(met, ensure_ascii=False, indent=1))
    for k, v in met.items():
        print(f"  {v['familia']:22s} peso {v['peso']}  asc {v['asc']:.4f} desc {v['desc']:.4f}")

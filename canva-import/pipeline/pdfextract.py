#!/usr/bin/env python3
"""
Extrator de content stream de PDF do Canva.

Percorre a arvore de desenho de cada pagina acumulando a CTM e devolve uma lista
plana de operacoes em coordenadas de pagina (px, origem no topo-esquerda):

  {"op":"fill",  "rect":[x,y,w,h], "color":"#rrggbb", "alpha":f}
  {"op":"image", "xobj":n, "rect":[x,y,w,h], "flip_y":bool, "clip":[...]}
  {"op":"text",  "runs":[...], "size":f, "font":"NYTFranklin-Bold", ...}
  {"op":"stroke","circle":[cx,cy,r], "color":"#rrggbb", "width":f, "clipped_by_self":bool}

Nao e um interpretador completo de PDF: cobre o que o exportador do Canva emite.
"""
import math
import re, zlib
from dataclasses import dataclass, field


# --------------------------------------------------------------- objetos
class PDF:
    def __init__(self, path):
        self.raw = open(path, "rb").read()
        self.objs = {}
        for m in re.finditer(rb"(?<![0-9])(\d+)\s+0\s+obj", self.raw):
            n = int(m.group(1))
            end = self.raw.find(b"endobj", m.end())
            self.objs[n] = self.raw[m.end():end]

    def body(self, n):
        return self.objs.get(n)

    def dict_of(self, n):
        b = self.body(n)
        if b is None:
            return ""
        i = b.find(b"stream")
        return (b[:i] if i >= 0 else b).decode("latin1")

    def stream(self, n, decode=True):
        b = self.body(n)
        i = b.find(b"stream")
        if i < 0:
            return None
        dt = b[:i].decode("latin1")
        s = i + 6
        while b[s:s + 1] in (b"\r", b"\n"):
            s += 1
        raw = b[s:b.rfind(b"endstream")]
        if decode and "/FlateDecode" in dt:
            raw = zlib.decompress(raw)
        return raw

    def pages(self):
        ns = [n for n, b in self.objs.items() if re.search(rb"/Type\s*/Page\b", b)]
        return sorted(ns)


# --------------------------------------------------------------- matrizes
def mmul(a, b):
    """a depois b (a x b), matrizes PDF [a b c d e f]"""
    a0, a1, a2, a3, a4, a5 = a
    b0, b1, b2, b3, b4, b5 = b
    return [a0 * b0 + a1 * b2, a0 * b1 + a1 * b3,
            a2 * b0 + a3 * b2, a2 * b1 + a3 * b3,
            a4 * b0 + a5 * b2 + b4, a4 * b1 + a5 * b3 + b5]


def apply(m, x, y):
    return (m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5])


IDENT = [1, 0, 0, 1, 0, 0]

NUM = re.compile(rb"[-+]?\d*\.?\d+")
NAME = re.compile(rb"/([^\s/\[\]<>(){}]*)")
OPR = re.compile(rb"[A-Za-z'\"*]+")
WS = b"\x00\t\n\f\r "

OCTAL = re.compile(rb"[0-7]{1,3}")
ESC = {ord("n"): 10, ord("r"): 13, ord("t"): 9, ord("b"): 8, ord("f"): 12,
       ord("("): 40, ord(")"): 41, ord("\\"): 92}


def lit_string(data, i):
    """le uma string literal PDF que comeca em data[i] == '(' -> (bytes, novo_i)"""
    i += 1
    depth = 1
    out = bytearray()
    while i < len(data):
        c = data[i]
        if c == 92:                       # barra invertida
            i += 1
            if i >= len(data):
                break
            n = data[i]
            if n in ESC:
                out.append(ESC[n]); i += 1
            elif 48 <= n <= 55:           # \ddd octal
                m = OCTAL.match(data, i)
                out.append(int(m.group(), 8) & 0xFF); i = m.end()
            elif n in (10, 13):           # continuacao de linha
                i += 1
                if n == 13 and i < len(data) and data[i] == 10:
                    i += 1
            else:
                out.append(n); i += 1
            continue
        if c == 40:
            depth += 1; out.append(c); i += 1; continue
        if c == 41:
            depth -= 1
            i += 1
            if depth == 0:
                return bytes(out), i
            out.append(c); continue
        out.append(c); i += 1
    return bytes(out), i


def tokens(data):
    """gera (kind, value): num | name | str | arr | arre | op"""
    i, n = 0, len(data)
    while i < n:
        c = data[i]
        if c in WS:
            i += 1; continue
        if c == 37:                                   # % comentario
            j = data.find(b"\n", i)
            i = n if j < 0 else j + 1
            continue
        if c == 40:
            b, i = lit_string(data, i)
            yield "str", b
            continue
        if c == 60:
            if data[i:i + 2] == b"<<":                # dicionario inline: pula
                i += 2; continue
            j = data.find(b">", i)
            h = re.sub(rb"\s", b"", data[i + 1:j])
            if len(h) % 2:
                h += b"0"
            yield "str", bytes.fromhex(h.decode("latin1") or "")
            i = j + 1
            continue
        if data[i:i + 2] == b">>":
            i += 2; continue
        if c == 91:
            yield "arr", None; i += 1; continue
        if c == 93:
            yield "arre", None; i += 1; continue
        if c == 47:
            m = NAME.match(data, i)
            yield "name", "/" + m.group(1).decode("latin1")
            i = m.end(); continue
        m = NUM.match(data, i)
        if m and m.group() not in (b"", b"-", b"+", b"."):
            yield "num", float(m.group()); i = m.end(); continue
        m = OPR.match(data, i)
        if m:
            yield "op", m.group().decode("latin1"); i = m.end(); continue
        i += 1


def hexcolor(r, g, b):
    return "#%02X%02X%02X" % (round(r * 255), round(g * 255), round(b * 255))


@dataclass
class GState:
    ctm: list = field(default_factory=lambda: list(IDENT))
    fill: str = "#000000"
    stroke: str = "#000000"
    alpha: float = 1.0
    salpha: float = 1.0
    lw: float = 1.0
    clip: object = None          # ("rect", x0,y0,x1,y1) | ("circle", cx,cy,r)


class Walker:
    """Percorre um content stream acumulando estado grafico."""

    def __init__(self, pdf, base_ctm, to_px):
        self.pdf = pdf
        self.base = base_ctm
        self.to_px = to_px          # (x,y) espaco PDF -> (x,y) px da pagina
        self.out = []

    def run(self, data, res, ctm=None, depth=0):
        if depth > 8:
            return
        gs = GState(ctm=list(ctm if ctm else self.base))
        stack = []
        ops = []          # operandos acumulados
        arr = None
        pending_path = []   # pontos do path corrente (para clipes/circulos)
        text = None

        for k, v in tokens(data):
            if k in ("num", "name", "str"):
                (arr if arr is not None else ops).append(v)
                continue
            if k == "arr":
                arr = []
                continue
            if k == "arre":
                ops.append(arr); arr = None
                continue

            op = v

            try:
                if op == "q":
                    stack.append(GState(list(gs.ctm), gs.fill, gs.stroke,
                                        gs.alpha, gs.salpha, gs.lw, gs.clip))
                elif op == "Q":
                    if stack:
                        gs = stack.pop()
                elif op == "cm":
                    gs.ctm = mmul(ops[-6:], gs.ctm)
                elif op == "gs":
                    self._extgstate(gs, ops, res)
                elif op in ("rg", "sc", "scn") and len(ops) >= 3:
                    gs.fill = hexcolor(*ops[-3:])
                elif op in ("RG", "SC", "SCN") and len(ops) >= 3:
                    gs.stroke = hexcolor(*ops[-3:])
                elif op == "g" and ops:
                    gs.fill = hexcolor(ops[-1], ops[-1], ops[-1])
                elif op == "G" and ops:
                    gs.stroke = hexcolor(ops[-1], ops[-1], ops[-1])
                elif op == "w" and ops:
                    gs.lw = ops[-1]
                elif op == "re" and len(ops) >= 4:
                    x, y, w, h = ops[-4:]
                    pending_path.append(("rect", x, y, w, h))
                elif op == "m" and len(ops) >= 2:
                    pending_path.append(("m", ops[-2], ops[-1]))
                elif op == "l" and len(ops) >= 2:
                    pending_path.append(("l", ops[-2], ops[-1]))
                elif op == "c" and len(ops) >= 6:
                    pending_path.append(("c", *ops[-6:]))
                elif op == "v" and len(ops) >= 4:
                    # v: primeiro ponto de controle = ponto corrente
                    pending_path.append(("c", ops[-4], ops[-3], ops[-4], ops[-3],
                                         ops[-2], ops[-1]))
                elif op == "y" and len(ops) >= 4:
                    # y: segundo ponto de controle = ponto final
                    pending_path.append(("c", ops[-4], ops[-3], ops[-2], ops[-1],
                                         ops[-2], ops[-1]))
                elif op in ("W", "W*"):
                    gs.clip = self._path_shape(pending_path, gs.ctm) or gs.clip
                elif op in ("f", "f*", "F"):
                    self._fill(gs, pending_path)
                    pending_path = []
                elif op == "S":
                    self._stroke(gs, pending_path)
                    pending_path = []
                elif op == "n":
                    pending_path = []
                elif op == "Do" and ops:
                    self._do(gs, ops[-1], res, depth)
                elif op == "BT":
                    text = dict(tm=list(IDENT), tlm=list(IDENT), font=None,
                               size=0, runs=[])
                elif op == "ET":
                    if text and text["runs"]:
                        self._emit_text(gs, text, res)
                    text = None
                elif op == "Tf" and text is not None and len(ops) >= 2:
                    text["font"] = ops[-2]; text["size"] = ops[-1]
                elif op == "Tm" and text is not None and len(ops) >= 6:
                    text["tm"] = list(ops[-6:]); text["tlm"] = list(ops[-6:])
                elif op == "Td" and text is not None and len(ops) >= 2:
                    text["tlm"] = mmul([1, 0, 0, 1, ops[-2], ops[-1]], text["tlm"])
                    text["tm"] = list(text["tlm"])
                elif op in ("Tj", "TJ") and text is not None:
                    text["runs"].append(dict(tm=list(text["tm"]), fill=gs.fill,
                                             font=text["font"], size=text["size"],
                                             data=ops[-1] if ops else ""))
            except Exception:
                pass
            ops = []
            if op in ("f", "f*", "F", "S", "n"):
                pending_path = []

    # ---------------------------------------------------------- helpers
    def _extgstate(self, gs, ops, res):
        if not ops or not isinstance(ops[-1], str):
            return
        name = ops[-1].lstrip("/")
        m = re.search(r"/ExtGState\s+(\d+)\s+0\s+R", res)
        if not m:
            return
        gd = self.pdf.dict_of(int(m.group(1)))
        r = re.search(r"/" + re.escape(name) + r"\s+(\d+)\s+0\s+R", gd)
        if not r:
            return
        g = self.pdf.dict_of(int(r.group(1)))
        for pat, attr in ((r"/ca\s+([\d.]+)", "alpha"), (r"/CA\s+([\d.]+)", "salpha"),
                          (r"/LW\s+([\d.]+)", "lw")):
            mm = re.search(pat, g)
            if mm:
                setattr(gs, attr, float(mm.group(1)))

    def _path_shape(self, path, ctm):
        """Devolve ('rect',...) ou ('circle',...) do path corrente, em px."""
        rects = [p for p in path if p[0] == "rect"]
        curves = [p for p in path if p[0] == "c"]
        if curves and len(curves) >= 4:
            xs, ys = [], []
            for p in path:
                if p[0] == "m":
                    xs.append(p[1]); ys.append(p[2])
                elif p[0] == "c":
                    xs += [p[1], p[3], p[5]]; ys += [p[2], p[4], p[6]]
            x0, y0 = self.to_px(*apply(ctm, min(xs), min(ys)))
            x1, y1 = self.to_px(*apply(ctm, max(xs), max(ys)))
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            r = (abs(x1 - x0) + abs(y1 - y0)) / 4
            return ("circle", cx, cy, r)
        if rects:
            x, y, w, h = rects[-1][1:]
            x0, y0 = self.to_px(*apply(ctm, x, y))
            x1, y1 = self.to_px(*apply(ctm, x + w, y + h))
            return ("rect", min(x0, x1), min(y0, y1), abs(x1 - x0), abs(y1 - y0))
        return None

    def _fill(self, gs, path):
        """Emite o preenchimento.

        Retangulo vira `fill` (uma div com background no HTML). Qualquer outro
        contorno vira `path`, com a geometria em SVG.

        Sem o ramo do `path` todo desenho vetorial some em silencio: a arte com
        halftone, o contorno grosso do titulo e qualquer forma livre. Num design
        real isso e a maior parte do conteudo — uma pagina tinha 2506
        preenchimentos e so 3 eram retangulos.
        """
        if gs.alpha == 0 or not path:
            return
        rects = [x for x in path if x[0] == "rect"]
        curvas = [x for x in path if x[0] in ("c", "m", "l")]
        # Retangulo GIRADO tem que virar path. _path_shape devolve a caixa
        # alinhada aos eixos, entao uma etiqueta inclinada viraria um retangulo
        # reto e maior — o erro aparece como uma borda grossa em volta dela.
        # Na matriz, giro/inclinacao vivem em b e c; escala e espelho, em a e d.
        girado = abs(gs.ctm[1]) > 1e-6 or abs(gs.ctm[2]) > 1e-6
        if rects and not curvas and not girado:
            sh = self._path_shape(path, gs.ctm)
            if sh and sh[0] == "rect":
                self.out.append(dict(op="fill", rect=list(sh[1:]), color=gs.fill,
                                     alpha=gs.alpha, clip=gs.clip))
            return
        d, caixa = self._svg_path(path, gs.ctm)
        if d and caixa:
            self.out.append(dict(op="path", d=d, rect=list(caixa), color=gs.fill,
                                 alpha=gs.alpha, clip=gs.clip))

    def _svg_path(self, path, ctm):
        """Converte o path do PDF para o `d` de um <path> SVG, ja em px.

        Os pontos sao transformados um a um pela CTM em vez de a forma inteira
        ser escalada depois: a matriz do Canva costuma ter escala negativa em Y,
        e aplicar isso no fim inverteria o desenho.
        """
        partes = []
        xs, ys = [], []

        def leva(px_, py_):
            x, y = self.to_px(*apply(ctm, px_, py_))
            xs.append(x)
            ys.append(y)
            return x, y

        for seg in path:
            if seg[0] == "m":
                x, y = leva(seg[1], seg[2])
                partes.append(f"M{x:.2f} {y:.2f}")
            elif seg[0] == "l":
                x, y = leva(seg[1], seg[2])
                partes.append(f"L{x:.2f} {y:.2f}")
            elif seg[0] == "c":
                x1, y1 = leva(seg[1], seg[2])
                x2, y2 = leva(seg[3], seg[4])
                x3, y3 = leva(seg[5], seg[6])
                partes.append(
                    f"C{x1:.2f} {y1:.2f} {x2:.2f} {y2:.2f} {x3:.2f} {y3:.2f}")
            elif seg[0] == "rect":
                rx, ry, rw, rh = seg[1:]
                a = leva(rx, ry)
                b = leva(rx + rw, ry)
                c = leva(rx + rw, ry + rh)
                d2 = leva(rx, ry + rh)
                partes.append(
                    f"M{a[0]:.2f} {a[1]:.2f}L{b[0]:.2f} {b[1]:.2f}"
                    f"L{c[0]:.2f} {c[1]:.2f}L{d2[0]:.2f} {d2[1]:.2f}Z")
        if not partes or not xs:
            return None, None
        return " ".join(partes) + "Z", [min(xs), min(ys), max(xs) - min(xs),
                                        max(ys) - min(ys)]

    def _stroke(self, gs, path):
        sh = self._path_shape(path, gs.ctm)
        if not sh or gs.salpha == 0:
            return
        sx = (gs.ctm[0] ** 2 + gs.ctm[1] ** 2) ** .5
        wpx = gs.lw * sx * abs(self.to_px(1, 0)[0] - self.to_px(0, 0)[0])
        self.out.append(dict(op="stroke", shape=sh, color=gs.stroke,
                             width=wpx, clip=gs.clip, alpha=gs.salpha))

    def _do(self, gs, name, res, depth):
        if not isinstance(name, str):
            return
        name = name.lstrip("/")
        m = re.search(r"/XObject\s*<<(.*?)>>", res, re.S)
        if not m:
            return
        r = re.search(r"/" + re.escape(name) + r"\s+(\d+)\s+0\s+R", m.group(1))
        if not r:
            return
        num = int(r.group(1))
        dt = self.pdf.dict_of(num)
        if "/Subtype /Image" in dt.replace("\n", " ") or "/Subtype/Image" in dt:
            self._image(gs, num, dt)
        elif "/Form" in dt:
            sub = self.pdf.stream(num)
            mm = re.search(r"/Matrix\s*\[([^\]]*)\]", dt)
            ctm = gs.ctm
            if mm:
                ctm = mmul([float(x) for x in mm.group(1).split()], ctm)
            sres = dt
            w = Walker(self.pdf, self.base, self.to_px)
            w.run(sub, sres, ctm, depth + 1)
            for o in w.out:
                if o.get("clip") is None:
                    o["clip"] = gs.clip
                # grupo de transparencia: compoe com a alpha do pai
                o["alpha"] = o.get("alpha", 1.0) * gs.alpha
            self.out.extend(w.out)

    def _image(self, gs, num, dt):
        c = gs.ctm
        # cantos da imagem unitaria
        p00 = self.to_px(*apply(c, 0, 0))
        p11 = self.to_px(*apply(c, 1, 1))
        x0, x1 = sorted([p00[0], p11[0]])
        y0, y1 = sorted([p00[1], p11[1]])
        # v=1 é o topo da imagem; se ele cair ABAIXO de v=0 em px, esta espelhada
        top_v1 = self.to_px(*apply(c, 0, 1))[1]
        top_v0 = self.to_px(*apply(c, 0, 0))[1]
        self.out.append(dict(op="image", xobj=num,
                             rect=[x0, y0, x1 - x0, y1 - y0],
                             flip_y=top_v1 > top_v0,
                             alpha=gs.alpha, clip=gs.clip))

    def _font_obj(self, res, name):
        """resolve /Fnn no /Font do recurso corrente -> numero do objeto"""
        if not isinstance(name, str):
            return None
        name = name.lstrip("/")
        m = re.search(r"/Font\s+(\d+)\s+0\s+R", res)
        fd = self.pdf.dict_of(int(m.group(1))) if m else None
        if fd is None:
            m = re.search(r"/Font\s*<<(.*?)>>", res, re.S)
            fd = m.group(1) if m else ""
        r = re.search(r"/" + re.escape(name) + r"\s+(\d+)\s+0\s+R", fd)
        return int(r.group(1)) if r else None

    def _tipo3(self, fnum):
        """Se a fonte for Type3, devolve (FontMatrix, {cid: obj do CharProc},
        Widths, FirstChar). Senao, None.

        Type3 e uma fonte cujos glifos sao PROCEDIMENTOS DE DESENHO, nao
        contornos TrueType. O Canva usa isto para efeito de contorno no texto:
        cada letra vira um desenho vetorial proprio. Sem tratar este caso o
        efeito some — nao ha FontFile2 para extrair, e o texto sai vazio.
        """
        d = self.pdf.dict_of(fnum)
        if "/Subtype /Type3" not in d and "/Subtype/Type3" not in d:
            return None
        fm = re.search(r"/FontMatrix\s*\[([^\]]*)\]", d)
        matriz = [float(x) for x in fm.group(1).split()] if fm else \
            [0.001, 0, 0, 0.001, 0, 0]
        cp = re.search(r"/CharProcs\s+(\d+)\s+0\s+R", d)
        procs = {}
        if cp:
            txt = self.pdf.dict_of(int(cp.group(1)))
            for nome, num in re.findall(r"/(\S+)\s+(\d+)\s+0\s+R", txt):
                procs[nome] = int(num)
        larg = re.search(r"/Widths\s*\[([^\]]*)\]", d)
        widths = [float(x) for x in larg.group(1).split()] if larg else []
        fc = re.search(r"/FirstChar\s+(\d+)", d)
        # /Encoding mapeia codigo -> nome do glifo (gN)
        enc = {}
        me = re.search(r"/Encoding\s+(\d+)\s+0\s+R", d)
        if me:
            et = self.pdf.dict_of(int(me.group(1)))
            m = re.search(r"/Differences\s*\[(.*?)\]", et, re.S)
            if m:
                atual = 0
                for tok in re.findall(r"(\d+)|/(\S+)", m.group(1)):
                    if tok[0]:
                        atual = int(tok[0])
                    else:
                        enc[atual] = tok[1]
                        atual += 1
        return dict(matriz=matriz, procs=procs, widths=widths,
                    first=int(fc.group(1)) if fc else 0, enc=enc)

    def _desenha_tipo3(self, gs, trm, t3, cids, size, depth):
        """Executa o procedimento de cada glifo Type3 e emite os paths."""
        pen = 0.0
        for cid in cids:
            nome = t3["enc"].get(cid) or f"g{cid:X}" if t3["enc"] else f"g{cid:X}"
            obj = t3["procs"].get(nome)
            if obj is None and t3["procs"]:
                # alguns exportadores nomeiam sem zero a esquerda
                obj = t3["procs"].get(f"g{cid:x}") or t3["procs"].get(str(cid))
            if obj is not None:
                # glifo -> texto: FontMatrix, depois corpo, depois Tm e CTM
                m = mmul(t3["matriz"], [size, 0, 0, size, pen, 0])
                try:
                    sub = Walker(self.pdf, self.base, self.to_px)
                    sub.run(self.pdf.stream(obj), "", mmul(m, trm), depth + 1)
                    for o in sub.out:
                        if o["op"] in ("path", "fill"):
                            # a cor do glifo e a cor do texto, nao a do proc
                            o["color"] = gs.fill
                            o["alpha"] = gs.alpha
                            o.setdefault("clip", gs.clip)
                            self.out.append(o)
                except Exception:
                    pass
            i = cid - t3["first"]
            larg = t3["widths"][i] if 0 <= i < len(t3["widths"]) else 0.0
            pen += larg * t3["matriz"][0] * size

    def _emit_text(self, gs, text, res):
        for r in text["runs"]:
            trm = mmul(r["tm"], gs.ctm)
            x, y = self.to_px(*apply(trm, 0, 0))
            sx = (trm[0] ** 2 + trm[1] ** 2) ** .5
            # to_px tambem escala pt->px; o corpo da fonte precisa da mesma escala
            ppu = abs(self.to_px(1, 0)[0] - self.to_px(0, 0)[0])
            size = r["size"] * sx * ppu
            fobj = self._font_obj(res, r["font"])
            t3 = self._tipo3(fobj) if fobj else None

            # Quantos bytes por codigo de glifo. Type0/Identity-H usa 2; Type3 e
            # as fontes simples usam 1. Assumir 2 sempre fazia a string de 1
            # byte do Type3 virar lista vazia — o efeito de contorno sumia sem
            # erro nenhum.
            passo = 1 if t3 else 2

            def decodifica(b: bytes, n: int = passo) -> list:
                return [int.from_bytes(b[i:i + n], "big")
                        for i in range(0, len(b) - len(b) % n, n)]

            raw = r["data"]
            cids = []
            if isinstance(raw, bytes):
                cids = decodifica(raw)
            elif isinstance(raw, list):          # operando de TJ
                for el in raw:
                    if isinstance(el, bytes):
                        cids += decodifica(el)
            if t3 and t3["procs"]:
                self._desenha_tipo3(gs, trm, t3, cids, r["size"], 0)
                continue

            # Rotacao da linha de base, tirada da matriz de texto.
            #
            # Sem isto um titulo inclinado sai em escada: cada glifo cai no seu
            # x/y certo, mas todos em pe, e a linha "sobe" degrau a degrau. O
            # eixo x do texto e (a, b); em px o y inverte, entao o angulo visual
            # e atan2(-b, a).
            ang = math.degrees(math.atan2(-trm[1], trm[0]))
            if abs(ang) < 0.05:
                ang = 0.0

            self.out.append(dict(op="text", x=x, baseline=y, size=size, rot=round(ang, 3),
                                 color=r["fill"], fontref=r["font"],
                                 fontobj=fobj,
                                 cids=cids, alpha=gs.alpha))

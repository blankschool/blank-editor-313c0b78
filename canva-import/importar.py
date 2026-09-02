#!/usr/bin/env python3
"""Link do Canva -> design editavel na biblioteca do app.

Amarra as pecas que ja existiam soltas:

  1. resolve o link e exporta PDF + PNGs de referencia  (MCP nao, HTTP direto)
  2. extrai o content stream                             canva-DAHT4NFiofA/extract.py
  3. funde os subsets de fonte                           canva-DAHT4NFiofA/mergefonts.py
  4. sobe assets e fontes para templates/<slug>/         Supabase Storage
  5. traduz model.json -> DocCanvas                      o formato do editor
  6. grava em public.designs                             aparece na biblioteca

O passo 6 e o que responde "colocar um link novo e virar design": a tabela
`designs` tem `doc jsonb`, e o app le exatamente isso. Nao ha importador a
escrever no app — a linha no banco JA e o design.

CAMINHO LOCAL. E o mesmo trabalho que um worker na VPS faria; a diferenca e
quem dispara. Python + fontTools + Chromium nao rodam no app nem em Edge
Function, entao a conversao vive fora de qualquer jeito.

Uso:
    python3 importar.py --link https://canva.link/xxxx --slug meu-carrossel
    python3 importar.py --design-id DAHT4NFiofA --slug agrum --so-extrair
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
PIPELINE = HERE / "pipeline"                   # onde vivem extract/mergefonts
# Caminhos de máquina: cada dev/servidor aponta os seus via env; o padrão é o
# valor usado nesta máquina até aqui, então nada muda se ninguém setar nada.
ENV = Path(os.environ.get("CANVA_SUPABASE_ENV", "/Users/it4mi/Downloads/blank-editor-supabase.env"))
BASE = "https://sites-blank-editor-supabase.ickanz.easypanel.host"
BUCKET = "templates"
VENV = Path(os.environ.get("CANVA_VENV", "/Users/it4mi/Downloads/canva-page1/.venv/bin/python"))

TIPOS = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
         ".woff2": "font/woff2", ".json": "application/json; charset=utf-8"}
CACHE = "public, max-age=31536000, immutable"


def chave() -> str:
    for line in ENV.read_text().splitlines():
        if line.startswith("SERVICE_ROLE_KEY="):
            return line.split("=", 1)[1].strip().strip('"')
    raise SystemExit("SERVICE_ROLE_KEY nao encontrada")


def sql(q: str):
    req = urllib.request.Request(
        f"{BASE}/pg/query", data=json.dumps({"query": q}).encode(), method="POST",
        headers={"apikey": chave(), "Authorization": f"Bearer {chave()}",
                 "content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"SQL falhou {e.code}: {e.read().decode()[:400]}")


def lit(v) -> str:
    return "null" if v is None else "'" + str(v).replace("'", "''") + "'"


def subir(caminho: str, dados: bytes, mime: str, cache: str = CACHE) -> int:
    req = urllib.request.Request(
        f"{BASE}/storage/v1/object/{BUCKET}/{caminho}", data=dados, method="POST",
        headers={"apikey": chave(), "Authorization": f"Bearer {chave()}",
                 "content-type": mime, "cache-control": cache, "x-upsert": "true"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print(f"      {e.code}: {e.read().decode()[:120]}")
        return e.code


def baixar_publico(caminho: str) -> bytes | None:
    """GET num objeto publico do bucket. None se nao existir (400/404)."""
    try:
        with urllib.request.urlopen(
            f"{BASE}/storage/v1/object/public/{BUCKET}/{caminho}", timeout=30
        ) as r:
            return r.read()
    except urllib.error.HTTPError:
        return None


def atualizarCatalogo(slug: str, nome: str) -> None:
    """Mantem templates/manifest.json com um item por template pronto (com doc.json).

    E o catalogo que o app le pra montar o menu "Novo design" — sem isto,
    cada template novo exigiria mexer no codigo do app (era assim antes: uma
    lista fixa em estudio-doc.ts, que ficava pra tras a cada import).
    cache "no-cache" de proposito: o app precisa ver o template novo na hora
    seguinte que abrir o menu, nao daqui a um ano (o cache-control padrao do
    bucket).
    """
    dados = baixar_publico("manifest.json")
    catalogo = json.loads(dados) if dados else []
    catalogo = [t for t in catalogo if t.get("slug") != slug]
    catalogo.append({"slug": slug, "nome": nome})
    subir("manifest.json", json.dumps(catalogo, ensure_ascii=False).encode(),
          "application/json; charset=utf-8", cache="no-cache")


# ----------------------------------------------------- model.json -> DocCanvas

def metricas_das_fontes(trab: Path) -> dict:
    """Le o fonts.json que o mergefonts gerou.

    O fontTools vive no venv do pipeline, nao no python que roda este
    orquestrador — por isso quem tem a biblioteca aberta e quem escreve os
    numeros.
    """
    arq = trab / "fonts" / "fonts.json"
    return json.loads(arq.read_text(encoding="utf-8")) if arq.exists() else {}


# sufixos de nome de arquivo de fonte -> a familia legivel
SUFIXOS = ("-Bd", "-Bold", "-Rg", "-Regular", "-Lt", "-Light", "-Md", "-Medium",
           "-Sb", "-Semibold", "-Blk", "-Black", "-It", "-Italic", "-Th", "-Thin")


def familia_de(base: str) -> str:
    """TTCommonsPro-Bd -> "TT Commons Pro"; NYTFranklin-Light -> "NYTFranklin".

    O peso sai do OS/2, entao o sufixo do arquivo so atrapalha aqui: manter
    "-Bd" no nome da familia faria Bold e Regular virarem familias diferentes e
    o browser nao saberia alternar entre elas.
    """
    nome = base
    for s in SUFIXOS:
        if nome.endswith(s):
            nome = nome[: -len(s)]
            break
    # CamelCase -> palavras, so quando nao ha espaco nem hifen
    if " " not in nome and "-" not in nome:
        nome = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", nome)
    return nome.strip() or base


def para_doccanvas(model: dict, slug: str, nome: str, met: dict | None = None) -> dict:
    """Traduz a saida do extrator para o formato que o editor entende.

    A correspondencia e quase 1:1 — o DocCanvas do app ja tem tudo que o Canva
    exige. Os unicos ajustes reais:

    - `rect` [x,y,w,h] vira campos separados
    - `clip` (o Canva desenha a imagem maior e recorta) vira moldura + `img`:
      a moldura e a janela visivel, `img` e a foto por tras dela
    - `flip_y` vira `espelhoY`
    - o degrade tem opacidade propria, que sem isto sairia opaco
    """
    base = f"{BASE}/storage/v1/object/public/{BUCKET}/{slug}"
    paginas = []
    for p in model["pages"]:
        camadas = []
        for i, l in enumerate(p["layers"]):
            cid = f"p{p['n']}-{i}"
            if l["t"] == "image":
                x, y, w, h = l["rect"]
                arq = l["src"].split("/")[-1]
                c: dict = {"tipo": "imagem", "id": cid, "nome": arq,
                           "src": f"{base}/{arq}"}
                cl = l.get("clip")
                if cl:
                    # moldura = a janela; img = a foto, em coordenadas da moldura
                    c |= {"x": round(cl[0], 2), "y": round(cl[1], 2),
                          "w": round(cl[2], 2), "h": round(cl[3], 2),
                          "img": {"x": round(x - cl[0], 2), "y": round(y - cl[1], 2),
                                  "w": round(w, 2), "h": round(h, 2)}}
                else:
                    # `img` explicito mesmo sem recorte: no PDF a matriz define a
                    # caixa exata e a imagem e ESTICADA nela, inclusive fora de
                    # proporcao. Sem isto o render cai no `cover`, que preserva a
                    # proporcao e recorta — a textura de fundo (1600x1600 numa
                    # caixa 1080x1350) sai com outro enquadramento.
                    c |= {"x": round(x, 2), "y": round(y, 2),
                          "w": round(w, 2), "h": round(h, 2),
                          "img": {"x": 0, "y": 0,
                                  "w": round(w, 2), "h": round(h, 2)}}
                if l.get("flip_y"):
                    c["espelhoY"] = True
                if l.get("opacity", 1) < 0.999:
                    c["opacidade"] = round(l["opacity"], 3)
                camadas.append(c)

            elif l["t"] == "path":
                # Desenho vetorial: halftone, contorno de titulo, forma livre.
                # Fica em vetor de proposito — escala sem perder nitidez e a cor
                # continua editavel, o que rasterizar jogaria fora.
                x, y, w, h = l["rect"]
                camadas.append({
                    "tipo": "path", "id": cid,
                    "nome": f"desenho {l.get('n', 1)}x" if l.get("n", 1) > 1 else "desenho",
                    "x": round(x, 2), "y": round(y, 2),
                    "w": round(w, 2), "h": round(h, 2),
                    "d": l["d"], "cor": l["color"],
                    **({"opacidade": round(l["opacity"], 3)}
                       if l.get("opacity", 1) < 0.999 else {}),
                })

            elif l["t"] == "fill":
                x, y, w, h = l["rect"]
                f: dict = {"tipo": "forma", "id": cid, "nome": "retângulo",
                           "x": round(x, 2), "y": round(y, 2),
                           "w": round(w, 2), "h": round(h, 2), "cor": l["color"]}
                if l.get("opacity", 1) < 0.999:
                    f["opacidade"] = round(l["opacity"], 3)
                camadas.append(f)

            else:  # texto
                m = (met or {}).get(l["font"])
                # baseline -> topo da caixa. Com entrelinha = (asc+desc)*corpo o
                # meio-leading e zero, entao topo = baseline - asc*corpo.
                # sem metrica conhecida cai num padrao neutro, mas isso e sinal
                # de que a fonte nao foi extraida — vale conferir
                asc = m["asc"] if m else 1.0
                desc = m["desc"] if m else 0.25
                corpo = l["size"]
                camadas.append({
                    "tipo": "texto", "id": cid,
                    "nome": (l["text"] or "")[:34] or "texto",
                    "x": round(l["x"], 2),
                    "y": round(l["baseline"] - asc * corpo, 2),
                    "fonte": m["familia"] if m else familia_de(l["font"]),
                    "peso": m["peso"] if m else 400,
                    "tamanho": round(corpo, 2),
                    "entrelinha": round((asc + desc) * corpo, 2),
                    "cor": l["color"],
                    "texto": l["text"],
                    **({"entreLetras": round(l["ls"], 3)}
                       if abs(l.get("ls") or 0) > 0.01 else {}),
                    # A rotacao do texto NAO entra como `rotacao`: o CSS gira
                    # pelo centro da caixa e o PDF gira pela origem da linha de
                    # base. Como cada glifo ja vem no seu x/y proprio, a
                    # inclinacao da linha aparece sozinha; girar pelo centro so
                    # deslocaria cada letra. Medido: 22.47 sem, 22.74 com.
                })
        paginas.append({"id": f"p{p['n']}", "nome": f"Tela {p['n']}",
                        "largura": p["w"], "altura": p["h"],
                        "fundo": p["bg"], "camadas": camadas})
    base_url = f"{BASE}/storage/v1/object/public/{BUCKET}/{slug}"
    fontes = [
        {"familia": v["familia"], "peso": v["peso"],
         "url": f"{base_url}/fonts/{v['arquivo']}"}
        for v in (met or {}).values()
    ]
    return {"kind": "canvas", "nome": nome, "paginas": paginas, "fontes": fontes}




# ------------------------------------------------------------------- etapas

def resolver(link: str) -> str:
    """canva.link/xxx -> design id. Link completo tambem serve."""
    m = re.search(r"canva\.com/design/([A-Za-z0-9_-]{11})", link)
    if m:
        return m.group(1)
    m = re.search(r"canva\.link/([A-Za-z0-9]+)", link)
    if not m:
        raise SystemExit("nao reconheci o link; passe --design-id")
    raise SystemExit(
        f"shortlink '{m.group(1)}' precisa ser resolvido pelo MCP do Canva.\n"
        "Peca ao agente para rodar resolve-shortlink e passe --design-id.")


def rodar(cmd: list[str], cwd: Path) -> None:
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if r.returncode:
        print(r.stdout[-1500:]); print(r.stderr[-1500:])
        raise SystemExit(f"falhou: {' '.join(cmd[:2])}")
    print("   ", (r.stdout.strip().splitlines() or ["ok"])[-1][:100])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--link")
    ap.add_argument("--design-id")
    ap.add_argument("--slug", required=True)
    ap.add_argument("--nome")
    ap.add_argument("--pdf", help="PDF ja baixado (pula o export)")
    ap.add_argument("--so-extrair", action="store_true",
                    help="extrai e traduz, sem subir nem gravar")
    a = ap.parse_args()

    did = a.design_id or (resolver(a.link) if a.link else None)
    if not did and not a.pdf:
        raise SystemExit("passe --design-id, --link ou --pdf")

    trab = HERE / f"import-{a.slug}"
    trab.mkdir(exist_ok=True)
    for f in ("pdfextract.py", "extract.py", "mergefonts.py"):
        shutil.copy(PIPELINE / f, trab / f)

    pdf = Path(a.pdf) if a.pdf else trab / "carrossel.pdf"
    if a.pdf:
        shutil.copy(a.pdf, trab / "carrossel.pdf")
    if not (trab / "carrossel.pdf").exists():
        raise SystemExit(
            f"PDF ausente. Exporte o design {did} em PDF pro e passe --pdf.\n"
            "O export precisa do MCP do Canva (export-design).")

    print(f"[1/5] extraindo {a.slug}")
    rodar([str(VENV), "extract.py"], trab)

    print("[2/5] fundindo fontes")
    rodar([str(VENV), "mergefonts.py"], trab)

    model = json.loads((trab / "model.json").read_text(encoding="utf-8"))
    nome = a.nome or a.slug.replace("-", " ").title()
    met = metricas_das_fontes(trab)
    resumo = ", ".join(f"{v['familia']} {v['peso']}" for v in met.values())
    print(f"    fontes: {resumo}")
    doc = para_doccanvas(model, a.slug, nome, met)
    (trab / "doccanvas.json").write_text(
        json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    nc = sum(len(p["camadas"]) for p in doc["paginas"])
    print(f"[3/5] DocCanvas: {len(doc['paginas'])} paginas, {nc} camadas")

    if a.so_extrair:
        print(f"\nparou em --so-extrair. Veja {trab/'doccanvas.json'}")
        return 0

    print("[4/5] subindo assets e fontes")
    n = 0
    for p in sorted((trab / "assets").glob("*")):
        if p.suffix.lower() in TIPOS:
            if subir(f"{a.slug}/{p.name}", p.read_bytes(), TIPOS[p.suffix.lower()]) in (200, 201):
                n += 1
    for p in sorted((trab / "fonts").glob("*.woff2")):
        if subir(f"{a.slug}/fonts/{p.name}", p.read_bytes(), TIPOS[".woff2"]) in (200, 201):
            n += 1
    print(f"    {n} arquivos no bucket")

    # O doc tambem vai para o bucket: e assim que o app oferece o template no
    # menu "Novo design" sem carregar 600 KB de vetor no bundle.
    subir(f"{a.slug}/doc.json",
          json.dumps(doc, ensure_ascii=False).encode(),
          "application/json; charset=utf-8")
    atualizarCatalogo(a.slug, nome)

    print("[5/5] gravando o design")
    proj = sql("select id, owner from public.projects order by criado_em limit 1")
    if not proj:
        raise SystemExit("nenhum projeto em public.projects; crie um no app antes")
    pid, owner = proj[0]["id"], proj[0]["owner"]
    r = sql(f"""
      insert into public.designs (project_id, owner, nome, tipo, doc)
      values ('{pid}', '{owner}', {lit(nome)}, 'tela',
              {lit(json.dumps(doc, ensure_ascii=False))}::jsonb)
      returning id""")
    print(f"\n  design {r[0]['id']}")
    print(f"  abra:  http://localhost:8080/d/{r[0]['id']}/editar")
    return 0


if __name__ == "__main__":
    sys.exit(main())

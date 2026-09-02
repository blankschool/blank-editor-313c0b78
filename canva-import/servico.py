#!/usr/bin/env python3
"""Serviço de importação: recebe um PDF do Canva e devolve um design editável.

É o `importar.py` atrás de HTTP. A conversão precisa de Python, fontTools e
Chromium — nada disso roda no app (Vite/TanStack) nem numa Edge Function —,
então ela vive fora e o app chama.

Este é o mesmo processo que rodaria num worker na VPS. A diferença é só quem
hospeda: aqui é a sua máquina, lá seria um container. O contrato HTTP não muda,
então mover depois não mexe no app.

Sem dependências: só a stdlib.

    python3 servico.py            # sobe em http://localhost:8790
    python3 servico.py --porta 9000

Contrato:
    GET  /saude              -> {"ok": true}
    POST /importar           multipart: pdf, slug, nome
                             -> {"design_id", "paginas", "camadas", "url"}
"""
from __future__ import annotations

import argparse
import cgi
import json
import re
import shutil
import subprocess
import sys
import traceback
import unicodedata
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from importar import (  # noqa: E402
    PIPELINE, TIPOS, VENV, atualizarCatalogo, lit, metricas_das_fontes,
    para_doccanvas, sql, subir,
)


class PdfAchatado(RuntimeError):
    """O PDF veio como foto da pagina: nao ha camadas para extrair."""


HERE = Path(__file__).parent
# O app roda em 8080/8081 conforme a porta livre; o navegador exige CORS
# explícito para um serviço em porta diferente.
ORIGENS = ["http://localhost:8080", "http://localhost:8081", "http://localhost:5173"]


def slugificar(txt: str) -> str:
    s = unicodedata.normalize("NFD", txt or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "import"


def converter(pdf_bytes: bytes, slug: str, nome: str) -> dict:
    """pdf -> assets no bucket + linha em public.designs"""
    trab = HERE / f"import-{slug}"
    if trab.exists():
        shutil.rmtree(trab)
    trab.mkdir(parents=True)
    for f in ("pdfextract.py", "extract.py", "mergefonts.py"):
        shutil.copy(PIPELINE / f, trab / f)
    (trab / "carrossel.pdf").write_bytes(pdf_bytes)

    for etapa in ("extract.py", "mergefonts.py"):
        r = subprocess.run([str(VENV), etapa], cwd=trab, capture_output=True, text=True)
        if r.returncode:
            raise RuntimeError(f"{etapa}: {(r.stderr or r.stdout)[-600:]}")

    model = json.loads((trab / "model.json").read_text(encoding="utf-8"))

    # O extrator marca as paginas que o Canva exportou como foto da tela.
    # Se TODAS vierem assim, gravar o design so entregaria uma camada de
    # imagem — melhor recusar e dizer como reexportar.
    achatadas = [p["n"] for p in model["pages"] if p.get("flat")]
    if achatadas and len(achatadas) == len(model["pages"]):
        raise PdfAchatado(
            "Este PDF foi exportado achatado: cada pagina e uma imagem unica, "
            "sem texto nem camadas.")

    # metricas de fonte: sem elas o texto perde familia, peso e a altura da
    # caixa (o topo sai do ascender). O mergefonts ja rodou acima.
    met = metricas_das_fontes(trab)
    doc = para_doccanvas(model, slug, nome, met)

    enviados = 0
    for p in sorted((trab / "assets").glob("*")):
        if p.suffix.lower() in TIPOS:
            if subir(f"{slug}/{p.name}", p.read_bytes(), TIPOS[p.suffix.lower()]) in (200, 201):
                enviados += 1
    for p in sorted((trab / "fonts").glob("*.woff2")):
        if subir(f"{slug}/fonts/{p.name}", p.read_bytes(), TIPOS[".woff2"]) in (200, 201):
            enviados += 1

    # doc.json + manifesto: e o que faz o template aparecer no menu
    # "Novo design" do app sem mexer em codigo.
    subir(f"{slug}/doc.json", json.dumps(doc, ensure_ascii=False).encode(),
          TIPOS[".json"])
    atualizarCatalogo(slug, nome)

    proj = sql("select id, owner from public.projects order by criado_em limit 1")
    if not proj:
        raise RuntimeError("nenhum projeto em public.projects — crie um no app antes")
    r = sql(f"""
      insert into public.designs (project_id, owner, nome, tipo, doc)
      values ('{proj[0]['id']}', '{proj[0]['owner']}', {lit(nome)}, 'tela',
              {lit(json.dumps(doc, ensure_ascii=False))}::jsonb)
      returning id""")

    return {
        "design_id": r[0]["id"],
        "paginas": len(doc["paginas"]),
        "camadas": sum(len(p["camadas"]) for p in doc["paginas"]),
        "arquivos": enviados,
        "paginas_achatadas": achatadas,
        "fontes": len(doc.get("fontes") or []),
        "slug": slug,
        "nome": nome,
    }



class Handler(BaseHTTPRequestHandler):
    def _cors(self) -> None:
        origem = self.headers.get("Origin", "")
        self.send_header("Access-Control-Allow-Origin",
                         origem if origem in ORIGENS else ORIGENS[0])
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "content-type")

    def _json(self, code: int, corpo: dict) -> None:
        dados = json.dumps(corpo, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(dados)))
        self._cors()
        self.end_headers()
        self.wfile.write(dados)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path.startswith("/saude"):
            self._json(200, {"ok": True})
        else:
            self._json(404, {"erro": "rota desconhecida"})

    def do_POST(self) -> None:  # noqa: N802
        if not self.path.startswith("/importar"):
            self._json(404, {"erro": "rota desconhecida"})
            return
        try:
            form = cgi.FieldStorage(
                fp=self.rfile, headers=self.headers,
                environ={"REQUEST_METHOD": "POST",
                         "CONTENT_TYPE": self.headers.get("content-type", "")})
            item = form["pdf"] if "pdf" in form else None
            pdf = item.file.read() if item is not None and item.file else b""
            if not pdf[:5] == b"%PDF-":
                self._json(400, {"erro": "envie o PDF exportado do Canva"})
                return
            nome = (form.getfirst("nome") or "").strip() or "Design importado"
            slug = slugificar(form.getfirst("slug") or nome)
            print(f"  importando {slug!r} ({len(pdf)/1e6:.1f} MB)…", flush=True)
            r = converter(pdf, slug, nome)
            print(f"  ok: design {r['design_id']} — {r['paginas']} páginas", flush=True)
            self._json(200, r)
        except Exception as e:  # noqa: BLE001
            traceback.print_exc()
            self._json(500, {"erro": str(e)[:500]})

    def log_message(self, *a) -> None:  # silencia o log padrão
        pass


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--porta", type=int, default=8790)
    a = ap.parse_args()
    srv = ThreadingHTTPServer(("127.0.0.1", a.porta), Handler)
    print(f"serviço de importação em http://localhost:{a.porta}")
    print("  POST /importar   (multipart: pdf, nome, slug)")
    print("  GET  /saude")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nencerrado")
    return 0


if __name__ == "__main__":
    sys.exit(main())

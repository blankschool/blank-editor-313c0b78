/**
 * DocCanvas → PNG.
 *
 * Rasteriza a MESMA marcação que o preview HTML (`paginaHtml`), então o arquivo
 * sai sem alça, sem contorno de seleção, sem guia e sem overlay de recorte —
 * eles nem existem nesse gerador — e já respeita rotação da camada, rotação e
 * enquadramento da foto dentro da moldura, raio e máscara.
 *
 * Detalhe do meio de campo: a marcação vai dentro de um `<foreignObject>` de
 * SVG, e um SVG usado como imagem não busca recurso externo. Por isso fonte e
 * imagem entram embutidas em data URL antes de rasterizar; sem isso o PNG sai
 * com a letra errada e sem foto.
 */
import { facesDe, paginaHtml } from "@/lib/canvas-html";
import type { DocCanvas } from "@/lib/estudio-doc";

const cacheDataUrl = new Map<string, string>();

async function paraDataUrl(url: string): Promise<string | null> {
  if (cacheDataUrl.has(url)) return cacheDataUrl.get(url)!;
  if (url.startsWith("data:")) return url;
  try {
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) return null;
    const blob = await r.blob();
    const dado = await new Promise<string | null>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
    if (dado) cacheDataUrl.set(url, dado);
    return dado;
  } catch {
    return null;
  }
}

/** troca cada URL citada no trecho (src="…" ou url('…')) pelo data URL dela */
async function embutirUrls(trecho: string, padrao: RegExp): Promise<string> {
  const alvos = new Set<string>();
  for (const m of trecho.matchAll(padrao)) {
    const u = m[1];
    if (u && !u.startsWith("data:")) alvos.add(u);
  }
  const pares = await Promise.all(
    [...alvos].map(async (u) => [u, await paraDataUrl(u)] as const),
  );
  let saida = trecho;
  for (const [u, dado] of pares) {
    if (dado) saida = saida.split(u).join(dado);
  }
  return saida;
}

async function svgDaPagina(doc: DocCanvas, indice: number): Promise<string | null> {
  const p = doc.paginas[indice];
  if (!p) return null;
  const w = Math.max(1, Math.round(p.largura || 1080));
  const h = Math.max(1, Math.round(p.altura || 1440));

  const [corpo, faces] = await Promise.all([
    embutirUrls(paginaHtml(p), /src="([^"]+)"/g),
    embutirUrls(facesDe(doc), /url\('([^']+)'\)/g),
  ]);

  const estilo = `${faces}\n*{box-sizing:border-box;margin:0}\n.pagina{text-rendering:geometricPrecision;-webkit-font-smoothing:antialiased}`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<foreignObject width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px">` +
    `<style>${estilo}</style>${corpo}</div>` +
    `</foreignObject></svg>`
  );
}

/** Uma página do canvas como PNG, no tamanho do documento vezes `escala`. */
export async function paginaCanvasParaPng(
  doc: DocCanvas,
  indice: number,
  escala = 2,
): Promise<Blob | null> {
  const p = doc.paginas[indice];
  const svg = await svgDaPagina(doc, indice);
  if (!p || !svg) return null;
  const w = Math.max(1, Math.round(p.largura || 1080));
  const h = Math.max(1, Math.round(p.altura || 1440));

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const img = new window.Image();
  const carregou = await new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
  if (!carregou) return null;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * escala);
  canvas.height = Math.round(h * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(escala, escala);
  ctx.fillStyle = p.fundo ?? "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** índice (0-based) da página aberta no palco */
export function indiceDaPagina(doc: DocCanvas, paginaId: string | null): number {
  if (!paginaId) return 0;
  const i = doc.paginas.findIndex((p, j) => (p.id ?? `p${j + 1}`) === paginaId);
  return i < 0 ? 0 : i;
}

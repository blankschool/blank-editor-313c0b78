/**
 * DocCanvas → PNG.
 *
 * O PNG sai da mesma marcação do preview HTML (`paginaHtml`), então nada de
 * alça, contorno de seleção, guia ou overlay de recorte entra no arquivo — eles
 * não existem nesse gerador — e rotação, raio, máscara e enquadramento da foto
 * já vêm resolvidos.
 *
 * Só que o Chrome NÃO pinta imagem aninhada dentro de `<foreignObject>` de um
 * SVG usado como imagem, nem com a foto embutida em data URL. Por isso a página
 * é montada em passadas: as camadas de imagem vão direto no canvas 2D e o resto
 * (texto, forma, desenho) continua pelo SVG, que para esses funciona.
 */
import { facesDe, paginaHtml } from "@/lib/canvas-html";
import type { CanvasCamada, CanvasCamadaImagem, CanvasPagina, DocCanvas } from "@/lib/estudio-doc";

const cacheDataUrl = new Map<string, string>();
const cacheBitmap = new Map<string, ImageBitmap | HTMLImageElement | null>();

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

/** a foto pronta para `drawImage` — bitmap quando dá, `<img>` quando não dá */
async function carregarFoto(url: string): Promise<ImageBitmap | HTMLImageElement | null> {
  if (cacheBitmap.has(url)) return cacheBitmap.get(url)!;
  let saida: ImageBitmap | HTMLImageElement | null = null;
  try {
    const r = await fetch(url, { mode: "cors" });
    if (r.ok) {
      const blob = await r.blob();
      /* SVG não tem tamanho intrínseco garantido: createImageBitmap falha, o
         <img> resolve */
      if (blob.type.includes("svg")) {
        saida = await viaElemento(URL.createObjectURL(blob));
      } else {
        try {
          saida = await createImageBitmap(blob);
        } catch {
          saida = await viaElemento(URL.createObjectURL(blob));
        }
      }
    }
  } catch {
    saida = null;
  }
  if (!saida) saida = await viaElemento(url, true);
  cacheBitmap.set(url, saida);
  return saida;
}

function viaElemento(src: string, cors = false): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** troca cada URL citada no trecho (src="…" ou url('…')) pelo data URL dela */
async function embutirUrls(trecho: string, padrao: RegExp): Promise<string> {
  const alvos = new Set<string>();
  for (const m of trecho.matchAll(padrao)) {
    const u = m[1];
    if (u && !u.startsWith("data:")) alvos.add(u);
  }
  const pares = await Promise.all([...alvos].map(async (u) => [u, await paraDataUrl(u)] as const));
  let saida = trecho;
  for (const [u, dado] of pares) {
    if (dado) saida = saida.split(u).join(dado);
  }
  return saida;
}

/**
 * O `<foreignObject>` exige XML bem formado: uma tag vazia sem barra (`<img …>`,
 * `<br>`) faz o SVG inteiro falhar no parse e o PNG sair vazio, sem erro nenhum.
 */
function xhtml(markup: string): string {
  return markup
    .replace(/<(img|br|hr|input|source)\b([^>]*?)\/?>/g, "<$1$2/>")
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
}

/** desenha um grupo de camadas não-imagem, em cima do que já está no canvas */
async function pintarGrupoSvg(
  ctx: CanvasRenderingContext2D,
  doc: DocCanvas,
  pagina: CanvasPagina,
  camadas: CanvasCamada[],
  w: number,
  h: number,
): Promise<void> {
  if (!camadas.length) return;
  const fatia: CanvasPagina = { ...pagina, fundo: "transparent", camadas };
  const [corpo, faces] = await Promise.all([
    embutirUrls(xhtml(paginaHtml(fatia)), /src="([^"]+)"/g),
    embutirUrls(facesDe(doc), /url\('([^']+)'\)/g),
  ]);
  const estilo = `${faces}\n*{box-sizing:border-box;margin:0}\n.pagina{text-rendering:geometricPrecision;-webkit-font-smoothing:antialiased}`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<foreignObject width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px">` +
    `<style><![CDATA[${estilo}]]></style>${corpo}</div>` +
    `</foreignObject></svg>`;
  const img = await viaElemento(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  if (img) ctx.drawImage(img, 0, 0, w, h);
}

const raioSeguro = (raio: number | undefined, w: number, h: number) =>
  raio === undefined ? 0 : Math.max(0, Math.min(raio, Math.min(w, h) / 2));

/** a mesma conta do `object-fit: cover` do palco, para quando não há `img` */
function coverNatural(
  foto: ImageBitmap | HTMLImageElement,
  w: number,
  h: number,
): { x: number; y: number; w: number; h: number } {
  const nw = "naturalWidth" in foto ? foto.naturalWidth : foto.width;
  const nh = "naturalHeight" in foto ? foto.naturalHeight : foto.height;
  if (!nw || !nh) return { x: 0, y: 0, w, h };
  const k = Math.max(w / nw, h / nh);
  const lw = nw * k;
  const lh = nh * k;
  return { x: (w - lw) / 2, y: (h - lh) / 2, w: lw, h: lh };
}

/** uma camada de imagem, com moldura como janela fixa e foto por trás */
async function pintarImagem(ctx: CanvasRenderingContext2D, c: CanvasCamadaImagem): Promise<void> {
  if (!c.src) return; // placeholder é affordance de edição, não faz parte da arte
  const foto = await carregarFoto(c.src);
  if (!foto) return;

  const r = raioSeguro(c.raio, c.w, c.h);
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;

  ctx.save();
  ctx.globalAlpha = c.opacidade ?? 1;
  ctx.translate(cx, cy);
  if (c.rotacao) ctx.rotate((c.rotacao * Math.PI) / 180);
  ctx.translate(-c.w / 2, -c.h / 2);

  const moldura = new Path2D();
  moldura.roundRect(0, 0, c.w, c.h, r);

  if (c.sombra) {
    ctx.save();
    ctx.shadowColor = c.sombra.cor;
    ctx.shadowOffsetX = c.sombra.x;
    ctx.shadowOffsetY = c.sombra.y;
    ctx.shadowBlur = c.sombra.blur;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fill(moldura);
    ctx.restore();
  }

  ctx.clip(moldura);

  const cx2 = c.img ?? coverNatural(foto, c.w, c.h);
  ctx.translate(cx2.x + cx2.w / 2, cx2.y + cx2.h / 2);
  if (c.imgRot) ctx.rotate((c.imgRot * Math.PI) / 180);
  if (c.espelhoY) ctx.scale(1, -1);
  ctx.drawImage(foto, -cx2.w / 2, -cx2.h / 2, cx2.w, cx2.h);
  ctx.restore();
}

/** Uma página do canvas como PNG, no tamanho do documento vezes `escala`. */
export async function paginaCanvasParaPng(
  doc: DocCanvas,
  indice: number,
  escala = 2,
): Promise<Blob | null> {
  const p = doc.paginas[indice];
  if (!p) return null;
  const w = Math.max(1, Math.round(p.largura || 1080));
  const h = Math.max(1, Math.round(p.altura || 1440));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * escala);
  canvas.height = Math.round(h * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(escala, escala);
  ctx.fillStyle = p.fundo ?? "#ffffff";
  ctx.fillRect(0, 0, w, h);

  /* ordem de pintura preservada: acumula vizinhos não-imagem numa passada só */
  const visiveis = p.camadas.filter((c) => !c.oculto);
  let pendentes: CanvasCamada[] = [];
  for (const c of visiveis) {
    if (c.tipo === "imagem") {
      await pintarGrupoSvg(ctx, doc, p, pendentes, w, h);
      pendentes = [];
      await pintarImagem(ctx, c);
    } else {
      pendentes.push(c);
    }
  }
  await pintarGrupoSvg(ctx, doc, p, pendentes, w, h);

  return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** índice (0-based) da página aberta no palco */
export function indiceDaPagina(doc: DocCanvas, paginaId: string | null): number {
  if (!paginaId) return 0;
  const i = doc.paginas.findIndex((p, j) => (p.id ?? `p${j + 1}`) === paginaId);
  return i < 0 ? 0 : i;
}

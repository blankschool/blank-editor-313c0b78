/**
 * DocCanvas → HTML real.
 *
 * Este é o ÚNICO gerador de HTML do canvas. O palco (`Artboard` em Stage.tsx) e
 * este arquivo desenham o mesmo documento, e a regra é que os dois concordem
 * pixel a pixel — o preview, o export e o PNG saem todos daqui.
 *
 * O motivo de existir uma regra explícita: o modelo antigo tinha três
 * renderizadores do mesmo documento (`Artboard`, `docParaHtml` e `docParaPng`,
 * este último redesenhando tudo à mão no canvas 2d, com quebra de linha própria
 * e cores fixas). Três desenhos da mesma coisa divergem com o tempo, e o
 * sintoma é sempre o mesmo: "o PNG exportado não é igual ao que eu vi na tela".
 *
 * Ao mexer aqui, confira o bloco equivalente em Stage.tsx — e vice-versa. As
 * correspondências estão marcadas com `espelha:`.
 */
import type {
  CanvasCamada,
  CanvasCamadaImagem,
  CanvasCamadaTexto,
  CanvasPagina,
  DocCanvas,
} from "@/lib/estudio-doc";

const BUCKET =
  "https://sites-blank-editor-supabase.ickanz.easypanel.host/storage/v1/object/public/templates";

/** Fontes dos dois templates que nasceram no código. Servem de padrão quando o
 *  documento não traz `fontes` — um design importado sempre traz. */
const FONTES_PADRAO: FonteDoc[] = [
  {
    familia: "Anicon Sans",
    peso: 400,
    url: `${BUCKET}/agrum-eleicao/fonts/AniconSans-Regular.woff2`,
  },
  {
    familia: "NYT Franklin",
    peso: 300,
    url: `${BUCKET}/agrum-eleicao/fonts/NYTFranklin-Light.woff2`,
  },
  {
    familia: "NYT Franklin",
    peso: 600,
    url: `${BUCKET}/agrum-eleicao/fonts/NYTFranklin-Semibold.woff2`,
  },
  {
    familia: "NYT Franklin",
    peso: 700,
    url: `${BUCKET}/agrum-eleicao/fonts/NYTFranklin-Bold.woff2`,
  },
];

/** Uma fonte que o documento carrega consigo. */
export interface FonteDoc {
  familia: string;
  peso: number;
  url: string;
}

const esc = (s: string): string =>
  String(s).replace(/[&<>"]/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[c]};`);

/** `12` → `"12px"`; `undefined` some da folha em vez de virar "undefinedpx" */
const px = (v: number | undefined): string | null => (v === undefined ? null : `${v}px`);

/**
 * Monta a folha inline.
 *
 * A aspa dupla vira simples porque o valor vai dentro de `style="…"`: uma aspa
 * dupla no meio fecha o atributo, o browser descarta o resto da declaração e o
 * elemento renderiza com os padrões. É falha silenciosa — o HTML continua
 * válido e nada acusa. Aconteceu com `font-family:"Anicon Sans"`, que derrubou
 * todo o texto para 16px.
 */
const css = (pares: Array<[string, string | null | undefined]>): string =>
  pares
    .filter((p): p is [string, string] => p[1] !== null && p[1] !== undefined && p[1] !== "")
    .map(([k, v]) => `${k}:${v.replace(/"/g, "'")}`)
    .join(";");

/** espelha: transformRot() em Stage.tsx */
const rot = (c: CanvasCamada): string | null => {
  const r = (c as { rotacao?: number }).rotacao;
  return r ? `rotate(${r}deg)` : null;
};

const sombraCaixa = (c: { sombra?: { x: number; y: number; blur: number; cor: string } }) =>
  c.sombra ? `${c.sombra.x}px ${c.sombra.y}px ${c.sombra.blur}px ${c.sombra.cor}` : null;

const decoracao = (s?: {
  sublinhado?: boolean | undefined;
  riscado?: boolean | undefined;
}): string | null =>
  s?.sublinhado && s?.riscado
    ? "underline line-through"
    : s?.sublinhado
      ? "underline"
      : s?.riscado
        ? "line-through"
        : null;

/** o raio nunca passa da metade do menor lado — espelha o clamp do Stage */
const raioSeguro = (raio: number | undefined, w: number, h: number): string | null =>
  raio === undefined ? null : `${Math.min(raio, Math.min(w, h) / 2)}px`;

/* --------------------------------------------------------------- camadas */

function imagemHtml(c: CanvasCamadaImagem): string {
  if (!c.src) return ""; // placeholder é affordance de edição, não faz parte da arte

  const moldura = css([
    ["position", "absolute"],
    ["left", px(c.x)],
    ["top", px(c.y)],
    ["width", px(c.w)],
    ["height", px(c.h)],
    ["transform", rot(c)],
    ["overflow", "hidden"],
    ["border-radius", raioSeguro(c.raio, c.w, c.h)],
    ["opacity", c.opacidade === undefined ? null : String(c.opacidade)],
    ["box-shadow", sombraCaixa(c)],
  ]);

  // Duas geometrias independentes, como no palco: a moldura é a janela e a foto
  // se move por trás dela.
  //
  // Sem `img` gravado, `object-fit: cover` faz a mesma conta que coverImg() —
  // e faz melhor, porque o browser conhece o tamanho natural do arquivo, que
  // aqui na geração ainda não se sabe.
  const espelho = c.espelhoY ? "scaleY(-1)" : "";
  const giro = c.imgRot ? `rotate(${c.imgRot}deg)` : "";
  const transformada = [giro, espelho].filter(Boolean).join(" ");

  const foto = c.img
    ? css([
        ["position", "absolute"],
        ["display", "block"],
        ["left", px(c.img.x)],
        ["top", px(c.img.y)],
        ["width", px(c.img.w)],
        ["height", px(c.img.h)],
        /* resets de CSS costumam impor `img { max-width: 100% }`, o que encolheria
           a foto para a largura da moldura e quebraria o enquadramento gravado */
        ["max-width", "none"],
        ["max-height", "none"],
        ["transform", transformada || null],
        ["transform-origin", "center center"],
      ])
    : css([
        ["position", "absolute"],
        ["display", "block"],
        ["inset", "0"],
        ["width", "100%"],
        ["height", "100%"],
        ["object-fit", "cover"],
        ["transform", transformada || null],
        ["transform-origin", "center center"],
      ]);

  const alt = c.nome ? esc(c.nome) : "";
  return `<div style="${moldura}"><img src="${esc(c.src)}" alt="${alt}" style="${foto}"></div>`;
}

function formaHtml(c: Extract<CanvasCamada, { tipo: "forma" }>): string {
  const s = css([
    ["position", "absolute"],
    ["left", px(c.x)],
    ["top", px(c.y)],
    ["width", px(c.w)],
    ["height", px(c.h)],
    ["transform", rot(c)],
    ["background", c.cor],
    ["border-radius", raioSeguro(c.raio, c.w, c.h)],
    ["opacity", c.opacidade === undefined ? null : String(c.opacidade)],
    // borda por dentro, como no palco: sem box-sizing o anel cresceria a caixa
    ["border", c.borda ? `${c.borda.largura}px ${c.borda.estilo ?? "solid"} ${c.borda.cor}` : null],
    ["box-shadow", sombraCaixa(c)],
    ["box-sizing", "border-box"],
  ]);
  return `<div style="${s}"></div>`;
}

function textoHtml(c: CanvasCamadaTexto): string {
  const s = css([
    ["position", "absolute"],
    ["left", px(c.x)],
    ["top", px(c.y)],
    ["width", px(c.w)],
    ["height", px(c.h)],
    ["transform", rot(c)],
    // Aspas SIMPLES: o atributo style é delimitado por aspas duplas, e uma aspa
    // dupla aqui o fecha no meio — tudo depois de font-family é descartado e o
    // texto cai nos 16px padrão. Falha silenciosa: o HTML continua válido.
    ["font-family", c.fonte ? `'${c.fonte}', sans-serif` : null],
    ["font-weight", c.peso === undefined ? null : String(c.peso)],
    ["font-size", px(c.tamanho)],
    ["font-style", c.italico ? "italic" : null],
    ["text-decoration", decoracao(c)],
    ["text-transform", c.caixa && c.caixa !== "normal" ? c.caixa : null],
    ["background", c.fundo],
    ["border-radius", px(c.raio)],
    ["line-height", px(c.entrelinha)],
    ["letter-spacing", px(c.entreLetras)],
    ["color", c.cor],
    ["text-align", c.alinhamento],
    ["opacity", c.opacidade === undefined ? null : String(c.opacidade)],
    ["white-space", c.quebra ? "pre-wrap" : "pre"],
    [
      "text-shadow",
      c.sombra ? `${c.sombra.x}px ${c.sombra.y}px ${c.sombra.blur}px ${c.sombra.cor}` : null,
    ],
    // Sem isto o texto sai com largura diferente da do palco. O kerning é o
    // que mais desloca: o design importado do Canva já vem com o espaçamento
    // resolvido glifo a glifo, e deixar o browser kernear por cima move tudo.
    ["font-kerning", "none"],
    ["font-variant-ligatures", "none"],
  ]);

  // `partes` é o texto rico: trechos com peso/cor próprios na mesma linha, que é
  // como a manchete tem uma palavra verde no meio do branco.
  const dentro = c.partes
    ? c.partes
        .map((p) => {
          const ps = css([
            ["font-weight", p.peso === undefined ? null : String(p.peso)],
            ["color", p.cor],
            ["font-size", px(p.tamanho)],
            ["font-style", p.italico ? "italic" : null],
            ["text-decoration", decoracao(p)],
          ]);
          return ps ? `<span style="${ps}">${esc(p.texto)}</span>` : esc(p.texto);
        })
        .join("")
    : esc(c.texto ?? "");

  return `<div style="${s}">${dentro}</div>`;
}

/**
 * Desenho vetorial.
 *
 * O `viewBox` usa as coordenadas de página e o SVG é posicionado no canto da
 * caixa: assim o `d` extraído não precisa ser transladado, e um erro de
 * arredondamento na origem não desloca o desenho inteiro.
 *
 * `shape-rendering: geometricPrecision` importa aqui — arte com halftone são
 * milhares de círculos pequenos, e o padrão do browser os deixa irregulares.
 */
function pathHtml(c: Extract<CanvasCamada, { tipo: "path" }>): string {
  const s = css([
    ["position", "absolute"],
    ["left", px(c.x)],
    ["top", px(c.y)],
    ["width", px(c.w)],
    ["height", px(c.h)],
    ["transform", rot(c)],
    ["opacity", c.opacidade === undefined ? null : String(c.opacidade)],
    ["overflow", "visible"],
  ]);
  return (
    `<svg style="${s}" viewBox="${c.x} ${c.y} ${c.w} ${c.h}" ` +
    `shape-rendering="geometricPrecision">` +
    `<path d="${c.d}" fill="${c.cor ?? "#000"}" fill-rule="nonzero"/></svg>`
  );
}

function camadaHtml(c: CanvasCamada): string {
  if (c.oculto) return "";
  if (c.tipo === "imagem") return imagemHtml(c);
  if (c.tipo === "forma") return formaHtml(c);
  if (c.tipo === "path") return pathHtml(c);
  return textoHtml(c);
}

/** uma página com as camadas na ordem de pintura (a última fica por cima) */
export function paginaHtml(p: CanvasPagina): string {
  const s = css([
    ["position", "relative"],
    ["width", px(p.largura)],
    ["height", px(p.altura)],
    ["background", p.fundo ?? "#FFFFFF"],
    ["overflow", "hidden"],
    ["flex", "none"],
  ]);
  return `<section class="pagina" style="${s}">${p.camadas.map(camadaHtml).join("")}</section>`;
}

/**
 * As fontes vêm do próprio documento.
 *
 * Uma lista fixa aqui só serviria aos designs que usam as fontes do Agrum:
 * qualquer outro cairia no fallback e sairia com a letra errada, no peso errado
 * e — porque a métrica vertical muda junto — na posição errada. Cada design
 * importado traz as suas em `doc.fontes`.
 */
export function facesDe(doc: DocCanvas): string {
  const fontes = doc.fontes?.length ? doc.fontes : FONTES_PADRAO;
  return fontes
    .map(
      (f) =>
        `@font-face{font-family:'${f.familia}';src:url('${f.url}') format('woff2');` +
        `font-weight:${f.peso};font-style:normal;font-display:block}`,
    )
    .join("\n");
}

export interface OpcoesHtml {
  /** só esta página (1-based). Sem isto, todas, empilhadas. */
  pagina?: number;
  /** `<title>` do documento */
  titulo?: string;
}

/**
 * Documento HTML completo e autossuficiente: abre no browser, num iframe
 * `srcDoc` ou salvo em arquivo, sem depender do CSS do app.
 */
export function canvasParaHtml(doc: DocCanvas, opts: OpcoesHtml = {}): string {
  const paginas =
    opts.pagina && doc.paginas[opts.pagina - 1] ? [doc.paginas[opts.pagina - 1]!] : doc.paginas;
  const titulo = esc(opts.titulo ?? doc.nome ?? "Design");

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
<style>
${facesDe(doc)}
*{box-sizing:border-box}
html{background:#0b0f0d}
body{margin:0;display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px 0}
.pagina{text-rendering:geometricPrecision;-webkit-font-smoothing:antialiased}
@media print{body{margin:0;padding:0;gap:0}.pagina{page-break-after:always}}
</style></head>
<body>${paginas.map(paginaHtml).join("")}</body></html>`;
}

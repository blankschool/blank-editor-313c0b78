export type ElId = "topo" | "titulo" | "subtitulo" | "cta" | "ctaSecundario" | "midia" | "prova" | "rodape";

export type Variante = "Calmo" | "Produto" | "Ousado";

export interface EstiloEl {
  cor?: string | undefined;
  fundo?: string | undefined;
  borda?: string | undefined;
  opacidade?: number | undefined;
  fonte?: string | undefined;
  peso?: string | undefined;
  tamanho?: number | undefined;
  caixa?: "normal" | "uppercase" | "lowercase" | undefined;
  alinhamento?: "left" | "center" | "right" | undefined;
  entrelinha?: number | undefined;
  entreLetras?: number | undefined;
  oculto?: boolean | undefined;
  travado?: boolean | undefined;
}

export interface LayoutDoc {
  direcao: "linha" | "coluna" | "grade" | "livre";
  gap: number;
  padding: number;
  raio: number;
  borda: number;
  sombra: "nenhuma" | "suave" | "elevada";
  largura: "auto" | "fixa" | "cheia";
}

export interface DesignDoc {
  variante: Variante;
  textos: Record<ElId, string>;
  logos: string[];
  provaSocial: boolean;
  heroiCheio: boolean;
  densidade: number;
  ordem: ElId[];
  estilos: Partial<Record<ElId, EstiloEl>>;
  layout: LayoutDoc;
  fundo: string;
}

export const rotuloEl: Record<ElId, string> = {
  topo: "Topo",
  titulo: "Título",
  subtitulo: "Subtítulo",
  cta: "Botão primário",
  ctaSecundario: "Botão secundário",
  midia: "Mídia",
  prova: "Prova social",
  rodape: "Rodapé",
};

export const tipoEl: Record<ElId, string> = {
  topo: "navegação",
  titulo: "texto",
  subtitulo: "texto",
  cta: "botão",
  ctaSecundario: "botão",
  midia: "bloco",
  prova: "lista",
  rodape: "texto",
};

export const paletaProjeto = [
  "oklch(0.58 0.15 40)",
  "oklch(0.24 0.01 70)",
  "oklch(0.88 0.05 85)",
  "oklch(0.6 0.09 200)",
  "oklch(0.55 0.1 145)",
  "oklch(0.97 0.006 85)",
];

export const paletaPorSistema: Record<string, string[]> = {
  s1: ["oklch(0.58 0.15 40)", "oklch(0.88 0.05 85)", "oklch(0.25 0.01 70)"],
  s2: ["oklch(0.55 0.1 240)", "oklch(0.9 0.02 240)", "oklch(0.2 0.01 240)"],
  s3: ["oklch(0.9 0 0)", "oklch(0.7 0 0)", "oklch(0.3 0 0)"],
};

export function docPadrao(nome: string): DesignDoc {
  return {
    variante: "Calmo",
    textos: {
      topo: "Produto · Preços · Sobre",
      titulo: "Desenhe, converse e publique no mesmo lugar",
      subtitulo:
        "O Estúdio conecta o pedido em texto ao arquivo final: cada versão nasce da conversa e pode ser editada diretamente no palco.",
      cta: "Começar",
      ctaSecundario: "Ver exemplo",
      midia: nome,
      prova: "Times que já usam",
      rodape: "© Estúdio",
    },
    logos: ["Marés", "Fluxo", "Norte", "Cardume"],
    provaSocial: true,
    heroiCheio: false,
    densidade: 56,
    ordem: ["topo", "titulo", "subtitulo", "cta", "midia", "prova", "rodape"],
    estilos: {
      titulo: { tamanho: 32, peso: "600", alinhamento: "left", entrelinha: 1.15, entreLetras: -0.02 },
      subtitulo: { tamanho: 13, alinhamento: "left", entrelinha: 1.5 },
    },
    layout: { direcao: "coluna", gap: 12, padding: 32, raio: 8, borda: 0, sombra: "suave", largura: "auto" },
    fundo: "var(--card)",
  };
}

export function clonarDoc<T>(d: T): T {
  return JSON.parse(JSON.stringify(d)) as T;
}

/* --------- documento de preview em HTML (sem edição) --------- */

export interface DocHtml {
  kind: "html";
  src: string;
}

export function ehDocHtml(d: unknown): d is DocHtml {
  return (
    !!d &&
    typeof d === "object" &&
    (d as { kind?: unknown }).kind === "html" &&
    typeof (d as { src?: unknown }).src === "string"
  );
}

/* --------- documento canvas (páginas 1080x1440, sem edição ainda) --------- */

export interface CanvasParteTexto {
  texto: string;
  peso?: number;
  cor?: string;
  italico?: boolean;
  sublinhado?: boolean;
  riscado?: boolean;
  tamanho?: number;
}

export interface CanvasSombra {
  x: number;
  y: number;
  blur: number;
  cor: string;
}

export interface CanvasCamadaTexto {
  tipo: "texto";
  id?: string;
  nome?: string;
  oculto?: boolean;
  x: number;
  y: number;
  w?: number;
  h?: number;
  texto?: string;
  partes?: CanvasParteTexto[];
  fonte?: string;
  peso?: number;
  tamanho?: number;
  entrelinha?: number;
  entreLetras?: number;
  cor?: string;
  alinhamento?: "left" | "center" | "right";
  quebra?: boolean;
  opacidade?: number;
  italico?: boolean;
  sublinhado?: boolean;
  riscado?: boolean;
  caixa?: "normal" | "uppercase" | "lowercase";
  fundo?: string;
  raio?: number;
  sombra?: CanvasSombra;
}

export interface CanvasCamadaImagem {
  tipo: "imagem";
  id?: string;
  nome?: string;
  oculto?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  /** vazio ou ausente = placeholder de imagem */
  src?: string;
  img?: { x: number; y: number; w: number; h: number };
  raio?: number;
  opacidade?: number;
  espelhoY?: boolean;
  sombra?: CanvasSombra;
}

export interface CanvasCamadaForma {
  tipo: "forma";
  id?: string;
  nome?: string;
  oculto?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  cor?: string;
  raio?: number;
  opacidade?: number;
  borda?: { largura: number; cor: string; estilo?: "solid" | "dashed" | "dotted" };
  sombra?: CanvasSombra;
}

export type CanvasCamada = CanvasCamadaTexto | CanvasCamadaImagem | CanvasCamadaForma;

export interface CanvasPagina {
  id: string;
  nome?: string;
  largura: number;
  altura: number;
  fundo?: string;
  camadas: CanvasCamada[];
}

export interface DocCanvas {
  kind: "canvas";
  nome?: string;
  paginas: CanvasPagina[];
}

export interface CamadaCanvasInfo {
  id: string;
  nome: string;
  tipo: CanvasCamada["tipo"];
  oculto: boolean;
  indice: number;
}

export function idCamadaCanvas(c: CanvasCamada, i: number, paginaId: string): string {
  return c.id ?? `${paginaId}-${i + 1}`;
}

export function camadasDaPaginaCanvas(pagina: CanvasPagina | null | undefined): CamadaCanvasInfo[] {
  if (!pagina || !Array.isArray(pagina.camadas)) return [];
  return pagina.camadas.map((c, i) => ({
    id: idCamadaCanvas(c, i, pagina.id ?? "p"),
    nome: c.nome ?? (c.tipo === "texto" ? "texto" : c.tipo === "imagem" ? "imagem" : "forma"),
    tipo: c.tipo,
    oculto: !!c.oculto,
    indice: i,
  }));
}

export function textoDaCamadaCanvas(c: CanvasCamadaTexto): string {
  if (c.partes?.length) return c.partes.map((p) => p.texto ?? "").join("");
  return c.texto ?? "";
}

/* --------- texto rico: trechos (partes) --------- */

type EstiloParte = Omit<CanvasParteTexto, "texto">;

const CHAVES_PARTE: Array<keyof EstiloParte> = ["peso", "cor", "italico", "sublinhado", "riscado", "tamanho"];

function mesmoEstilo(a: CanvasParteTexto, b: CanvasParteTexto): boolean {
  return CHAVES_PARTE.every((k) => a[k] === b[k]);
}

/** sempre devolve a camada como lista de trechos (nunca vazia) */
export function partesDaCamadaCanvas(c: CanvasCamadaTexto): CanvasParteTexto[] {
  if (c.partes?.length) return c.partes.map((p) => ({ ...p, texto: p.texto ?? "" }));
  return [{ texto: c.texto ?? "" }];
}

/** funde trechos vizinhos iguais e descarta vazios */
export function normalizarPartes(partes: CanvasParteTexto[]): CanvasParteTexto[] {
  const out: CanvasParteTexto[] = [];
  partes.forEach((p) => {
    if (!p.texto) return;
    const ultimo = out[out.length - 1];
    if (ultimo && mesmoEstilo(ultimo, p)) ultimo.texto += p.texto;
    else out.push({ ...p });
  });
  return out;
}

/** grava trechos na camada; se houver um estilo só, volta a ser texto simples */
export function gravarPartesNaCamada(c: CanvasCamadaTexto, partes: CanvasParteTexto[]): void {
  const norm = normalizarPartes(partes);
  const simples = norm.length <= 1 && CHAVES_PARTE.every((k) => norm[0]?.[k] === undefined);
  if (simples) {
    c.texto = norm[0]?.texto ?? "";
    delete c.partes;
  } else {
    c.partes = norm;
    delete c.texto;
  }
}

/** aplica um estilo apenas no intervalo [inicio, fim) do texto corrido da camada */
export function aplicarEstiloEmTrecho(
  c: CanvasCamadaTexto,
  inicio: number,
  fim: number,
  patch: EstiloParte,
): void {
  const partes = partesDaCamadaCanvas(c);
  const a = Math.max(0, Math.min(inicio, fim));
  const b = Math.max(inicio, fim);
  if (b <= a) return;
  const saida: CanvasParteTexto[] = [];
  let pos = 0;
  partes.forEach((p) => {
    const ini = pos;
    const f = pos + p.texto.length;
    pos = f;
    if (f <= a || ini >= b) return void saida.push({ ...p });
    const antes = p.texto.slice(0, Math.max(0, a - ini));
    const meio = p.texto.slice(Math.max(0, a - ini), Math.min(p.texto.length, b - ini));
    const depois = p.texto.slice(Math.min(p.texto.length, b - ini));
    if (antes) saida.push({ ...p, texto: antes });
    if (meio) {
      const alvo: CanvasParteTexto = { ...p, texto: meio };
      (Object.keys(patch) as Array<keyof EstiloParte>).forEach((k) => {
        const v = patch[k];
        if (v === undefined) delete alvo[k];
        else (alvo as Record<string, unknown>)[k] = v;
      });
      saida.push(alvo);
    }
    if (depois) saida.push({ ...p, texto: depois });
  });
  gravarPartesNaCamada(c, saida);
}

/** lê o estilo comum ao intervalo (undefined quando o trecho é misto) */
export function estiloDoTrecho(c: CanvasCamadaTexto, inicio: number, fim: number): EstiloParte {
  const partes = partesDaCamadaCanvas(c);
  const a = Math.min(inicio, fim);
  const b = Math.max(inicio, fim);
  const tocados: CanvasParteTexto[] = [];
  let pos = 0;
  partes.forEach((p) => {
    const ini = pos;
    const f = pos + p.texto.length;
    pos = f;
    if (f <= a || ini >= b) return;
    tocados.push(p);
  });
  if (!tocados.length) return {};
  const out: EstiloParte = {};
  CHAVES_PARTE.forEach((k) => {
    const v = tocados[0]![k];
    if (tocados.every((p) => p[k] === v) && v !== undefined) (out as Record<string, unknown>)[k] = v;
  });
  return out;
}

/** troca o texto corrido preservando os estilos dos trechos que sobrevivem */
export function substituirTextoPreservandoPartes(c: CanvasCamadaTexto, novo: string): void {
  const partes = partesDaCamadaCanvas(c);
  const antigo = partes.map((p) => p.texto).join("");
  if (novo === antigo) return;
  /* prefixo e sufixo iguais: o miolo é o que mudou */
  let pre = 0;
  while (pre < antigo.length && pre < novo.length && antigo[pre] === novo[pre]) pre++;
  let suf = 0;
  while (
    suf < antigo.length - pre &&
    suf < novo.length - pre &&
    antigo[antigo.length - 1 - suf] === novo[novo.length - 1 - suf]
  )
    suf++;
  const inserido = novo.slice(pre, novo.length - suf);
  const fimRemocao = antigo.length - suf;

  const saida: CanvasParteTexto[] = [];
  let pos = 0;
  let estiloInsercao: CanvasParteTexto | null = null;
  partes.forEach((p) => {
    const ini = pos;
    const f = pos + p.texto.length;
    pos = f;
    const antes = p.texto.slice(0, Math.max(0, Math.min(p.texto.length, pre - ini)));
    const depois = p.texto.slice(Math.max(0, Math.min(p.texto.length, fimRemocao - ini)));
    if (antes) {
      saida.push({ ...p, texto: antes });
      estiloInsercao = p;
    }
    if (ini <= pre && f >= pre && !estiloInsercao) estiloInsercao = p;
    if (depois) saida.push({ ...p, texto: depois, __depois: true } as CanvasParteTexto);
  });
  /* insere o texto novo na fronteira certa */
  const finais: CanvasParteTexto[] = [];
  let inseriu = false;
  saida.forEach((p) => {
    const marcado = (p as CanvasParteTexto & { __depois?: boolean }).__depois;
    if (marcado && !inseriu) {
      if (inserido) finais.push({ ...(estiloInsercao ?? p), texto: inserido });
      inseriu = true;
    }
    const limpo = { ...p } as CanvasParteTexto & { __depois?: boolean };
    delete limpo.__depois;
    finais.push(limpo);
  });
  if (!inseriu && inserido) finais.push({ ...(estiloInsercao ?? partes[0] ?? { texto: "" }), texto: inserido });
  gravarPartesNaCamada(c, finais);
}

/* --------- placeholder de imagem --------- */

export function ehPlaceholderImagem(c: CanvasCamada): boolean {
  return c.tipo === "imagem" && !c.src;
}

/** transforma qualquer camada num placeholder de imagem, preservando caixa e estilo */
export function virarPlaceholderImagem(c: CanvasCamada): CanvasCamadaImagem {
  const w = (c as { w?: number }).w ?? 400;
  const h = (c as { h?: number }).h ?? 300;
  const base: CanvasCamadaImagem = {
    tipo: "imagem",
    x: c.x,
    y: c.y,
    w: Math.max(24, Math.round(w)),
    h: Math.max(24, Math.round(h || 300)),
  };
  if (c.id) base.id = c.id;
  base.nome = "Placeholder";
  if (c.oculto) base.oculto = true;
  const raio = (c as { raio?: number }).raio;
  if (raio !== undefined) base.raio = raio;
  if (c.opacidade !== undefined) base.opacidade = c.opacidade;
  const sombra = (c as { sombra?: CanvasSombra }).sombra;
  if (sombra) base.sombra = sombra;
  return base;
}


export function acharCamadaCanvas(
  doc: DocCanvas | null | undefined,
  paginaId: string | null,
  camadaId: string | null,
): { pagina: CanvasPagina; camada: CanvasCamada; indice: number } | null {
  if (!doc || !camadaId || !Array.isArray(doc.paginas)) return null;
  for (let i = 0; i < doc.paginas.length; i++) {
    const p = doc.paginas[i]!;
    const pid = p.id ?? `p${i + 1}`;
    if (paginaId && pid !== paginaId) continue;
    const camadas = p.camadas ?? [];
    for (let j = 0; j < camadas.length; j++) {
      if (idCamadaCanvas(camadas[j]!, j, pid) === camadaId) {
        return { pagina: p, camada: camadas[j]!, indice: j };
      }
    }
  }
  if (paginaId) return acharCamadaCanvas(doc, null, camadaId);
  return null;
}

/** aplica um patch imutável na camada identificada, dentro de um doc já clonado */
export function comCamadaCanvas(
  doc: DocCanvas,
  paginaId: string | null,
  camadaId: string,
  patch: (c: CanvasCamada) => void,
): DocCanvas {
  const achado = acharCamadaCanvas(doc, paginaId, camadaId);
  if (achado) patch(achado.camada);
  return doc;
}

/* --------- criar / remover camadas do canvas --------- */

function novoIdCamada(prefixo: string): string {
  const r =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefixo}-${r}`;
}

export function novaCamadaTexto(pagina: CanvasPagina): CanvasCamadaTexto {
  const w = 600;
  return {
    tipo: "texto",
    id: novoIdCamada("txt"),
    nome: "Novo texto",
    x: Math.round(((pagina.largura || 1080) - w) / 2),
    y: Math.round(((pagina.altura || 1440) - 60) / 2),
    w,
    texto: "Novo texto",
    fonte: "NYT Franklin",
    peso: 600,
    tamanho: 48,
    cor: "#ffffff",
    quebra: true,
  };
}

export function novaCamadaForma(pagina: CanvasPagina): CanvasCamadaForma {
  const w = 200;
  const h = 80;
  return {
    tipo: "forma",
    id: novoIdCamada("frm"),
    nome: "Forma",
    x: Math.round(((pagina.largura || 1080) - w) / 2),
    y: Math.round(((pagina.altura || 1440) - h) / 2),
    w,
    h,
    cor: "#4ADC75",
  };
}

export function novaCamadaImagem(pagina: CanvasPagina, src: string, nome: string): CanvasCamadaImagem {
  const w = 600;
  const h = 400;
  return {
    tipo: "imagem",
    id: novoIdCamada("img"),
    nome,
    x: Math.round(((pagina.largura || 1080) - w) / 2),
    y: Math.round(((pagina.altura || 1440) - h) / 2),
    w,
    h,
    src,
  };
}

export function duplicarCamadaCanvas(camada: CanvasCamada, dx = 16, dy = 16): CanvasCamada {
  const copia = JSON.parse(JSON.stringify(camada)) as CanvasCamada;
  copia.id = novoIdCamada(camada.tipo === "texto" ? "txt" : camada.tipo === "imagem" ? "img" : "frm");
  copia.nome = `${camada.nome ?? camada.tipo} cópia`;
  copia.x = (camada.x ?? 0) + dx;
  copia.y = (camada.y ?? 0) + dy;
  return copia;
}

export function adicionarCamadaCanvas(doc: DocCanvas, paginaId: string | null, camada: CanvasCamada): DocCanvas {
  const pg = doc.paginas.find((p, i) => (p.id ?? `p${i + 1}`) === paginaId) ?? doc.paginas[0];
  if (pg) {
    pg.camadas = [...(pg.camadas ?? []), camada];
  }
  return doc;
}

export function removerCamadaCanvas(doc: DocCanvas, paginaId: string | null, camadaId: string): DocCanvas {
  doc.paginas.forEach((p, i) => {
    const pid = p.id ?? `p${i + 1}`;
    if (paginaId && pid !== paginaId) return;
    p.camadas = (p.camadas ?? []).filter((c, j) => idCamadaCanvas(c, j, pid) !== camadaId);
  });
  return doc;
}

/** z-order: ordem de pintura dentro da página (o último é o de cima) */
export function moverCamadaCanvas(
  doc: DocCanvas,
  paginaId: string | null,
  camadaId: string,
  destino: -1 | 1 | "topo" | "fundo",
): DocCanvas {
  doc.paginas.forEach((p, i) => {
    const pid = p.id ?? `p${i + 1}`;
    if (paginaId && pid !== paginaId) return;
    const camadas = [...(p.camadas ?? [])];
    const idx = camadas.findIndex((c, j) => idCamadaCanvas(c, j, pid) === camadaId);
    if (idx < 0) return;
    const item = camadas.splice(idx, 1)[0]!;
    const alvo =
      destino === "topo"
        ? camadas.length
        : destino === "fundo"
          ? 0
          : Math.max(0, Math.min(camadas.length, idx + destino));
    camadas.splice(alvo, 0, item);
    p.camadas = camadas;
  });
  return doc;
}

/* --------- exportar a camada selecionada como PNG (só canvas) --------- */

const PROPS_PNG = [
  "position",
  "left",
  "top",
  "width",
  "height",
  "display",
  "overflow",
  "box-sizing",
  "background",
  "background-color",
  "border",
  "border-radius",
  "box-shadow",
  "opacity",
  "color",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-decoration",
  "text-transform",
  "text-shadow",
  "white-space",
  "transform",
  "object-fit",
];

function inlinar(origem: Element, destino: HTMLElement) {
  const cs = window.getComputedStyle(origem);
  const partes: string[] = [];
  PROPS_PNG.forEach((p) => {
    const v = cs.getPropertyValue(p);
    if (v) partes.push(`${p}:${v}`);
  });
  destino.setAttribute("style", partes.join(";"));
  const filhosO = Array.from(origem.children);
  const filhosD = Array.from(destino.children);
  filhosO.forEach((f, i) => {
    const d = filhosD[i];
    if (d instanceof HTMLElement) inlinar(f, d);
  });
}

/**
 * Rasteriza o nó `[data-camada="id"]` do palco em tamanho 1× (px do documento),
 * sem o contorno de seleção, com fundo transparente.
 */
export async function camadaParaPng(camadaId: string, escala: 1 | 2 = 1): Promise<Blob | null> {
  const no = document.querySelector<HTMLElement>(`[data-camada="${CSS.escape(camadaId)}"]`);
  if (!no) return null;
  // offsetWidth/Height ignoram o transform: scale() do palco — já é 1×
  const w = Math.max(1, Math.round(no.offsetWidth));
  const h = Math.max(1, Math.round(no.offsetHeight));

  const clone = no.cloneNode(true) as HTMLElement;
  inlinar(no, clone);
  clone.style.position = "static";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.width = `${w}px`;
  clone.style.height = `${h}px`;
  clone.style.outline = "none";
  clone.style.transform = "none";

  const html = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${html}</div></foreignObject></svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const img = new window.Image();
  const carregou = await new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
  if (!carregou) return null;

  const canvas = document.createElement("canvas");
  canvas.width = w * escala;
  canvas.height = h * escala;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(escala, escala);
  ctx.drawImage(img, 0, 0, w, h);
  return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}



export function ehDocCanvas(d: unknown): d is DocCanvas {
  return (
    !!d &&
    typeof d === "object" &&
    (d as { kind?: unknown }).kind === "canvas" &&
    Array.isArray((d as { paginas?: unknown }).paginas)
  );
}

export type DocSalvo = DesignDoc | DocHtml | DocCanvas;

const TEMPLATES_BASE =
  "https://sites-blank-editor-supabase.ickanz.easypanel.host/storage/v1/object/public/templates";

export const previewsHtml = {
  agrum: {
    nome: "Agrum Eleição",
    src: `${TEMPLATES_BASE}/agrum-eleicao/index.html`,
  },
  barretos: { nome: "Barretos", src: `${TEMPLATES_BASE}/barretos/index.html` },
} as const;

export type PresetNovo = "branco" | keyof typeof previewsHtml;



export function comEstilo(doc: DesignDoc, el: ElId, patch: Partial<EstiloEl>): DesignDoc {
  return { ...doc, estilos: { ...doc.estilos, [el]: { ...(doc.estilos[el] ?? {}), ...patch } } };
}

/* --------- camadas derivadas do documento --------- */

export interface CamadaDoc {
  id: ElId;
  nome: string;
  tipo: string;
  grupo: string;
}

export function camadasDoDoc(doc: DesignDoc): CamadaDoc[] {
  const grupo = (id: ElId) =>
    id === "topo" ? "Topo" : id === "prova" ? "Prova social" : id === "rodape" ? "Rodapé" : "Herói";
  return doc.ordem.map((id) => ({ id, nome: rotuloEl[id], tipo: tipoEl[id], grupo: grupo(id) }));
}

export function caminhoEl(id: ElId): string {
  const g = id === "topo" ? "Topo" : id === "prova" ? "Prova social" : id === "rodape" ? "Rodapé" : "Herói";
  return `${g} › ${rotuloEl[id]}`;
}

/* --------- diff entre dois estados --------- */

export interface Diferenca {
  campo: string;
  antes: string;
  depois: string;
}

const resumoValor = (v: unknown): string =>
  typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);

export function diffDocs(a: DesignDoc, b: DesignDoc): Diferenca[] {
  const out: Diferenca[] = [];
  const push = (campo: string, x: unknown, y: unknown) => {
    const sx = resumoValor(x);
    const sy = resumoValor(y);
    if (sx !== sy) out.push({ campo, antes: sx, depois: sy });
  };
  push("variante", a.variante, b.variante);
  (Object.keys(a.textos) as ElId[]).forEach((k) => push(`texto · ${rotuloEl[k]}`, a.textos[k], b.textos[k]));
  push("logos", a.logos.join(", "), b.logos.join(", "));
  push("prova social", a.provaSocial ? "ligada" : "desligada", b.provaSocial ? "ligada" : "desligada");
  push("herói em tela cheia", a.heroiCheio, b.heroiCheio);
  push("densidade", a.densidade, b.densidade);
  push("ordem", a.ordem.join(" → "), b.ordem.join(" → "));
  push("fundo", a.fundo, b.fundo);
  (Object.keys(b.layout) as (keyof LayoutDoc)[]).forEach((k) => push(`layout · ${k}`, a.layout[k], b.layout[k]));
  const els = new Set([...Object.keys(a.estilos), ...Object.keys(b.estilos)]) as Set<ElId>;
  els.forEach((el) => {
    const ea = a.estilos[el] ?? {};
    const eb = b.estilos[el] ?? {};
    const chaves = new Set([...Object.keys(ea), ...Object.keys(eb)]) as Set<keyof EstiloEl>;
    chaves.forEach((c) => push(`${rotuloEl[el]} · ${c}`, ea[c], eb[c]));
  });
  return out;
}

/* --------- interpretação do pedido em linguagem natural --------- */

const cores: Record<string, string> = {
  azul: "oklch(0.55 0.13 245)",
  vermelho: "oklch(0.55 0.18 25)",
  verde: "oklch(0.55 0.12 145)",
  laranja: "oklch(0.62 0.15 55)",
  roxo: "oklch(0.5 0.15 300)",
  amarelo: "oklch(0.82 0.13 90)",
  preto: "oklch(0.2 0.01 70)",
  branco: "oklch(0.98 0.004 85)",
  cinza: "oklch(0.6 0.01 70)",
  rosa: "oklch(0.68 0.14 350)",
};

export interface Passo {
  texto: string;
  aplicar: (doc: DesignDoc) => DesignDoc;
}

export interface Plano {
  passos: Passo[];
  resumo: string;
}

interface ContextoPedido {
  sistemaAtivo: string;
  temChipArquivo: boolean;
  temChipSistema: boolean;
  selecionado: ElId | null;
}

function entreAspas(t: string): string | null {
  const m = t.match(/[“"']([^”"']{3,})[”"']/);
  return m?.[1] ?? null;
}

export function interpretarPedido(pedido: string, ctx: ContextoPedido): Plano {
  const t = pedido.toLowerCase();
  const passos: Passo[] = [];
  const notas: string[] = [];

  passos.push({ texto: "Interpretar o pedido", aplicar: (d) => d });

  // variante
  const variante: Variante | null = /ousad|impact|forte|bold/.test(t)
    ? "Ousado"
    : /produto|screenshot|mídia|midia|demo/.test(t)
      ? "Produto"
      : /calmo|editorial|sóbrio|sobrio|clean|leve/.test(t)
        ? "Calmo"
        : null;
  if (variante) {
    passos.push({
      texto: `Trocar para a variante ${variante}`,
      aplicar: (d) => aplicarVariante(d, variante),
    });
    notas.push(`variante ${variante}`);
  }

  // cor
  const corNome = Object.keys(cores).find((c) => t.includes(c));
  if (corNome || /cor|paleta|tom/.test(t)) {
    const paleta = ctx.temChipSistema ? (paletaPorSistema[ctx.sistemaAtivo] ?? paletaProjeto) : paletaProjeto;
    const cor = corNome ? cores[corNome]! : paleta[0]!;
    const alvo: ElId = ctx.selecionado ?? "cta";
    passos.push({
      texto: `Pintar ${rotuloEl[alvo].toLowerCase()} com a nova cor`,
      aplicar: (d) =>
        alvo === "cta" || alvo === "ctaSecundario" || alvo === "midia"
          ? comEstilo(d, alvo, { fundo: cor })
          : comEstilo(d, alvo, { cor }),
    });
    notas.push(corNome ? `cor ${corNome}` : "paleta do projeto");
  }

  // título / texto explícito
  const citado = entreAspas(pedido);
  if (citado && /t[íi]tulo|headline|chamada/.test(t)) {
    passos.push({ texto: "Reescrever o título", aplicar: (d) => ({ ...d, textos: { ...d.textos, titulo: citado } }) });
    notas.push("novo título");
  } else if (citado && /cta|bot[ãa]o/.test(t)) {
    passos.push({ texto: "Trocar o texto do CTA", aplicar: (d) => ({ ...d, textos: { ...d.textos, cta: citado } }) });
    notas.push("novo CTA");
  } else if (citado) {
    const alvo: ElId = ctx.selecionado ?? "titulo";
    passos.push({
      texto: `Reescrever ${rotuloEl[alvo].toLowerCase()}`,
      aplicar: (d) => ({ ...d, textos: { ...d.textos, [alvo]: citado } }),
    });
    notas.push(`texto de ${rotuloEl[alvo].toLowerCase()}`);
  }

  // prova social
  if (/prova social|logos|clientes/.test(t)) {
    const ligar = !/sem |tir(e|ar)|remov|escond|deslig/.test(t);
    passos.push({
      texto: ligar ? "Ligar a faixa de prova social" : "Desligar a faixa de prova social",
      aplicar: (d) => ({ ...d, provaSocial: ligar }),
    });
    notas.push(ligar ? "prova social ligada" : "prova social desligada");
  }

  // tamanho do título
  if (/maior|aument|destaqu/.test(t)) {
    passos.push({
      texto: "Aumentar o título",
      aplicar: (d) => comEstilo(d, "titulo", { tamanho: Math.min(72, (d.estilos.titulo?.tamanho ?? 32) + 8) }),
    });
    notas.push("título maior");
  }
  if (/menor|diminu|reduz|baix(e|ar) (dois|um)? ?pes/.test(t)) {
    passos.push({
      texto: "Reduzir o título",
      aplicar: (d) => comEstilo(d, "titulo", { tamanho: Math.max(14, (d.estilos.titulo?.tamanho ?? 32) - 6) }),
    });
    notas.push("título menor");
  }

  // respiro / densidade
  if (/respir|espa[çc]|arejad|solto/.test(t)) {
    passos.push({
      texto: "Abrir espaçamento",
      aplicar: (d) => ({
        ...d,
        densidade: Math.max(10, d.densidade - 15),
        layout: { ...d.layout, gap: d.layout.gap + 8, padding: d.layout.padding + 12 },
      }),
    });
    notas.push("mais respiro");
  }
  if (/dens|compact|apert/.test(t)) {
    passos.push({
      texto: "Compactar o layout",
      aplicar: (d) => ({
        ...d,
        densidade: Math.min(100, d.densidade + 15),
        layout: { ...d.layout, gap: Math.max(0, d.layout.gap - 4), padding: Math.max(8, d.layout.padding - 8) },
      }),
    });
    notas.push("mais denso");
  }

  // centralizar
  if (/centraliz|centrad/.test(t)) {
    passos.push({
      texto: "Centralizar o herói",
      aplicar: (d) =>
        comEstilo(comEstilo(d, "titulo", { alinhamento: "center" }), "subtitulo", { alinhamento: "center" }),
    });
    notas.push("herói centralizado");
  }

  // fallback: sempre muda algo de verdade
  if (passos.length === 1) {
    passos.push({
      texto: "Reescrever o herói a partir do pedido",
      aplicar: (d) => ({
        ...d,
        textos: {
          ...d.textos,
          titulo: pedido.trim().replace(/\s+/g, " ").slice(0, 80),
          subtitulo: d.textos.subtitulo,
        },
      }),
    });
    notas.push("herói reescrito com o seu pedido");
  }

  if (ctx.temChipArquivo) passos.push({ texto: "Conferir contraste e espaçamento", aplicar: (d) => d });
  passos.push({ texto: "Gerar nova versão", aplicar: (d) => d });

  return { passos, resumo: `Apliquei no arquivo em foco: ${notas.join(", ")}.` };
}

export function aplicarVariante(doc: DesignDoc, v: Variante): DesignDoc {
  if (v === "Calmo") {
    return {
      ...doc,
      variante: v,
      heroiCheio: false,
      provaSocial: true,
      densidade: 46,
      ordem: ["topo", "titulo", "subtitulo", "cta", "midia", "prova", "rodape"],
      layout: { ...doc.layout, gap: 12, padding: 32 },
      estilos: {
        ...doc.estilos,
        titulo: { ...(doc.estilos.titulo ?? {}), tamanho: 32, peso: "600", alinhamento: "left" },
      },
    };
  }
  if (v === "Produto") {
    return {
      ...doc,
      variante: v,
      heroiCheio: false,
      provaSocial: true,
      densidade: 62,
      ordem: ["topo", "midia", "titulo", "subtitulo", "cta", "prova", "rodape"],
      layout: { ...doc.layout, gap: 10, padding: 28 },
      estilos: {
        ...doc.estilos,
        titulo: { ...(doc.estilos.titulo ?? {}), tamanho: 26, peso: "600", alinhamento: "left" },
      },
    };
  }
  return {
    ...doc,
    variante: v,
    heroiCheio: true,
    provaSocial: false,
    densidade: 80,
    ordem: ["topo", "titulo", "cta", "subtitulo", "midia", "rodape"],
    layout: { ...doc.layout, gap: 18, padding: 40 },
    estilos: {
      ...doc.estilos,
      titulo: { ...(doc.estilos.titulo ?? {}), tamanho: 52, peso: "700", alinhamento: "center" },
      subtitulo: { ...(doc.estilos.subtitulo ?? {}), alinhamento: "center" },
    },
  };
}

/* --------- exportação --------- */

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);

export function docParaHtml(doc: DesignDoc, nome: string, largura: number): string {
  const est = (el: ElId) => doc.estilos[el] ?? {};
  const css = (el: ElId) => {
    const s = est(el);
    return [
      s.cor && `color:${s.cor}`,
      s.fundo && `background:${s.fundo}`,
      s.borda && `border:1px solid ${s.borda}`,
      s.opacidade !== undefined && `opacity:${s.opacidade / 100}`,
      s.tamanho && `font-size:${s.tamanho}px`,
      s.peso && `font-weight:${s.peso}`,
      s.fonte && `font-family:${s.fonte}`,
      s.caixa && s.caixa !== "normal" && `text-transform:${s.caixa}`,
      s.alinhamento && `text-align:${s.alinhamento}`,
      s.entrelinha && `line-height:${s.entrelinha}`,
      s.entreLetras !== undefined && `letter-spacing:${s.entreLetras}em`,
    ]
      .filter(Boolean)
      .join(";");
  };
  const bloco = (el: ElId): string => {
    if (est(el).oculto) return "";
    switch (el) {
      case "topo":
        return `<nav style="${css(el)}">${esc(doc.textos.topo)}</nav>`;
      case "titulo":
        return `<h1 style="${css(el)}">${esc(doc.textos.titulo)}</h1>`;
      case "subtitulo":
        return `<p style="${css(el)}">${esc(doc.textos.subtitulo)}</p>`;
      case "cta":
        return `<div class="ctas"><a class="btn" style="${css("cta")}">${esc(doc.textos.cta)}</a><a class="btn ghost" style="${css("ctaSecundario")}">${esc(doc.textos.ctaSecundario)}</a></div>`;
      case "ctaSecundario":
        return "";
      case "midia":
        return `<div class="midia" style="${css(el)};height:${doc.heroiCheio ? 260 : 160}px"></div>`;
      case "prova":
        return doc.provaSocial
          ? `<div class="prova" style="${css(el)}">${doc.logos.map((l) => `<span>${esc(l)}</span>`).join("")}</div>`
          : "";
      case "rodape":
        return `<footer style="${css(el)}">${esc(doc.textos.rodape)}</footer>`;
    }
  };
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(nome)}</title>
<style>
  body{margin:0;background:#efeee9;font-family:ui-sans-serif,system-ui,sans-serif;color:#241f1b}
  .artboard{width:${largura}px;margin:40px auto;background:#fff;border-radius:${doc.layout.raio}px;
    padding:${doc.layout.padding}px;display:flex;flex-direction:column;gap:${doc.layout.gap}px;
    box-shadow:${doc.layout.sombra === "nenhuma" ? "none" : doc.layout.sombra === "elevada" ? "0 24px 60px rgba(0,0,0,.18)" : "0 8px 24px rgba(0,0,0,.08)"}}
  nav{font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.6}
  h1{margin:0;font-size:32px;line-height:1.15}
  p{margin:0;font-size:13px;line-height:1.5;opacity:.75}
  .ctas{display:flex;gap:8px}
  .btn{background:#c05621;color:#fff;padding:8px 14px;border-radius:6px;font-size:12px}
  .btn.ghost{background:transparent;color:inherit;border:1px solid rgba(0,0,0,.15)}
  .midia{background:#efeee9;border-radius:8px}
  .prova{display:flex;gap:24px;border-top:1px solid rgba(0,0,0,.1);padding-top:16px;
    font-size:11px;text-transform:uppercase;letter-spacing:.14em;opacity:.6}
  footer{font-size:11px;opacity:.5}
</style></head>
<body><div class="artboard">${doc.ordem.map(bloco).join("")}</div></body></html>`;
}

export function baixarArquivo(nome: string, conteudo: string | Blob, tipo = "text/html") {
  const blob = typeof conteudo === "string" ? new Blob([conteudo], { type: tipo }) : conteudo;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export async function docParaPng(doc: DesignDoc, nome: string, largura: number, escala = 2): Promise<Blob | null> {
  const altura = 620;
  const canvas = document.createElement("canvas");
  canvas.width = largura * escala;
  canvas.height = altura * escala;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(escala, escala);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, largura, altura);

  const p = doc.layout.padding;
  let y = p + 8;
  const linhas = (texto: string, max: number, tamanho: number) => {
    const palavras = texto.split(" ");
    const out: string[] = [];
    let atual = "";
    palavras.forEach((w) => {
      const teste = atual ? `${atual} ${w}` : w;
      if (ctx.measureText(teste).width > max && atual) {
        out.push(atual);
        atual = w;
      } else atual = teste;
    });
    if (atual) out.push(atual);
    return out.map((l) => ({ l, tamanho }));
  };

  for (const el of doc.ordem) {
    const s = doc.estilos[el] ?? {};
    if (s.oculto) continue;
    if (el === "topo") {
      ctx.font = "600 11px system-ui";
      ctx.fillStyle = "#8b8178";
      ctx.fillText(doc.textos.topo.toUpperCase(), p, y);
      y += 28;
    } else if (el === "titulo") {
      const tam = s.tamanho ?? 32;
      ctx.font = `${s.peso ?? 600} ${tam}px system-ui`;
      ctx.fillStyle = s.cor?.startsWith("#") ? s.cor : "#241f1b";
      linhas(doc.textos.titulo, largura - p * 2, tam).forEach(({ l }) => {
        ctx.fillText(l, p, y + tam);
        y += tam * (s.entrelinha ?? 1.15);
      });
      y += doc.layout.gap;
    } else if (el === "subtitulo") {
      ctx.font = `${s.tamanho ?? 13}px system-ui`;
      ctx.fillStyle = "#6f665e";
      linhas(doc.textos.subtitulo, largura - p * 2 - 40, s.tamanho ?? 13).forEach(({ l }) => {
        ctx.fillText(l, p, y + 12);
        y += (s.tamanho ?? 13) * 1.5;
      });
      y += doc.layout.gap;
    } else if (el === "cta") {
      ctx.fillStyle = "#c05621";
      const w = ctx.measureText(doc.textos.cta).width + 28;
      ctx.beginPath();
      ctx.roundRect(p, y, w, 32, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "500 12px system-ui";
      ctx.fillText(doc.textos.cta, p + 14, y + 20);
      y += 32 + doc.layout.gap;
    } else if (el === "midia") {
      ctx.fillStyle = "#efeee9";
      const h = doc.heroiCheio ? 220 : 150;
      ctx.beginPath();
      ctx.roundRect(p, y, largura - p * 2, h, doc.layout.raio);
      ctx.fill();
      y += h + doc.layout.gap;
    } else if (el === "prova" && doc.provaSocial) {
      ctx.strokeStyle = "#e2ded7";
      ctx.beginPath();
      ctx.moveTo(p, y);
      ctx.lineTo(largura - p, y);
      ctx.stroke();
      y += 22;
      ctx.font = "600 11px system-ui";
      ctx.fillStyle = "#8b8178";
      let x = p;
      doc.logos.forEach((l) => {
        ctx.fillText(l.toUpperCase(), x, y);
        x += ctx.measureText(l.toUpperCase()).width + 28;
      });
      y += 26;
    } else if (el === "rodape") {
      ctx.font = "11px system-ui";
      ctx.fillStyle = "#a09990";
      ctx.fillText(doc.textos.rodape, p, y + 10);
      y += 24;
    }
  }

  void nome;
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

export const arquivosDoRepo = [
  { arquivo: "src/components/estudio/Stage.tsx", papel: "palco, abas e artboard vivo" },
  { arquivo: "src/components/estudio/EstudioContext.tsx", papel: "documento, versões e conversa" },
  { arquivo: "src/components/estudio/EditPanels.tsx", papel: "texto, cor, layout, camadas e ajustes" },
  { arquivo: "src/components/estudio/RightPanel.tsx", papel: "versões, comentários e código" },
  { arquivo: "src/components/estudio/ChatPane.tsx", papel: "compositor e thread" },
  { arquivo: "src/components/estudio/Dialogs.tsx", papel: "exportar, compartilhar e design system" },
  { arquivo: "src/lib/estudio-doc.ts", papel: "modelo do documento, interpretador e exportação" },
  { arquivo: "src/routes/d.$designId.tsx", papel: "layout do workspace" },
  { arquivo: "src/lib/supabase.ts", papel: "cliente Supabase self-hosted" },
];

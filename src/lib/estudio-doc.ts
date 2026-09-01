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
}

export interface CanvasCamadaTexto {
  tipo: "texto";
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
}

export interface CanvasCamadaImagem {
  tipo: "imagem";
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  img?: { x: number; y: number; w: number; h: number };
  raio?: number;
  opacidade?: number;
  espelhoY?: boolean;
}

export interface CanvasCamadaForma {
  tipo: "forma";
  x: number;
  y: number;
  w: number;
  h: number;
  cor?: string;
  raio?: number;
  opacidade?: number;
  borda?: { largura: number; cor: string };
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

export function ehDocCanvas(d: unknown): d is DocCanvas {
  return (
    !!d &&
    typeof d === "object" &&
    (d as { kind?: unknown }).kind === "canvas" &&
    Array.isArray((d as { paginas?: unknown }).paginas)
  );
}

export type DocSalvo = DesignDoc | DocHtml | DocCanvas;

export const previewsHtml = {
  agrum: { nome: "Agrum Eleição", src: "/previews/agrum-eleicao/index.html" },
  barretos: { nome: "Barretos", src: "/previews/barretos/index.html" },
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

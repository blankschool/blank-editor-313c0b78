import type { CanvasParteTexto } from "./estudio-doc";

/** escapa texto para uso em innerHTML */
function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

export function estiloDaParte(p: CanvasParteTexto): string {
  const css: string[] = [];
  if (p.peso !== undefined) css.push(`font-weight:${p.peso}`);
  if (p.cor) css.push(`color:${p.cor}`);
  if (p.tamanho !== undefined) css.push(`font-size:${p.tamanho}px`);
  if (p.italico) css.push("font-style:italic");
  const dec = [p.sublinhado ? "underline" : "", p.riscado ? "line-through" : ""]
    .filter(Boolean)
    .join(" ");
  if (dec) css.push(`text-decoration:${dec}`);
  return css.join(";");
}

export function partesParaHtml(partes: CanvasParteTexto[]): string {
  if (!partes.length) return "";
  return partes
    .map((p) => {
      const css = estiloDaParte(p);
      return css ? `<span style="${css}">${escapar(p.texto)}</span>` : escapar(p.texto);
    })
    .join("");
}

/** texto corrido de um elemento editável, com quebras normalizadas */
export function textoDoElemento(el: HTMLElement): string {
  return (el.innerText ?? "").replace(/\r\n/g, "\n").replace(/\n$/, "");
}

export function offsetsDaSelecao(root: HTMLElement): { inicio: number; fim: number } | null {
  const sel = typeof window !== "undefined" ? window.getSelection() : null;
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null;
  const pre = r.cloneRange();
  pre.selectNodeContents(root);
  pre.setEnd(r.startContainer, r.startOffset);
  const inicio = pre.toString().length;
  const fim = inicio + r.toString().length;
  return { inicio, fim };
}

function nosDeTexto(root: HTMLElement): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n = walker.nextNode();
  while (n) {
    out.push(n as Text);
    n = walker.nextNode();
  }
  return out;
}

export function restaurarOffsets(root: HTMLElement, inicio: number, fim: number): void {
  const sel = window.getSelection();
  if (!sel) return;
  const nos = nosDeTexto(root);
  const achar = (alvo: number): { no: Node; off: number } => {
    let pos = 0;
    for (const t of nos) {
      const len = t.data.length;
      if (alvo <= pos + len) return { no: t, off: Math.max(0, alvo - pos) };
      pos += len;
    }
    const ultimo = nos[nos.length - 1];
    return ultimo ? { no: ultimo, off: ultimo.data.length } : { no: root, off: 0 };
  };
  const a = achar(inicio);
  const b = achar(fim);
  const r = document.createRange();
  try {
    r.setStart(a.no, a.off);
    r.setEnd(b.no, b.off);
  } catch {
    return;
  }
  sel.removeAllRanges();
  sel.addRange(r);
}

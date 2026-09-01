import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Ruler,
  Grid3x3,
  Hand,
  MousePointer2,
  RotateCw,
  ExternalLink,
  Maximize2,
  Minus,
  Plus,
  Smartphone,
  Tablet,
  Monitor,
  Pencil,
  X,
  Pin,
  MessageSquarePlus,
  ChevronRight,
  Type,
  Palette,
  LayoutGrid,
  Move,
  Copy,
  Trash2,
  Sparkles,
  MoreHorizontal,
  MessageSquare,

} from "lucide-react";
import { useEstudio } from "./EstudioContext";
import { cn } from "@/lib/utils";
import {
  ehDocCanvas,
  ehDocHtml,
  rotuloEl,
  tipoEl,
  type CanvasCamada,
  type CanvasPagina,
  comCamadaCanvas,
  type DesignDoc,
  type DocCanvas,
  type DocHtml,
  type ElId,
  type EstiloEl,
  idCamadaCanvas,
  acharCamadaCanvas,
  adicionarCamadaCanvas,
  duplicarCamadaCanvas,
  novaCamadaForma,
  novaCamadaTexto,
  removerCamadaCanvas,
} from "@/lib/estudio-doc";
import { toast } from "sonner";

export const larguras = { mobile: 340, tablet: 620, desktop: 880 } as const;

export function Stage() {
  const e = useEstudio();
  const palcoRef = useRef<HTMLDivElement>(null);
  const [respostaRapida, setRespostaRapida] = useState("");
  const [maisFerramentas, setMaisFerramentas] = useState(false);


  const comentariosVisiveis = e.comentarios.filter((c) =>
    e.filtroComentarios === "abertos" ? !c.resolvido : c.resolvido,
  );
  const ativo = e.comentarios.find((c) => c.id === e.comentarioAtivo) ?? null;

  const clicarPalco = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (!e.modoComentario || !palcoRef.current) return;
    const r = palcoRef.current.getBoundingClientRect();
    e.addComentario(((ev.clientX - r.left) / r.width) * 100, ((ev.clientY - r.top) / r.height) * 100);
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      {/* abas de arquivos */}
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border bg-surface px-2">
        {e.abas.map((a) => (
          <div
            key={a.id}
            onDoubleClick={() => e.fixarAba(a.id)}
            className={cn(
              "group flex h-7 max-w-[190px] items-center gap-1.5 rounded-t-md border border-b-0 px-2.5 text-[12px]",
              a.id === e.abaAtiva
                ? "border-border bg-card font-medium"
                : "border-transparent text-muted-foreground hover:bg-secondary",
            )}
          >
            {a.fixada && <Pin className="size-3 shrink-0 text-accent" />}
            <Link to="/d/$designId" params={{ designId: a.id }} className="truncate">
              {a.nome}
            </Link>
            <button
              onClick={() => e.moverAba(a.id, -1)}
              title="Mover para a esquerda"
              className="hidden text-muted-foreground hover:text-foreground group-hover:block"
            >
              ‹
            </button>
            <button
              onClick={() => e.moverAba(a.id, 1)}
              title="Mover para a direita"
              className="hidden text-muted-foreground hover:text-foreground group-hover:block"
            >
              ›
            </button>
            <button onClick={() => e.fecharAba(a.id)} className="opacity-0 group-hover:opacity-100">
              <X className="size-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => e.novoDesign()}
          title="Nova aba"
          className="grid size-6 place-items-center rounded-md hover:bg-secondary"
        >
          <Plus className="size-3.5" />
        </button>
        <div className="flex-1" />
        <button
          title="Recarregar o arquivo do zero"
          onClick={() => {
            e.recarregarDoc();
            toast.success("Arquivo recarregado no estado inicial.");
          }}
          className="grid size-6 place-items-center rounded-md hover:bg-secondary"
        >
          <RotateCw className="size-3.5" />
        </button>
        <button
          title="Abrir em nova janela"
          onClick={() => window.open(`/d/${e.abaAtiva}/apresentar`, "_blank", "noopener")}
          className="grid size-6 place-items-center rounded-md hover:bg-secondary"
        >
          <ExternalLink className="size-3.5" />
        </button>
      </div>

      {/* palco */}
      <div
        className="relative flex-1 overflow-hidden bg-canvas"
        style={{
          backgroundImage:
            e.ferramenta === "grade"
              ? "linear-gradient(to right, color-mix(in oklab, var(--foreground) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 8%, transparent) 1px, transparent 1px)"
              : undefined,
          backgroundSize: "24px 24px",
          cursor: e.ferramenta === "mao" ? "grab" : e.modoComentario ? "crosshair" : "default",
        }}
      >
        {e.ferramenta === "regua" && (
          <>
            <div className="absolute inset-x-0 top-0 h-4 border-b border-border bg-surface/80 text-[8px] text-muted-foreground">
              <div className="flex h-full">
                {Array.from({ length: 40 }).map((_, i) => (
                  <span key={i} className="w-12 shrink-0 border-r border-border/70 pl-0.5">
                    {i * 50}
                  </span>
                ))}
              </div>
            </div>
            <div className="absolute inset-y-0 left-0 w-4 border-r border-border bg-surface/80" />
          </>
        )}

        <div className="grid h-full place-items-center overflow-auto p-8">
          <div
            ref={palcoRef}
            onClick={clicarPalco}
            id="artboard-vivo"
            className="relative shrink-0 shadow-[var(--shadow-panel)] transition-[width,transform] duration-200"
            style={
              e.docCanvas
                ? {
                    width: 1080,
                    transform: `scale(${(e.zoom / 100) * (larguras[e.viewport] / 1080)})`,
                    transformOrigin: "center",
                    background: "transparent",
                    boxShadow: "none",
                  }
                : e.docHtml
                ? {
                    width: 1080,
                    height: 1440,
                    transform: `scale(${(e.zoom / 100) * (larguras[e.viewport] / 1080)})`,
                    transformOrigin: "center",
                    background: "var(--card)",
                  }
                : {
                    width: larguras[e.viewport],
                    transform: `scale(${e.zoom / 100})`,
                    transformOrigin: "center",
                    background: e.doc.fundo,
                    borderRadius: e.doc.layout.raio,
                  }
            }
          >
            {e.docCanvas ? (
              <Artboard doc={e.docCanvas} selecionavel />
            ) : e.docHtml ? (
              <Artboard doc={e.docHtml} />
            ) : (
              <Artboard doc={e.doc} selecionavel selecionado={e.selecionado} onSelecionar={e.setSelecionado} />
            )}

            {e.modoEdicao && e.selecionado && <SelecaoOverlay alvo={e.selecionado} palcoRef={palcoRef} />}

            {(e.modoComentario || e.painelDireito === "comentarios") &&
              comentariosVisiveis.map((c) => (
                <button
                  key={c.id}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    e.setComentarioAtivo(c.id);
                    e.setPainelDireito("comentarios");
                  }}
                  className={cn(
                    "absolute grid size-6 -translate-x-1/2 -translate-y-full place-items-center rounded-full rounded-bl-none text-[10px] font-bold shadow-[var(--shadow-panel)]",
                    c.resolvido ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground",
                  )}
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                >
                  {c.autor.charAt(0)}
                </button>
              ))}
          </div>
        </div>

        {ativo && e.painelDireito === "comentarios" && (
          <div className="absolute bottom-4 right-4 w-72 rounded-lg border border-border bg-popover p-3 shadow-[var(--shadow-panel)]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-semibold">{ativo.autor}</p>
              <button onClick={() => e.setComentarioAtivo(null)}>
                <X className="size-3.5 text-muted-foreground" />
              </button>
            </div>
            <input
              value={ativo.texto}
              onChange={(ev) => e.editarComentario(ativo.id, ev.target.value)}
              className="mt-1 w-full rounded border border-transparent bg-transparent text-[12px] text-surface-foreground outline-none hover:border-border focus:border-border"
            />
            {ativo.respostas.map((r, i) => (
              <p key={i} className="mt-2 border-l-2 border-border pl-2 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">{r.autor}: </span>
                {r.texto}
              </p>
            ))}
            <form
              className="mt-2 flex gap-1"
              onSubmit={(ev) => {
                ev.preventDefault();
                if (!respostaRapida.trim()) return;
                e.responderComentario(ativo.id, respostaRapida.trim());
                setRespostaRapida("");
              }}
            >
              <input
                value={respostaRapida}
                onChange={(ev) => setRespostaRapida(ev.target.value)}
                placeholder="Responder ou @mencionar"
                className="h-7 flex-1 rounded-md border border-border bg-card px-2 text-[11px] outline-none focus:ring-1 focus:ring-ring"
              />
              <button className="h-7 rounded-md bg-primary px-2 text-[11px] text-primary-foreground">Enviar</button>
            </form>
            <div className="mt-2 flex gap-2 text-[11px]">
              <button
                onClick={() => e.resolverComentario(ativo.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                {ativo.resolvido ? "Reabrir" : "Resolver"}
              </button>
              <button
                onClick={() => e.enviarPedido(`Corrigir no arquivo: ${ativo.texto}`)}
                className="flex items-center gap-1 text-accent"
              >
                <Sparkles className="size-3" /> Pedir correção ao assistente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* barra do palco */}
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-t border-border bg-surface px-2.5">
        <div className="flex items-center rounded-md border border-border bg-card">
          {(
            [
              ["cursor", MousePointer2, "Selecionar"],
              ["mao", Hand, "Mão / pan"],
              ["regua", Ruler, "Régua"],
              ["grade", Grid3x3, "Grade"],
            ] as const
          )
            .filter(([id]) => maisFerramentas || id === "cursor" || id === "mao")
            .map(([id, Icon, titulo]) => (

            <button
              key={id}
              title={titulo}
              onClick={() => e.setFerramenta(id)}
              className={cn(
                "grid size-6 place-items-center first:rounded-l-md last:rounded-r-md",
                e.ferramenta === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
              )}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>

        <div className="flex items-center rounded-md border border-border bg-card">
          <button
            onClick={() => e.setZoom(Math.max(25, e.zoom - 10))}
            className="grid size-6 place-items-center rounded-l-md hover:bg-secondary"
          >
            <Minus className="size-3" />
          </button>
          <button
            onClick={() => e.setZoom(100)}
            className="w-11 text-[11px] font-medium tabular-nums hover:bg-secondary"
          >
            {e.zoom}%
          </button>
          <button
            onClick={() => e.setZoom(Math.min(200, e.zoom + 10))}
            className="grid size-6 place-items-center rounded-r-md hover:bg-secondary"
          >
            <Plus className="size-3" />
          </button>
        </div>
        <button
          onClick={() => e.setZoom(80)}
          className="h-6 rounded-md border border-border bg-card px-2 text-[11px] hover:bg-secondary"
        >
          Ajustar
        </button>

        {maisFerramentas && (
          <div className="flex items-center rounded-md border border-border bg-card">
            {(
              [
                ["mobile", Smartphone],
                ["tablet", Tablet],
                ["desktop", Monitor],
              ] as const
            ).map(([id, Icon]) => (
              <button
                key={id}
                onClick={() => e.setViewport(id)}
                className={cn(
                  "grid size-6 place-items-center first:rounded-l-md last:rounded-r-md",
                  e.viewport === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                )}
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setMaisFerramentas((v) => !v)}
          title="Mais ferramentas"
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md border bg-card hover:bg-secondary",
            maisFerramentas ? "border-primary text-primary" : "border-border",
          )}
        >
          <MoreHorizontal className="size-3.5" />
        </button>

        <div className="flex-1" />

        {maisFerramentas && (
          <button
            onClick={() => {
              e.setModoComentario(!e.modoComentario);
              e.setPainelDireito("comentarios");
            }}
            className={cn(
              "flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-[11px] font-medium",
              e.modoComentario
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card hover:bg-secondary",
            )}
          >
            <MessageSquarePlus className="size-3.5" /> Comentar
          </button>
        )}

        <button
          onClick={() => e.setApresentando(true)}
          className="flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2 text-[11px] font-medium hover:bg-secondary"
        >
          <Maximize2 className="size-3.5" /> Apresentar
        </button>
        <button
          onClick={() => {
            const proximo = !e.modoEdicao;
            if (proximo) {
              if (!e.docCanvas && !e.docHtml && !e.selecionado) e.setSelecionado("titulo");
              e.setPainelEdicao("texto");
            } else {
              e.setModoEdicao(false);
            }
          }}
          className={cn(
            "flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[11px] font-semibold",
            e.modoEdicao ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          <Pencil className="size-3.5" /> {e.modoEdicao ? "Sair da edição" : "Editar"}
        </button>
        {!e.conversaAberta && (
          <button
            onClick={() => e.setConversaAberta(true)}
            className="flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2 text-[11px] font-medium hover:bg-secondary"
          >
            <MessageSquare className="size-3.5" /> Conversa
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------------- artboard vivo ---------------- */

function estiloCss(s: EstiloEl | undefined): React.CSSProperties {
  if (!s) return {};
  return {
    color: s.cor,
    background: s.fundo,
    border: s.borda ? `1px solid ${s.borda}` : undefined,
    opacity: s.opacidade !== undefined ? s.opacidade / 100 : undefined,
    fontFamily: s.fonte,
    fontWeight: s.peso as React.CSSProperties["fontWeight"],
    fontSize: s.tamanho ? `${s.tamanho}px` : undefined,
    textTransform: s.caixa && s.caixa !== "normal" ? s.caixa : undefined,
    textAlign: s.alinhamento,
    lineHeight: s.entrelinha,
    letterSpacing: s.entreLetras !== undefined ? `${s.entreLetras}em` : undefined,
  };
}

function CamadaCanvasView({
  c,
  selecionada,
  onSelecionar,
  onPointerDown,
}: {
  c: CanvasCamada;
  selecionada?: boolean;
  onSelecionar?: (() => void) | undefined;
  onPointerDown?: ((ev: React.PointerEvent) => void) | undefined;
}) {
  if (c.oculto) return null;
  const marca: React.CSSProperties = selecionada
    ? { outline: "2px solid hsl(var(--accent))", outlineOffset: 0 }
    : {};
  const clique = onSelecionar
    ? (ev: React.MouseEvent) => {
        ev.stopPropagation();
        onSelecionar();
      }
    : undefined;
  if (c.tipo === "imagem") {
    const inner = c.img ?? { x: 0, y: 0, w: c.w, h: c.h };
    return (
      <div
        style={{
          position: "absolute",
          left: c.x,
          top: c.y,
          width: c.w,
          height: c.h,
          overflow: "hidden",
          borderRadius: c.raio,
          opacity: c.opacidade,
          boxShadow: c.sombra ? `${c.sombra.x}px ${c.sombra.y}px ${c.sombra.blur}px ${c.sombra.cor}` : undefined,
          ...marca,
        }}
        onClick={clique}
        onPointerDown={onPointerDown}
      >
        <img
          src={c.src}
          alt=""
          style={{
            position: "absolute",
            display: "block",
            left: inner.x,
            top: inner.y,
            width: inner.w,
            height: inner.h,
            transform: c.espelhoY ? "scaleY(-1)" : undefined,
          }}
        />
      </div>
    );
  }
  if (c.tipo === "forma") {
    return (
      <div
        style={{
          position: "absolute",
          left: c.x,
          top: c.y,
          width: c.w,
          height: c.h,
          background: c.cor,
          borderRadius: c.raio,
          opacity: c.opacidade,
          border: c.borda ? `${c.borda.largura}px ${c.borda.estilo ?? "solid"} ${c.borda.cor}` : undefined,
          boxShadow: c.sombra ? `${c.sombra.x}px ${c.sombra.y}px ${c.sombra.blur}px ${c.sombra.cor}` : undefined,
          boxSizing: "border-box",
          ...marca,
        }}
        onClick={clique}
        onPointerDown={onPointerDown}
      />
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        left: c.x,
        top: c.y,
        width: c.w,
        height: c.h,
        fontFamily: c.fonte ? `"${c.fonte}", sans-serif` : undefined,
        fontWeight: c.peso,
        fontSize: c.tamanho,
        lineHeight: c.entrelinha !== undefined ? `${c.entrelinha}px` : undefined,
        letterSpacing: c.entreLetras !== undefined ? `${c.entreLetras}px` : undefined,
        color: c.cor,
        textAlign: c.alinhamento,
        opacity: c.opacidade,
        whiteSpace: c.quebra ? "pre-wrap" : "pre",
        textShadow: c.sombra ? `${c.sombra.x}px ${c.sombra.y}px ${c.sombra.blur}px ${c.sombra.cor}` : undefined,
        fontKerning: "none",
        fontVariantLigatures: "none",
        ...marca,
      }}
      onClick={clique}
      onPointerDown={onPointerDown}
    >
      {c.partes
        ? c.partes.map((p, i) => (
            <span key={i} style={{ fontWeight: p.peso, color: p.cor }}>
              {p.texto}
            </span>
          ))
        : c.texto}
    </div>
  );
}

interface Geo {
  x: number;
  y: number;
  w: number;
  h: number;
}

type ModoArraste = "mover" | "nw" | "ne" | "sw" | "se";

const MARGEM_PRANCHETA = 108;
const TOLERANCIA_SNAP = 4;

function geoDaCamada(c: CanvasCamada): Geo {
  return { x: c.x, y: c.y, w: (c as { w?: number }).w ?? 0, h: (c as { h?: number }).h ?? 0 };
}

function alvosGuias(pagina: CanvasPagina, ignorar: string): { v: number[]; h: number[] } {
  const L = pagina.largura || 1080;
  const H = pagina.altura || 1440;
  const v = [MARGEM_PRANCHETA, L - MARGEM_PRANCHETA, L / 2];
  const h = [MARGEM_PRANCHETA, H - MARGEM_PRANCHETA, H / 2];
  (pagina.camadas ?? []).forEach((c, j) => {
    const cid = idCamadaCanvas(c, j, pagina.id ?? "p");
    if (cid === ignorar || c.oculto) return;
    const g = geoDaCamada(c);
    v.push(g.x, g.x + g.w / 2, g.x + g.w);
    h.push(g.y, g.y + g.h / 2, g.y + g.h);
  });
  return { v, h };
}

function encaixar(
  geo: Geo,
  pagina: CanvasPagina,
  ignorar: string,
  modo: ModoArraste,
): { geo: Geo; guias: { v: number[]; h: number[] } } {
  const alvos = alvosGuias(pagina, ignorar);
  const guias: { v: number[]; h: number[] } = { v: [], h: [] };
  const out: Geo = { ...geo };

  const bordasV: Array<[number, number]> =
    modo === "mover"
      ? [
          [geo.x, 0],
          [geo.x + geo.w / 2, geo.w / 2],
          [geo.x + geo.w, geo.w],
        ]
      : modo === "nw" || modo === "sw"
        ? [[geo.x, 0]]
        : [[geo.x + geo.w, geo.w]];
  let melhorV: { delta: number; linha: number } | null = null;
  bordasV.forEach(([pos]) => {
    alvos.v.forEach((t) => {
      const d = t - pos;
      if (Math.abs(d) <= TOLERANCIA_SNAP && (!melhorV || Math.abs(d) < Math.abs(melhorV.delta)))
        melhorV = { delta: d, linha: t };
    });
  });
  if (melhorV) {
    const mv = melhorV as { delta: number; linha: number };
    if (modo === "mover") out.x += mv.delta;
    else if (modo === "nw" || modo === "sw") {
      out.x += mv.delta;
      out.w -= mv.delta;
    } else out.w += mv.delta;
    guias.v.push(mv.linha);
  }

  const bordasH: Array<[number, number]> =
    modo === "mover"
      ? [
          [geo.y, 0],
          [geo.y + geo.h / 2, geo.h / 2],
          [geo.y + geo.h, geo.h],
        ]
      : modo === "nw" || modo === "ne"
        ? [[geo.y, 0]]
        : [[geo.y + geo.h, geo.h]];
  let melhorH: { delta: number; linha: number } | null = null;
  bordasH.forEach(([pos]) => {
    alvos.h.forEach((t) => {
      const d = t - pos;
      if (Math.abs(d) <= TOLERANCIA_SNAP && (!melhorH || Math.abs(d) < Math.abs(melhorH.delta)))
        melhorH = { delta: d, linha: t };
    });
  });
  if (melhorH) {
    const mh = melhorH as { delta: number; linha: number };
    if (modo === "mover") out.y += mh.delta;
    else if (modo === "nw" || modo === "ne") {
      out.y += mh.delta;
      out.h -= mh.delta;
    } else out.h += mh.delta;
    guias.h.push(mh.linha);
  }

  return { geo: out, guias };
}

export function CanvasView({
  doc,
  selecionada = null,
  onSelecionar,
  escala = 1,
  arrastavel = false,
  onGeometria,
}: {
  doc: DocCanvas;
  selecionada?: string | null;
  onSelecionar?: ((paginaId: string, camadaId: string) => void) | undefined;
  escala?: number;
  arrastavel?: boolean;
  onGeometria?: ((paginaId: string, camadaId: string, geo: Geo, modo: ModoArraste) => void) | undefined;
}) {
  const [arraste, setArraste] = useState<{
    paginaId: string;
    camadaId: string;
    modo: ModoArraste;
    geo: Geo;
    guias: { v: number[]; h: number[] };
  } | null>(null);
  const refArraste = useRef<{
    paginaId: string;
    camadaId: string;
    modo: ModoArraste;
    inicio: Geo;
    px: number;
    py: number;
    pagina: CanvasPagina;
    atual: Geo;
  } | null>(null);

  const paginas = Array.isArray(doc.paginas) ? doc.paginas : [];

  useEffect(() => {
    if (!arraste) return;
    const mover = (ev: PointerEvent) => {
      const st = refArraste.current;
      if (!st) return;
      const dx = (ev.clientX - st.px) / (escala || 1);
      const dy = (ev.clientY - st.py) / (escala || 1);
      let bruto: Geo;
      if (st.modo === "mover") {
        bruto = { ...st.inicio, x: st.inicio.x + dx, y: st.inicio.y + dy };
      } else {
        const esq = st.modo === "nw" || st.modo === "sw";
        const topo = st.modo === "nw" || st.modo === "ne";
        const w = Math.max(8, st.inicio.w + (esq ? -dx : dx));
        const h = Math.max(8, st.inicio.h + (topo ? -dy : dy));
        bruto = {
          x: esq ? st.inicio.x + (st.inicio.w - w) : st.inicio.x,
          y: topo ? st.inicio.y + (st.inicio.h - h) : st.inicio.y,
          w,
          h,
        };
      }
      const { geo, guias } = encaixar(bruto, st.pagina, st.camadaId, st.modo);
      const arredondado: Geo = {
        x: Math.round(geo.x),
        y: Math.round(geo.y),
        w: Math.round(geo.w),
        h: Math.round(geo.h),
      };
      st.atual = arredondado;
      setArraste({ paginaId: st.paginaId, camadaId: st.camadaId, modo: st.modo, geo: arredondado, guias });
    };
    const soltar = () => {
      const st = refArraste.current;
      refArraste.current = null;
      setArraste(null);
      if (st && onGeometria) onGeometria(st.paginaId, st.camadaId, st.atual, st.modo);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
  }, [arraste !== null, escala, onGeometria]);

  const iniciar = (
    ev: React.PointerEvent,
    pagina: CanvasPagina,
    paginaId: string,
    camadaId: string,
    camada: CanvasCamada,
    modo: ModoArraste,
  ) => {
    if (!arrastavel || ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    const inicio = geoDaCamada(camada);
    refArraste.current = {
      paginaId,
      camadaId,
      modo,
      inicio,
      px: ev.clientX,
      py: ev.clientY,
      pagina,
      atual: inicio,
    };
    setArraste({ paginaId, camadaId, modo, geo: inicio, guias: { v: [], h: [] } });
  };

  if (!paginas.length) {
    return (
      <div className="grid h-[1440px] w-[1080px] place-items-center text-sm text-muted-foreground">
        Canvas sem páginas.
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-10">
      {paginas.map((p, i) => {
        const pid = p.id ?? `p${i + 1}`;
        const selNaPagina = (p.camadas ?? []).find(
          (c, j) => idCamadaCanvas(c, j, pid) === selecionada && !c.oculto,
        );
        const geoSel = selNaPagina
          ? arraste && arraste.camadaId === selecionada
            ? arraste.geo
            : geoDaCamada(selNaPagina)
          : null;
        const alcas = selNaPagina && selNaPagina.tipo !== "texto";
        const lado = 10 / (escala || 1);
        return (
          <div key={pid} className="relative">
            {paginas.length > 1 && (
              <span className="absolute -top-7 left-0 text-[11px] font-medium text-muted-foreground">
                {p.nome ?? `Página ${i + 1}`} · {i + 1}/{paginas.length}
              </span>
            )}
            <div
              style={{
                position: "relative",
                width: p.largura || 1080,
                height: p.altura || 1440,
                overflow: "hidden",
                background: p.fundo ?? "#ffffff",
                textRendering: "geometricPrecision",
              }}
            >
              {(p.camadas ?? []).map((c, j) => {
                const cid = idCamadaCanvas(c, j, pid);
                const vivo =
                  arraste && arraste.camadaId === cid
                    ? ({ ...c, x: arraste.geo.x, y: arraste.geo.y, ...(c.tipo === "texto" ? {} : { w: arraste.geo.w, h: arraste.geo.h }) } as CanvasCamada)
                    : c;
                return (
                  <CamadaCanvasView
                    key={cid}
                    c={vivo}
                    selecionada={selecionada === cid}
                    onSelecionar={onSelecionar ? () => onSelecionar(pid, cid) : undefined}
                    onPointerDown={
                      arrastavel
                        ? (ev) => {
                            onSelecionar?.(pid, cid);
                            iniciar(ev, p, pid, cid, c, "mover");
                          }
                        : undefined
                    }
                  />
                );
              })}

              {geoSel && selNaPagina && (
                <div
                  style={{
                    position: "absolute",
                    left: geoSel.x,
                    top: geoSel.y - 14 / (escala || 1) - 8 / (escala || 1),
                    transform: `scale(${1 / (escala || 1)})`,
                    transformOrigin: "left bottom",
                    background: "hsl(var(--accent))",
                    color: "hsl(var(--accent-foreground))",
                    fontSize: 10,
                    fontWeight: 600,
                    lineHeight: "14px",
                    padding: "0 6px",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 70,
                  }}
                >
                  {selNaPagina.nome ?? selNaPagina.tipo} · {Math.round(geoSel.w)}×{Math.round(geoSel.h)}
                </div>
              )}

              {alcas && geoSel && selNaPagina && (
                <>
                  {(["nw", "ne", "sw", "se"] as const).map((m) => (
                    <div
                      key={m}
                      onPointerDown={(ev) => iniciar(ev, p, pid, selecionada!, selNaPagina, m)}
                      style={{
                        position: "absolute",
                        width: lado,
                        height: lado,
                        left: (m === "nw" || m === "sw" ? geoSel.x : geoSel.x + geoSel.w) - lado / 2,
                        top: (m === "nw" || m === "ne" ? geoSel.y : geoSel.y + geoSel.h) - lado / 2,
                        background: "hsl(var(--accent))",
                        border: `${1 / (escala || 1)}px solid #fff`,
                        borderRadius: lado / 2,
                        cursor: m === "nw" || m === "se" ? "nwse-resize" : "nesw-resize",
                        zIndex: 50,
                      }}
                    />
                  ))}
                </>
              )}

              {arraste && arraste.paginaId === pid && (
                <>
                  {arraste.guias.v.map((x) => (
                    <div
                      key={`v${x}`}
                      style={{
                        position: "absolute",
                        left: x,
                        top: 0,
                        bottom: 0,
                        width: 1 / (escala || 1),
                        background: "hsl(var(--accent))",
                        pointerEvents: "none",
                        zIndex: 60,
                      }}
                    />
                  ))}
                  {arraste.guias.h.map((y) => (
                    <div
                      key={`h${y}`}
                      style={{
                        position: "absolute",
                        top: y,
                        left: 0,
                        right: 0,
                        height: 1 / (escala || 1),
                        background: "hsl(var(--accent))",
                        pointerEvents: "none",
                        zIndex: 60,
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CanvasComSelecao({ doc }: { doc: DocCanvas }) {
  const e = useEstudio();
  const escala = (e.zoom / 100) * (larguras[e.viewport] / 1080);
  const podeArrastar = e.ferramenta === "cursor";
  const gravar = useCallback(
    (pid: string, cid: string, geo: { x: number; y: number; w: number; h: number }, modo: string) => {
      e.atualizarDocCanvas(
        (d) =>
          comCamadaCanvas(d, pid, cid, (c) => {
            c.x = geo.x;
            c.y = geo.y;
            if (modo !== "mover" && c.tipo !== "texto") {
              if (c.tipo === "imagem" && c.img && c.w && c.h) {
                const rx = geo.w / c.w;
                const ry = geo.h / c.h;
                c.img = {
                  x: c.img.x * rx,
                  y: c.img.y * ry,
                  w: c.img.w * rx,
                  h: c.img.h * ry,
                };
              }
              c.w = geo.w;
              c.h = geo.h;
            }
          }),
        modo === "mover" ? "Moveu camada" : "Redimensionou camada",
      );
    },
    [e],
  );
  useEffect(() => {
    const emCampo = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };
    const onKey = (ev: KeyboardEvent) => {
      if (emCampo(ev.target)) return;
      const paginas = Array.isArray(doc.paginas) ? doc.paginas : [];
      const pagina = paginas.find((p, i) => (p.id ?? `p${i + 1}`) === e.paginaCanvas) ?? paginas[0];
      if (!pagina) return;
      const pid = pagina.id ?? "p1";
      const sel = e.camadaCanvas;
      const k = ev.key;
      const meta = ev.metaKey || ev.ctrlKey;

      if (!meta && (k === "v" || k === "V")) return e.setFerramenta("cursor");
      if (!meta && (k === "h" || k === "H")) return e.setFerramenta("mao");
      if (!meta && (k === "t" || k === "T")) {
        const nova = novaCamadaTexto(pagina);
        e.atualizarDocCanvas((d) => adicionarCamadaCanvas(d, pid, nova), "Nova camada de texto");
        e.setPaginaCanvas(pid);
        e.setCamadaCanvas(nova.id!);
        ev.preventDefault();
        return;
      }
      if (!meta && (k === "r" || k === "R")) {
        const nova = novaCamadaForma(pagina);
        e.atualizarDocCanvas((d) => adicionarCamadaCanvas(d, pid, nova), "Nova forma");
        e.setPaginaCanvas(pid);
        e.setCamadaCanvas(nova.id!);
        ev.preventDefault();
        return;
      }
      if (!sel) return;
      if (meta && (k === "d" || k === "D")) {
        const achado = acharCamadaCanvas(doc, e.paginaCanvas, sel);
        if (!achado) return;
        const copia = duplicarCamadaCanvas(achado.camada);
        e.atualizarDocCanvas((d) => adicionarCamadaCanvas(d, pid, copia), "Duplicou camada");
        e.setCamadaCanvas(copia.id!);
        ev.preventDefault();
        return;
      }
      if (k === "Delete" || k === "Backspace") {
        e.atualizarDocCanvas((d) => removerCamadaCanvas(d, pid, sel), "Apagou camada");
        e.setCamadaCanvas(null);
        ev.preventDefault();
        return;
      }
      const passo = ev.shiftKey ? 10 : 1;
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [-passo, 0],
        ArrowRight: [passo, 0],
        ArrowUp: [0, -passo],
        ArrowDown: [0, passo],
      };
      const d2 = delta[k];
      if (d2) {
        e.atualizarDocCanvas(
          (d) =>
            comCamadaCanvas(d, pid, sel, (c) => {
              c.x = (c.x ?? 0) + d2[0]!;
              c.y = (c.y ?? 0) + d2[1]!;
            }),
          "Moveu camada",
        );
        ev.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, e]);

  return (
    <CanvasView
      doc={doc}
      selecionada={e.camadaCanvas}
      escala={escala}
      arrastavel={podeArrastar}
      onGeometria={gravar}
      onSelecionar={(pid, cid) => {
        e.setPaginaCanvas(pid);
        e.setCamadaCanvas(cid);
      }}
    />
  );
}

export function Artboard({
  doc,
  selecionavel = false,
  selecionado = null,
  onSelecionar,
}: {
  doc: DesignDoc | DocHtml | DocCanvas;
  selecionavel?: boolean;
  selecionado?: ElId | null;
  onSelecionar?: (id: ElId) => void;
}) {
  if (ehDocCanvas(doc)) {
    try {
      return selecionavel ? <CanvasComSelecao doc={doc} /> : <CanvasView doc={doc} />;
    } catch {
      return (
        <div className="grid h-[1440px] w-[1080px] place-items-center text-sm text-muted-foreground">
          Não foi possível desenhar este canvas.
        </div>
      );
    }
  }
  if (ehDocHtml(doc)) {
    return (
      <iframe
        src={doc.src}
        title="Preview"
        width={1080}
        height={1440}
        className="block h-[1440px] w-[1080px] border-0"
      />
    );
  }

  const wrap = (id: ElId, node: React.ReactNode) => {
    const s = doc.estilos[id];
    if (s?.oculto) return null;
    return (
      <div
        key={id}
        data-el={id}
        onClick={
          selecionavel
            ? (ev) => {
                ev.stopPropagation();
                if (!s?.travado) onSelecionar?.(id);
              }
            : undefined
        }
        className={cn(
          selecionavel && "cursor-default rounded-sm outline-offset-2 hover:outline hover:outline-1 hover:outline-accent/50",
          selecionado === id && selecionavel && "outline outline-2 outline-accent",
        )}
      >
        {node}
      </div>
    );
  };

  const conteudo = (id: ElId): React.ReactNode => {
    const s = doc.estilos[id];
    const st = estiloCss(s);
    switch (id) {
      case "topo":
        return (
          <div
            className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            style={st}
          >
            <span className="font-semibold">{doc.textos.midia}</span>
            <span>{doc.textos.topo}</span>
          </div>
        );
      case "titulo":
        return (
          <h2
            className={cn("font-semibold leading-tight tracking-tight", doc.heroiCheio ? "max-w-full" : "max-w-[80%]")}
            style={{ fontSize: 32, ...st }}
          >
            {doc.textos.titulo}
          </h2>
        );
      case "subtitulo":
        return (
          <p
            className={cn("text-[13px] leading-relaxed text-muted-foreground", doc.heroiCheio ? "" : "max-w-[70%]")}
            style={st}
          >
            {doc.textos.subtitulo}
          </p>
        );
      case "cta": {
        const sec = doc.estilos.ctaSecundario;
        return (
          <div className={cn("flex gap-2", doc.estilos.titulo?.alinhamento === "center" && "justify-center")}>
            <span
              className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground"
              style={{ ...estiloCss(s), borderRadius: doc.layout.raio }}
            >
              {doc.textos.cta}
            </span>
            {!sec?.oculto && (
              <span
                className="rounded-md border border-border px-3 py-1.5 text-[12px] font-medium"
                style={{ ...estiloCss(sec), borderRadius: doc.layout.raio }}
              >
                {doc.textos.ctaSecundario}
              </span>
            )}
          </div>
        );
      }
      case "ctaSecundario":
        return null;
      case "midia":
        return (
          <div
            className="w-full bg-canvas"
            style={{ height: doc.heroiCheio ? 240 : 160, borderRadius: doc.layout.raio, ...st }}
          />
        );
      case "prova":
        return doc.provaSocial ? (
          <div className="flex flex-wrap items-center gap-6 border-t border-border pt-4" style={st}>
            {doc.logos.map((l) => (
              <span key={l} className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {l}
              </span>
            ))}
          </div>
        ) : null;
      case "rodape":
        return (
          <p className="text-[11px] text-muted-foreground" style={st}>
            {doc.textos.rodape}
          </p>
        );
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        padding: doc.layout.padding,
        gap: doc.layout.gap + (100 - doc.densidade) * 0.08,
        borderRadius: doc.layout.raio,
        border: doc.layout.borda ? `${doc.layout.borda}px solid var(--border)` : undefined,
        flexDirection: doc.layout.direcao === "linha" ? "row" : "column",
      }}
    >
      {doc.ordem.map((id) => {
        const node = conteudo(id);
        return node ? wrap(id, node) : null;
      })}
    </div>
  );
}

/* ---------------- overlay de seleção medido no DOM ---------------- */

function SelecaoOverlay({
  alvo,
  palcoRef,
}: {
  alvo: ElId;
  palcoRef: React.RefObject<HTMLDivElement | null>;
}) {
  const e = useEstudio();
  const [caixa, setCaixa] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [palcoW, setPalcoW] = useState(0);
  const barraRef = useRef<HTMLDivElement | null>(null);
  const [barra, setBarra] = useState({ w: 0, h: 0 });

  const medir = useCallback(() => {
    const palco = palcoRef.current;
    const el = palco?.querySelector<HTMLElement>(`[data-el="${alvo}"]`);
    if (!palco || !el) return setCaixa(null);
    const p = palco.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const escala = e.zoom / 100;
    setPalcoW(p.width / escala);
    setCaixa({ x: (r.left - p.left) / escala, y: (r.top - p.top) / escala, w: r.width / escala, h: r.height / escala });
  }, [alvo, palcoRef, e.zoom]);

  useLayoutEffect(medir, [medir, e.doc]);
  useEffect(() => {
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [medir]);

  useLayoutEffect(() => {
    const el = barraRef.current;
    if (!el) return;
    const escala = e.zoom / 100;
    const aplicar = () => {
      const r = el.getBoundingClientRect();
      setBarra({ w: r.width / escala, h: r.height / escala });
    };
    aplicar();
    const ro = new ResizeObserver(aplicar);
    ro.observe(el);
    return () => ro.disconnect();
  }, [e.zoom, alvo]);

  const grupo = alvo === "topo" ? "Topo" : alvo === "prova" ? "Prova social" : alvo === "rodape" ? "Rodapé" : "Herói";

  const ESPACO = 12;
  const acimaTem = caixa ? caixa.y - barra.h - ESPACO >= 0 : false;
  const topoBarra = caixa
    ? acimaTem
      ? caixa.y - barra.h - ESPACO
      : caixa.y + caixa.h + ESPACO
    : 0;
  const esquerdaBarra = caixa
    ? Math.max(4, Math.min(caixa.x, Math.max(4, (palcoW || caixa.x + barra.w) - barra.w - 4)))
    : 0;

  return (
    <>
      {caixa && (
        <div
          className="pointer-events-none absolute rounded-sm outline outline-2 outline-accent"
          style={{ left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h }}
        >
          {["-left-1 -top-1", "-right-1 -top-1", "-bottom-1 -left-1", "-bottom-1 -right-1"].map((pos) => (
            <span key={pos} className={cn("absolute size-2 rounded-[2px] border border-accent bg-card", pos)} />
          ))}
        </div>
      )}

      <div
        ref={barraRef}
        className={cn(
          "absolute flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-[var(--shadow-panel)]",
          !caixa && "hidden",
        )}
        style={{ left: esquerdaBarra, top: topoBarra, transform: "none" }}
      >
        <span className="flex items-center gap-0.5 pl-1 pr-1 text-[10px]">
          <span className="text-muted-foreground">{grupo}</span>
          <ChevronRight className="size-2.5 text-muted-foreground" />
          <span className="font-semibold text-accent">{rotuloEl[alvo]}</span>
        </span>
        <span className="mx-1 h-4 w-px bg-border" />

        {(
          [
            ["texto", Type, "Texto"],
            ["cor", Palette, "Cor"],
            ["layout", LayoutGrid, "Layout"],
            ["estrutura", Move, "Estrutura"],
          ] as const
        ).map(([id, Icon, titulo]) => (
          <button
            key={id}
            title={titulo}
            onClick={() => e.setPainelEdicao(id)}
            className={cn(
              "flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px]",
              e.painelEdicao === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
            )}
          >
            <Icon className="size-3.5" /> {titulo}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        <button
          title="Duplicar elemento"
          onClick={() =>
            e.atualizarDoc((d) => {
              const i = d.ordem.indexOf(alvo);
              const copia: ElId = alvo === "cta" ? "ctaSecundario" : "midia";
              if (d.ordem.includes(copia) && copia !== alvo) return d;
              const ordem = [...d.ordem];
              ordem.splice(i + 1, 0, copia);
              return { ...d, ordem, estilos: { ...d.estilos, [copia]: { ...(d.estilos[alvo] ?? {}), oculto: false } } };
            }, `Duplicou ${rotuloEl[alvo]}`)
          }
          className="grid size-6 place-items-center rounded-md hover:bg-secondary"
        >
          <Copy className="size-3.5" />
        </button>
        <button
          title="Excluir elemento"
          onClick={() => {
            e.atualizarDoc(
              (d) => ({ ...d, estilos: { ...d.estilos, [alvo]: { ...(d.estilos[alvo] ?? {}), oculto: true } } }),
              `Ocultou ${rotuloEl[alvo]}`,
            );
          }}
          className="grid size-6 place-items-center rounded-md hover:bg-secondary"
        >
          <Trash2 className="size-3.5" />
        </button>
        <span className="mx-1 h-4 w-px bg-border" />
        <button
          onClick={() => e.enviarPedido(`Melhorar ${rotuloEl[alvo].toLowerCase()} do herói com mais respiro`)}
          className="flex h-6 items-center gap-1 whitespace-nowrap rounded-md bg-accent px-2 text-[11px] font-medium text-accent-foreground"
        >
          <Sparkles className="size-3" /> Pedir ao assistente
        </button>
      </div>
    </>
  );
}

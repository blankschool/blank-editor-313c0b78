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
import { rotuloEl, tipoEl, type DesignDoc, type ElId, type EstiloEl } from "@/lib/estudio-doc";
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
          onClick={e.novoDesign}
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
            style={{
              width: larguras[e.viewport],
              transform: `scale(${e.zoom / 100})`,
              transformOrigin: "center",
              background: e.doc.fundo,
              borderRadius: e.doc.layout.raio,
            }}
          >
            <Artboard doc={e.doc} selecionavel selecionado={e.selecionado} onSelecionar={e.setSelecionado} />

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
              e.setSelecionado(e.selecionado ?? "titulo");
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

export function Artboard({
  doc,
  selecionavel = false,
  selecionado = null,
  onSelecionar,
}: {
  doc: DesignDoc;
  selecionavel?: boolean;
  selecionado?: ElId | null;
  onSelecionar?: (id: ElId) => void;
}) {
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

  const medir = useCallback(() => {
    const palco = palcoRef.current;
    const el = palco?.querySelector<HTMLElement>(`[data-el="${alvo}"]`);
    if (!palco || !el) return setCaixa(null);
    const p = palco.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const escala = e.zoom / 100;
    setCaixa({ x: (r.left - p.left) / escala, y: (r.top - p.top) / escala, w: r.width / escala, h: r.height / escala });
  }, [alvo, palcoRef, e.zoom]);

  useLayoutEffect(medir, [medir, e.doc]);
  useEffect(() => {
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [medir]);

  const grupo = alvo === "topo" ? "Topo" : alvo === "prova" ? "Prova social" : alvo === "rodape" ? "Rodapé" : "Herói";

  return (
    <>
      {caixa && (
        <div
          className="pointer-events-none absolute rounded-sm outline outline-2 outline-accent"
          style={{ left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h }}
        >
          <span className="absolute -top-5 left-0 rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
            {tipoEl[alvo]}.{rotuloEl[alvo].toLowerCase()} · {Math.round(caixa.w)}×{Math.round(caixa.h)}
          </span>
          {["-left-1 -top-1", "-right-1 -top-1", "-bottom-1 -left-1", "-bottom-1 -right-1"].map((pos) => (
            <span key={pos} className={cn("absolute size-2 rounded-[2px] border border-accent bg-card", pos)} />
          ))}
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded bg-primary px-1 text-[9px] text-primary-foreground">
            {Math.round(e.doc.layout.gap)} px
          </span>
        </div>
      )}

      <div className="absolute left-3 top-3 flex items-center gap-0.5 rounded-md border border-border bg-popover px-1.5 py-1 text-[10px] shadow-[var(--shadow-panel)]">
        <span className="rounded px-1 py-0.5 text-muted-foreground">{grupo}</span>
        <ChevronRight className="size-2.5 text-muted-foreground" />
        <span className="rounded px-1 py-0.5 font-semibold text-accent">{rotuloEl[alvo]}</span>
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-[var(--shadow-panel)]">
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
            e.atualizarDoc((d) => ({ ...d, ordem: d.ordem.filter((x) => x !== alvo) }), `Excluiu ${rotuloEl[alvo]}`);
            e.setSelecionado(null);
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

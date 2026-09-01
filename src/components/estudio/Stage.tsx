import { useRef, useState } from "react";
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
} from "lucide-react";
import { useEstudio } from "./EstudioContext";
import { cn } from "@/lib/utils";

const larguras = { mobile: 340, tablet: 620, desktop: 880 } as const;

export function Stage() {
  const e = useEstudio();
  const palcoRef = useRef<HTMLDivElement>(null);
  const [respostaRapida, setRespostaRapida] = useState("");

  const abaAtual = e.abas.find((a) => a.id === e.abaAtiva);
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
      {/* 1d — abas de arquivos */}
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
        <button title="Recarregar" className="grid size-6 place-items-center rounded-md hover:bg-secondary">
          <RotateCw className="size-3.5" />
        </button>
        <button title="Abrir em nova janela" className="grid size-6 place-items-center rounded-md hover:bg-secondary">
          <ExternalLink className="size-3.5" />
        </button>
      </div>

      {/* 1d/1e — palco */}
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
            className="relative shrink-0 bg-card shadow-[var(--shadow-panel)] transition-[width,transform] duration-200"
            style={{
              width: larguras[e.viewport],
              transform: `scale(${e.zoom / 100})`,
              transformOrigin: "center",
            }}
          >
            <Artboard nome={abaAtual?.nome ?? "Sem arquivo"} />

            {/* seleção do modo editar */}
            {e.modoEdicao && e.selecionado && <SelecaoOverlay />}

            {/* pinos de comentário */}
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

        {/* thread flutuante */}
        {ativo && e.painelDireito === "comentarios" && (
          <div className="absolute bottom-4 right-4 w-72 rounded-lg border border-border bg-popover p-3 shadow-[var(--shadow-panel)]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-semibold">{ativo.autor}</p>
              <button onClick={() => e.setComentarioAtivo(null)}>
                <X className="size-3.5 text-muted-foreground" />
              </button>
            </div>
            <p className="mt-1 text-[12px] text-surface-foreground">{ativo.texto}</p>
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
              <button onClick={() => e.resolverComentario(ativo.id)} className="text-muted-foreground hover:text-foreground">
                {ativo.resolvido ? "Reabrir" : "Resolver"}
              </button>
              <button className="flex items-center gap-1 text-accent">
                <Sparkles className="size-3" /> Pedir correção ao assistente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1d/6 — barra do palco */}
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-t border-border bg-surface px-2.5">
        <div className="flex items-center rounded-md border border-border bg-card">
          {(
            [
              ["cursor", MousePointer2, "Selecionar"],
              ["mao", Hand, "Mão / pan"],
              ["regua", Ruler, "Régua"],
              ["grade", Grid3x3, "Grade"],
            ] as const
          ).map(([id, Icon, titulo]) => (
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
          <button onClick={() => e.setZoom(100)} className="w-11 text-[11px] font-medium tabular-nums hover:bg-secondary">
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

        <div className="flex-1" />

        <button
          onClick={() => {
            e.setModoComentario(!e.modoComentario);
            e.setPainelDireito("comentarios");
          }}
          className={cn(
            "flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-[11px] font-medium",
            e.modoComentario ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:bg-secondary",
          )}
        >
          <MessageSquarePlus className="size-3.5" /> Comentar
        </button>
        <button
          onClick={() => e.setApresentando(true)}
          className="flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2 text-[11px] font-medium hover:bg-secondary"
        >
          <Maximize2 className="size-3.5" /> Apresentar
        </button>
        <button
          onClick={() => {
            const proximo = !e.modoEdicao;
            e.setModoEdicao(proximo);
            e.setSelecionado(proximo ? "Herói › Título" : null);
            e.setPainelEdicao(proximo ? "texto" : null);
          }}
          className={cn(
            "flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[11px] font-semibold",
            e.modoEdicao ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          <Pencil className="size-3.5" /> {e.modoEdicao ? "Sair da edição" : "Editar"}
        </button>
      </div>
    </section>
  );
}

function Artboard({ nome }: { nome: string }) {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{nome}</span>
        <div className="flex gap-3 text-[11px] text-muted-foreground">
          <span>Produto</span>
          <span>Preços</span>
          <span>Sobre</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h2 data-el className="max-w-[70%] text-3xl font-semibold leading-tight tracking-tight">
          Desenhe, converse e publique no mesmo lugar
        </h2>
        <p className="max-w-[60%] text-[13px] leading-relaxed text-muted-foreground">
          O Estúdio conecta o pedido em texto ao arquivo final: cada versão nasce da conversa e pode ser editada
          diretamente no palco.
        </p>
        <div className="flex gap-2">
          <span className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground">
            Começar
          </span>
          <span className="rounded-md border border-border px-3 py-1.5 text-[12px] font-medium">Ver exemplo</span>
        </div>
      </div>
      <div className="h-40 rounded-lg bg-canvas" />
      <div className="flex items-center gap-6 border-t border-border pt-4">
        {["Marés", "Fluxo", "Norte", "Cardume"].map((l) => (
          <span key={l} className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function SelecaoOverlay() {
  const e = useEstudio();
  const ancestrais = (e.selecionado ?? "").split(" › ");

  return (
    <>
      <div className="pointer-events-none absolute left-8 top-[104px] w-[70%] rounded-sm outline outline-2 outline-accent">
        <span className="absolute -top-5 left-0 rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
          h2.título · 462×72
        </span>
        {[
          "-left-1 -top-1",
          "-right-1 -top-1",
          "-bottom-1 -left-1",
          "-bottom-1 -right-1",
        ].map((pos) => (
          <span key={pos} className={cn("absolute size-2 rounded-[2px] border border-accent bg-card", pos)} />
        ))}
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded bg-primary px-1 text-[9px] text-primary-foreground">
          24 px
        </span>
      </div>

      {/* trilha de ancestrais */}
      <div className="absolute left-3 top-3 flex items-center gap-0.5 rounded-md border border-border bg-popover px-1.5 py-1 text-[10px] shadow-[var(--shadow-panel)]">
        {ancestrais.map((a, i) => (
          <span key={a} className="flex items-center gap-0.5">
            {i > 0 && <ChevronRight className="size-2.5 text-muted-foreground" />}
            <button
              onClick={() => e.setSelecionado(ancestrais.slice(0, i + 1).join(" › "))}
              className={cn(
                "rounded px-1 py-0.5 hover:bg-secondary",
                i === ancestrais.length - 1 && "font-semibold text-accent",
              )}
            >
              {a}
            </button>
          </span>
        ))}
      </div>

      {/* barra flutuante */}
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
            onClick={() => e.setPainelEdicao(e.painelEdicao === id ? null : id)}
            className={cn(
              "flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px]",
              e.painelEdicao === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
            )}
          >
            <Icon className="size-3.5" /> {titulo}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        <button title="Duplicar" className="grid size-6 place-items-center rounded-md hover:bg-secondary">
          <Copy className="size-3.5" />
        </button>
        <button title="Excluir" className="grid size-6 place-items-center rounded-md hover:bg-secondary">
          <Trash2 className="size-3.5" />
        </button>
        <span className="mx-1 h-4 w-px bg-border" />
        <button className="flex h-6 items-center gap-1 whitespace-nowrap rounded-md bg-accent px-2 text-[11px] font-medium text-accent-foreground">
          <Sparkles className="size-3" /> Pedir ao assistente
        </button>
      </div>
    </>
  );
}

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Settings2, Layers, History, MessageSquare, Code2, X, Check } from "lucide-react";
import { useEstudio, slugPainel, type PainelDireito } from "./EstudioContext";
import { historico, mapaCodigo, versoes } from "@/lib/estudio-mock";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const guias: { id: Exclude<PainelDireito, null>; icone: typeof Settings2; titulo: string }[] = [
  { id: "props", icone: Settings2, titulo: "Ajustes" },
  { id: "camadas", icone: Layers, titulo: "Camadas" },
  { id: "versoes", icone: History, titulo: "Versões" },
  { id: "comentarios", icone: MessageSquare, titulo: "Comentários" },
  { id: "codigo", icone: Code2, titulo: "Código" },
];

/* trilho de ícones — sempre visível; cada painel é uma rota */
export function PanelRail() {
  const e = useEstudio();

  return (
    <nav
      aria-label="Painéis"
      className="flex w-10 shrink-0 flex-col items-center gap-1 border-l border-border bg-sidebar py-2"
    >
      {guias.map((g) => {
        const ativo = e.painelDireito === g.id;
        return ativo ? (
          <Link
            key={g.id}
            title={g.titulo}
            to="/d/$designId"
            params={{ designId: e.abaAtiva }}
            className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"
          >
            <g.icone className="size-3.5" />
          </Link>
        ) : (
          <Link
            key={g.id}
            title={g.titulo}
            to="/d/$designId/$painel"
            params={{ designId: e.abaAtiva, painel: slugPainel[g.id] }}
            className="grid size-7 place-items-center rounded-md hover:bg-secondary"
          >
            <g.icone className="size-3.5" />
          </Link>
        );
      })}
    </nav>
  );
}

export function PanelSurface({ titulo, children }: { titulo: string; children: ReactNode }) {
  const e = useEstudio();

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-l border-border bg-sidebar">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
        <Link
          to="/d/$designId"
          params={{ designId: e.abaAtiva }}
          title="Fechar painel"
          className="grid size-6 place-items-center rounded hover:bg-secondary"
        >
          <X className="size-3.5" />
        </Link>
      </div>
      <ScrollArea className="flex-1">{children}</ScrollArea>
    </aside>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-3 py-2.5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/* 1k — versões e histórico */
export function VersoesPanel() {
  return (
    <>
      <Bloco titulo="Versões deste design">
        <div className="grid grid-cols-2 gap-2">
          {versoes.map((v, i) => (
            <div
              key={v.id}
              className={cn("overflow-hidden rounded-md border bg-card", i === 0 ? "border-accent" : "border-border")}
            >
              <div className="h-14 bg-canvas" />
              <div className="p-1.5">
                <p className="text-[11px] font-medium">{v.rotulo}</p>
                <p className="text-[10px] text-muted-foreground">
                  {v.autor} · {v.quando}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <button className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            Comparar
          </button>
          <button className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            Duplicar
          </button>
          <button className="h-6 flex-1 rounded bg-primary text-[11px] text-primary-foreground">Restaurar</button>
        </div>
      </Bloco>
      <Bloco titulo="Histórico de alterações">
        <ul className="space-y-2">
          {historico.map((h, i) => (
            <li key={i} className="border-l-2 border-border pl-2">
              <p className="text-[11px]">{h.o}</p>
              <p className="text-[10px] text-muted-foreground">
                {h.quem} · {h.quando}
              </p>
            </li>
          ))}
        </ul>
      </Bloco>
    </>
  );
}

/* 1l — comentários */
export function ComentariosPanel() {
  const e = useEstudio();
  const lista = e.comentarios.filter((c) => (e.filtroComentarios === "abertos" ? !c.resolvido : c.resolvido));

  return (
    <>
      <Bloco titulo="Revisão">
        <button
          onClick={() => e.setModoComentario(!e.modoComentario)}
          className={cn(
            "h-7 w-full rounded border text-[11px] font-medium",
            e.modoComentario ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card",
          )}
        >
          {e.modoComentario ? "Modo comentar ativo — clique no palco" : "Novo comentário"}
        </button>
        <div className="flex gap-1">
          {(["abertos", "resolvidos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => e.setFiltroComentarios(f)}
              className={cn(
                "flex-1 rounded border px-2 py-1 text-[11px] capitalize",
                e.filtroComentarios === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </Bloco>
      <Bloco titulo="Threads">
        {lista.length === 0 && <p className="text-[11px] text-muted-foreground">Nada por aqui.</p>}
        {lista.map((c) => (
          <button
            key={c.id}
            onClick={() => e.setComentarioAtivo(c.id)}
            className={cn(
              "w-full rounded-md border bg-card p-2 text-left",
              e.comentarioAtivo === c.id ? "border-accent" : "border-border",
            )}
          >
            <p className="text-[11px] font-semibold">{c.autor}</p>
            <p className="line-clamp-2 text-[11px] text-muted-foreground">{c.texto}</p>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{c.respostas.length} respostas</span>
              <span
                onClick={(ev) => {
                  ev.stopPropagation();
                  e.resolverComentario(c.id);
                }}
                className="flex items-center gap-0.5 hover:text-foreground"
              >
                {c.resolvido ? <X className="size-2.5" /> : <Check className="size-2.5" />}
                {c.resolvido ? "Reabrir" : "Resolver"}
              </span>
            </div>
          </button>
        ))}
      </Bloco>
    </>
  );
}

/* 1o — código e sincronização */
export function CodigoPanel() {
  return (
    <>
      <Bloco titulo="Repositório conectado">
        <div className="rounded-md border border-border bg-card p-2">
          <p className="text-[11px] font-medium">estudio/aurora-web</p>
          <p className="text-[10px] text-muted-foreground">branch main · sincronizado há 6 min</p>
        </div>
        <div className="flex gap-1">
          <button className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            Trocar
          </button>
          <button className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            Branch
          </button>
          <button className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            Desconectar
          </button>
        </div>
      </Bloco>
      <Bloco titulo="Pasta local">
        <div className="rounded-md border border-dashed border-border p-2 text-[11px] text-muted-foreground">
          ~/projetos/aurora · anexada
        </div>
        <button className="h-6 w-full rounded border border-border bg-card text-[11px] hover:bg-secondary">
          Importar arquivo de design
        </button>
      </Bloco>
      <Bloco titulo="Mapa telas ↔ código">
        <ul className="space-y-1.5">
          {mapaCodigo.map((m) => (
            <li key={m.tela} className="rounded-md border border-border bg-card p-2">
              <p className="text-[11px] font-medium">{m.tela}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{m.arquivo}</p>
              <span className="mt-1 inline-block rounded-full bg-secondary px-1.5 py-0.5 text-[9px] text-secondary-foreground">
                {m.estado}
              </span>
            </li>
          ))}
        </ul>
      </Bloco>
      <Bloco titulo="Sincronizar">
        <button className="h-7 w-full rounded bg-primary text-[11px] font-medium text-primary-foreground">
          Sincronizar agora
        </button>
        <div className="flex gap-1">
          <button className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            Ver diferenças
          </button>
          <button className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            Handoff dev
          </button>
        </div>
      </Bloco>
    </>
  );
}

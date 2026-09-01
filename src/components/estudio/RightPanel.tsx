import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Settings2, Layers, History, MessageSquare, Code2, X, Check, Trash2 } from "lucide-react";

import { useEstudio, slugPainel, type PainelDireito } from "./EstudioContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Artboard } from "./Stage";
import { arquivosDoRepo, diffDocs, docParaHtml, baixarArquivo } from "@/lib/estudio-doc";
import { toast } from "sonner";

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

/* versões e histórico — estados reais do documento */
export function VersoesPanel() {
  const e = useEstudio();
  const a = e.versoes.find((v) => v.id === e.versaoA) ?? null;
  const b = e.versoes.find((v) => v.id === e.versaoB) ?? null;
  const diffs = a && b ? diffDocs(b.doc, a.doc) : [];

  return (
    <>
      <Bloco titulo="Versões deste design">
        <button
          onClick={() => {
            const v = e.criarVersao("");
            toast.success(`Versão ${v} criada a partir do palco.`);
          }}
          className="h-7 w-full rounded bg-primary text-[11px] font-medium text-primary-foreground"
        >
          Salvar estado atual como versão
        </button>
        {e.versoes.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            Nenhuma versão ainda. Peça algo na conversa ou salve o estado atual.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {e.versoes.map((v) => (
            <div
              key={v.id}
              className={cn(
                "overflow-hidden rounded-md border bg-card",
                e.versaoA === v.id ? "border-accent" : e.versaoB === v.id ? "border-primary" : "border-border",
              )}
            >
              <button
                onClick={() => (e.versaoA === v.id ? e.setVersaoB(v.id) : e.setVersaoA(v.id))}
                className="block h-16 w-full overflow-hidden bg-canvas"
                title="Selecionar para comparar"
              >
                <div className="pointer-events-none origin-top-left scale-[0.16]" style={{ width: 880 }}>
                  <Artboard doc={v.doc} />
                </div>
              </button>
              <div className="p-1.5">
                <p className="text-[11px] font-medium">{v.rotulo}</p>
                <p className="text-[10px] text-muted-foreground">
                  {v.autor} · {v.quando}
                </p>
                <div className="mt-1 flex gap-1">
                  <button
                    onClick={() => {
                      e.restaurarVersao(v.id);
                      toast.success(`${v.rotulo} restaurada no palco.`);
                    }}
                    className="flex-1 rounded bg-primary py-0.5 text-[10px] text-primary-foreground"
                  >
                    Restaurar
                  </button>
                  <button
                    onClick={() => e.duplicarVersao(v.id)}
                    className="flex-1 rounded border border-border py-0.5 text-[10px] hover:bg-secondary"
                  >
                    Duplicar
                  </button>
                  <button
                    onClick={() => e.excluirVersao(v.id)}
                    className="rounded border border-border px-1 py-0.5 text-[10px] text-destructive hover:bg-secondary"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Comparar">
        <p className="text-[10px] text-muted-foreground">
          A: {a?.rotulo ?? "—"} · B: {b?.rotulo ?? "—"} (clique num cartão para escolher A, clique de novo para B)
        </p>
        {a && b ? (
          diffs.length ? (
            <ul className="space-y-1">
              {diffs.slice(0, 20).map((d, i) => (
                <li key={i} className="rounded border border-border bg-card p-1.5 text-[10px]">
                  <p className="font-medium">{d.campo}</p>
                  <p className="text-muted-foreground line-through">{d.antes}</p>
                  <p className="text-accent">{d.depois}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-muted-foreground">As duas versões são idênticas.</p>
          )
        ) : (
          <p className="text-[11px] text-muted-foreground">Escolha duas versões para ver as diferenças.</p>
        )}
      </Bloco>

      <Bloco titulo="Histórico de alterações">
        {e.historico.length === 0 && <p className="text-[11px] text-muted-foreground">Sem alterações registradas.</p>}
        <ul className="space-y-2">
          {e.historico.map((h) => (
            <li key={h.id} className="border-l-2 border-border pl-2">
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

/* comentários */
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
                e.filtroComentarios === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card",
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
              <span
                onClick={(ev) => {
                  ev.stopPropagation();
                  e.apagarComentario(c.id);
                }}
                className="flex items-center gap-0.5 text-destructive hover:opacity-80"
              >
                <Trash2 className="size-2.5" /> Apagar
              </span>
            </div>
          </button>
        ))}
      </Bloco>
    </>
  );
}

/* código — arquivos reais deste repositório */
export function CodigoPanel() {
  const e = useEstudio();

  return (
    <>
      <Bloco titulo="Repositório deste protótipo">
        <div className="rounded-md border border-border bg-card p-2">
          <p className="text-[11px] font-medium">estudio — TanStack Start</p>
          <p className="text-[10px] text-muted-foreground">
            {arquivosDoRepo.length} arquivos ligados ao palco · rota atual /d/{e.abaAtiva}
          </p>
        </div>
      </Bloco>
      <Bloco titulo="Arquivos que desenham este palco">
        <ul className="space-y-1.5">
          {arquivosDoRepo.map((m) => (
            <li key={m.arquivo} className="rounded-md border border-border bg-card p-2">
              <p className="font-mono text-[10px]">{m.arquivo}</p>
              <p className="text-[10px] text-muted-foreground">{m.papel}</p>
            </li>
          ))}
        </ul>
      </Bloco>
      <Bloco titulo="Handoff">
        <button
          onClick={() => {
            baixarArquivo(`${e.nomeAtivo}.html`, docParaHtml(e.doc, e.nomeAtivo, 880));
            toast.success("HTML do artboard baixado.");
          }}
          className="h-7 w-full rounded bg-primary text-[11px] font-medium text-primary-foreground"
        >
          Baixar HTML do artboard
        </button>
        <button
          onClick={() => {
            void navigator.clipboard.writeText(docParaHtml(e.doc, e.nomeAtivo, 880));
            toast.success("Marcação copiada.");
          }}
          className="h-6 w-full rounded border border-border bg-card text-[11px] hover:bg-secondary"
        >
          Copiar marcação
        </button>
        <button
          onClick={() => {
            void navigator.clipboard.writeText(JSON.stringify(e.doc, null, 2));
            toast.success("JSON do documento copiado.");
          }}
          className="h-6 w-full rounded border border-border bg-card text-[11px] hover:bg-secondary"
        >
          Copiar JSON do documento
        </button>
      </Bloco>
    </>
  );
}

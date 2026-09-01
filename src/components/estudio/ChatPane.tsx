import { useState } from "react";
import {
  Paperclip,
  Sparkles,
  Send,
  Square,
  X,
  FileText,
  Copy,
  RefreshCw,
  MessageSquare,
  GitBranch,
  Download,
  Check,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEstudio } from "./EstudioContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { baixarArquivo, comEstilo, docParaHtml } from "@/lib/estudio-doc";
import { toast } from "sonner";

export function ChatPane() {
  const e = useEstudio();
  const [texto, setTexto] = useState("");
  const [modelo, setModelo] = useState("Equilibrado");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");

  const enviar = () => {
    if (!texto.trim() || e.enviando) return;
    e.enviarPedido(texto.trim());
    setTexto("");
  };

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-l border-border bg-sidebar">
      <div className="flex h-9 shrink-0 items-center border-b border-border px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Conversa
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          {e.conversa.map((m) =>
            m.autor === "voce" ? (
              <div key={m.id} className="group ml-6 rounded-lg rounded-br-sm border border-border bg-card p-2.5">
                {editandoId === m.id ? (
                  <form
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      e.editarMensagem(m.id, rascunho.trim() || m.texto);
                      setEditandoId(null);
                    }}
                  >
                    <textarea
                      autoFocus
                      value={rascunho}
                      onChange={(ev) => setRascunho(ev.target.value)}
                      className="h-14 w-full resize-none rounded border border-border bg-background p-1.5 text-[12px] outline-none"
                    />
                    <div className="mt-1 flex gap-1">
                      <button className="rounded bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                        Salvar e reenviar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditandoId(null)}
                        className="rounded border border-border px-2 py-0.5 text-[10px]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-[12px] leading-relaxed">{m.texto}</p>
                    <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditandoId(m.id);
                          setRascunho(m.texto);
                        }}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <Pencil className="size-2.5" /> Editar
                      </button>
                      <button
                        onClick={() => e.reenviarMensagem(m.id)}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <RefreshCw className="size-2.5" /> Reenviar
                      </button>
                      <button
                        onClick={() => e.apagarMensagem(m.id)}
                        className="flex items-center gap-1 text-destructive hover:opacity-80"
                      >
                        <Trash2 className="size-2.5" /> Apagar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div key={m.id} className="space-y-2">
                <p className="text-[12px] leading-relaxed">{m.texto}</p>

                {m.tarefas && (
                  <ul className="space-y-1 rounded-lg border border-border bg-card p-2.5">
                    {m.tarefas.map((t) => (
                      <li key={t.id} className="flex items-center gap-1.5 text-[11px]">
                        {t.estado === "feito" ? (
                          <Check className="size-3 text-accent" />
                        ) : t.estado === "ativo" ? (
                          <Loader2 className="size-3 animate-spin text-accent" />
                        ) : (
                          <span className="size-3 rounded-full border border-border" />
                        )}
                        <span className={cn(t.estado === "pendente" && "text-muted-foreground")}>{t.texto}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {m.pergunta && (
                  <div className="space-y-2 rounded-lg border border-accent/40 bg-card p-2.5">
                    <p className="text-[11px] font-semibold">{m.pergunta.titulo}</p>
                    <div className="flex flex-wrap gap-1">
                      {m.pergunta.opcoes.map((o) => (
                        <button
                          key={o}
                          onClick={() => e.enviarPedido(o)}
                          className="rounded-full border border-border px-2.5 py-1 text-[11px] hover:border-accent hover:text-accent"
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] text-muted-foreground">
                        {m.pergunta.sliderLabel} · {e.doc.densidade}%
                      </p>
                      <Slider
                        value={[e.doc.densidade]}
                        max={100}
                        step={1}
                        onValueChange={(v) => e.atualizarDoc((d) => ({ ...d, densidade: v[0]! }), "")}
                      />
                    </div>
                    <button
                      onClick={() => e.adicionarContexto("Referência", "imagem")}
                      className="flex h-6 w-full items-center justify-center gap-1 rounded border border-dashed border-border text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <Paperclip className="size-3" /> Enviar referência
                    </button>
                  </div>
                )}

                {m.arquivo && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5">
                    <span className="grid size-8 place-items-center rounded bg-canvas">
                      <FileText className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium">{m.arquivo.nome}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.arquivo.tipo} · {m.arquivo.versao}
                      </p>
                    </div>
                    <button
                      onClick={() => e.setPainelDireito("versoes")}
                      className="h-6 rounded bg-primary px-2 text-[11px] text-primary-foreground"
                    >
                      Abrir
                    </button>
                    <button
                      title="Baixar HTML"
                      onClick={() => {
                        baixarArquivo(`${e.nomeAtivo}.html`, docParaHtml(e.doc, e.nomeAtivo, 880));
                        toast.success("HTML baixado.");
                      }}
                      className="grid size-6 place-items-center rounded border border-border hover:bg-secondary"
                    >
                      <Download className="size-3" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2.5 text-[10px] text-muted-foreground">
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(m.texto);
                      toast.success("Resposta copiada.");
                    }}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Copy className="size-2.5" /> Copiar
                  </button>
                  <button
                    onClick={() => {
                      const anterior = [...e.conversa].reverse().find((x) => x.autor === "voce");
                      if (anterior) e.reenviarMensagem(anterior.id);
                    }}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <RefreshCw className="size-2.5" /> Refazer
                  </button>
                  <button
                    onClick={() => e.setPainelDireito("comentarios")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <MessageSquare className="size-2.5" /> Comentar
                  </button>
                  <button
                    onClick={() => e.ramificar(m.id)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <GitBranch className="size-2.5" /> Ramificar
                  </button>
                  <button
                    onClick={() => e.apagarMensagem(m.id)}
                    className="flex items-center gap-1 text-destructive hover:opacity-80"
                  >
                    <Trash2 className="size-2.5" /> Apagar
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </ScrollArea>

      {/* compositor */}
      <div className="shrink-0 border-t border-border p-2.5">
        {e.contexto.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {e.contexto.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card py-0.5 pl-2 pr-1 text-[10px]"
              >
                <span className="text-muted-foreground">{c.tipo}</span>
                <span className="font-medium">{c.rotulo}</span>
                <button onClick={() => e.removerContexto(c.id)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-2 focus-within:ring-1 focus-within:ring-ring">
          <textarea
            value={texto}
            onChange={(ev) => setTexto(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" && !ev.shiftKey) {
                ev.preventDefault();
                enviar();
              }
            }}
            placeholder="Peça algo: “título maior e centralizado”, “cor azul no botão”, “tirar prova social”…"
            className="h-16 w-full resize-none bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="grid size-6 place-items-center rounded border border-border hover:bg-secondary">
                <Paperclip className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-[11px]">Anexar contexto</DropdownMenuLabel>
                {["arquivo", "imagem", "design system", "repositório", "pasta local"].map((t) => (
                  <DropdownMenuItem
                    key={t}
                    onSelect={() => e.adicionarContexto(t === "arquivo" ? e.nomeAtivo : "Novo item", t)}
                  >
                    {t}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="grid size-6 place-items-center rounded border border-border hover:bg-secondary">
                <Sparkles className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-[11px]">Skill</DropdownMenuLabel>
                {[
                  ["Herói editorial", "Deixar o herói calmo e editorial com mais respiro"],
                  ["Foco no produto", "Variante produto com mídia em destaque"],
                  ["Impacto", "Variante ousado, título maior e centralizado"],
                  ["Sem prova social", "Tirar prova social do arquivo"],
                ].map(([rotulo, pedido]) => (
                  <DropdownMenuItem key={rotulo} onSelect={() => e.enviarPedido(pedido!)}>
                    {rotulo}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="h-6 rounded border border-border px-2 text-[11px] hover:bg-secondary">
                {modelo}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-[11px]">Modelo e esforço</DropdownMenuLabel>
                {["Rápido", "Equilibrado", "Profundo"].map((t) => (
                  <DropdownMenuItem
                    key={t}
                    onSelect={() => {
                      setModelo(t);
                      if (t === "Profundo")
                        e.atualizarDoc((d) => comEstilo(d, "titulo", { entrelinha: 1.1 }), "Refinou o ritmo do título");
                    }}
                  >
                    {t}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            {e.enviando ? (
              <button
                onClick={e.pararGeracao}
                className="flex h-6 items-center gap-1 rounded bg-secondary px-2 text-[11px] font-medium"
              >
                <Square className="size-3" /> Parar
              </button>
            ) : (
              <button
                onClick={enviar}
                className="flex h-6 items-center gap-1 rounded bg-primary px-2.5 text-[11px] font-medium text-primary-foreground disabled:opacity-40"
                disabled={!texto.trim()}
              >
                <Send className="size-3" /> Enviar
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

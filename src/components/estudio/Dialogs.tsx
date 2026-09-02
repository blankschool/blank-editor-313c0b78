import { useState } from "react";
import { FileImage, FileText, Presentation, Globe, Package, Send, Link2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { sistemas } from "@/lib/estudio-mock";
import { useEstudio } from "./EstudioContext";
import { cn } from "@/lib/utils";
import { baixarArquivo, comEstilo, docParaHtml, docParaPng, paletaPorSistema } from "@/lib/estudio-doc";
import { indiceDaPagina, paginaCanvasParaPng } from "@/lib/canvas-png";
import { toast } from "sonner";

const formatos = [
  { id: "png", rotulo: "Imagem PNG", icone: FileImage },
  { id: "html", rotulo: "HTML offline", icone: Globe },
  { id: "json", rotulo: "JSON do design", icone: FileText },
  { id: "slides", rotulo: "HTML por versão", icone: Presentation },
  { id: "zip", rotulo: "Todas as telas (HTML)", icone: Package },
  { id: "clip", rotulo: "Copiar marcação", icone: Send },
];

/* exportar — baixa arquivo de verdade */
export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const e = useEstudio();
  const [formato, setFormato] = useState("png");
  const [escopo, setEscopo] = useState<"atual" | "todas">("atual");
  const [escala, setEscala] = useState(2);
  const [largura, setLargura] = useState(880);
  const [ocupado, setOcupado] = useState(false);

  const exportar = async () => {
    setOcupado(true);
    try {
      if (formato === "png" && e.docCanvas) {
        /* doc canvas: o PNG sai do próprio canvas (rotação, recorte da foto e
           máscara inclusos), nunca do desenho do documento de fluxo */
        const doc = e.docCanvas;
        const indices =
          escopo === "todas"
            ? doc.paginas.map((_, i) => i)
            : [indiceDaPagina(doc, e.paginaCanvas)];
        let saiu = 0;
        for (const i of indices) {
          const blob = await paginaCanvasParaPng(doc, i, escala);
          if (!blob) continue;
          const sufixo = indices.length > 1 ? `-${String(i + 1).padStart(2, "0")}` : "";
          baixarArquivo(`${e.nomeAtivo}${sufixo}.png`, blob, "image/png");
          saiu += 1;
        }
        if (!saiu) throw new Error("canvas indisponível");
      } else if (formato === "png") {
        const blob = await docParaPng(e.doc, e.nomeAtivo, largura, escala);
        if (!blob) throw new Error("canvas indisponível");
        baixarArquivo(`${e.nomeAtivo}.png`, blob, "image/png");
      } else if (formato === "html") {
        baixarArquivo(`${e.nomeAtivo}.html`, docParaHtml(e.doc, e.nomeAtivo, largura));
      } else if (formato === "json") {
        baixarArquivo(`${e.nomeAtivo}.json`, JSON.stringify(e.doc, null, 2), "application/json");
      } else if (formato === "slides") {
        const corpo = e.versoes.length
          ? e.versoes.map((v) => docParaHtml(v.doc, `${e.nomeAtivo} — ${v.rotulo}`, largura)).join("\n<hr>\n")
          : docParaHtml(e.doc, e.nomeAtivo, largura);
        baixarArquivo(`${e.nomeAtivo}-versoes.html`, corpo);
      } else if (formato === "zip") {
        baixarArquivo(
          `${e.projeto}-telas.html`,
          e.abas.map((a) => docParaHtml(e.doc, a.nome, largura)).join("\n<hr>\n"),
        );
      } else {
        await navigator.clipboard.writeText(docParaHtml(e.doc, e.nomeAtivo, largura));
        toast.success("Marcação copiada para a área de transferência.");
        setOcupado(false);
        onOpenChange(false);
        return;
      }
      toast.success(`Exportado (${escopo === "atual" ? "tela atual" : "todas as telas"}).`);
      onOpenChange(false);
    } catch {
      toast.error("Não consegui gerar o arquivo neste navegador.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Exportar</DialogTitle>
          <DialogDescription className="text-[12px]">Escolha o formato, o escopo e o tamanho.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {formatos.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormato(f.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-md border p-3 text-[11px]",
                formato === f.id ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-secondary",
              )}
            >
              <f.icone className="size-4" />
              {f.rotulo}
            </button>
          ))}
        </div>

        <div className="space-y-3 rounded-md border border-border bg-card p-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">Escopo</span>
            <div className="flex gap-1">
              {(["atual", "todas"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setEscopo(s)}
                  className={cn(
                    "rounded border px-2 py-0.5 text-[11px]",
                    escopo === s ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {s === "atual" ? "Tela atual" : "Todas as telas"}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[12px]">
            <div className="mb-1 flex justify-between text-muted-foreground">
              <span>Escala</span>
              <span>{escala}×</span>
            </div>
            <Slider value={[escala]} min={1} max={4} step={1} onValueChange={(v) => setEscala(v[0]!)} />
          </div>
          <label className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">Largura do artboard</span>
            <select
              value={largura}
              onChange={(ev) => setLargura(Number(ev.target.value))}
              className="h-7 rounded border border-border bg-card px-2 text-[11px]"
            >
              <option value={340}>Mobile 340</option>
              <option value={620}>Tablet 620</option>
              <option value={880}>Desktop 880</option>
              <option value={1440}>Personalizado 1440</option>
            </select>
          </label>
        </div>

        <button
          onClick={() => void exportar()}
          disabled={ocupado}
          className="h-8 rounded-md bg-primary text-[12px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {ocupado ? "Gerando…" : "Exportar"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

/* compartilhar — link real e copiável */
export function ShareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const e = useEstudio();
  const [copiado, setCopiado] = useState(false);
  const [quemVe, setQuemVe] = useState("Qualquer pessoa com o link");
  const [expira, setExpira] = useState("7 dias");
  const [comentar, setComentar] = useState(true);

  const origem = typeof window === "undefined" ? "" : window.location.origin;
  const link = `${origem}/d/${e.abaAtiva}/apresentar`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Compartilhar</DialogTitle>
          <DialogDescription className="text-[12px]">Link público para revisão.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5">
          <div className="flex h-8 flex-1 items-center gap-1.5 overflow-hidden rounded-md border border-border bg-card px-2 text-[11px] text-muted-foreground">
            <Link2 className="size-3.5 shrink-0" /> <span className="truncate">{link}</span>
          </div>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(link);
              setCopiado(true);
              toast.success("Link copiado.");
              window.setTimeout(() => setCopiado(false), 1500);
            }}
            className="h-8 rounded-md bg-primary px-3 text-[11px] font-medium text-primary-foreground"
          >
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>

        <div className="space-y-3 rounded-md border border-border bg-card p-3 text-[12px]">
          <label className="flex items-center justify-between">
            <span className="text-muted-foreground">Quem vê</span>
            <select
              value={quemVe}
              onChange={(ev) => setQuemVe(ev.target.value)}
              className="h-7 rounded border border-border bg-card px-2 text-[11px]"
            >
              <option>Qualquer pessoa com o link</option>
              <option>Só convidados</option>
              <option>Só o time</option>
            </select>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-muted-foreground">Expira em</span>
            <select
              value={expira}
              onChange={(ev) => setExpira(ev.target.value)}
              className="h-7 rounded border border-border bg-card px-2 text-[11px]"
            >
              <option>7 dias</option>
              <option>24 horas</option>
              <option>Nunca</option>
            </select>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-muted-foreground">Permite comentar</span>
            <Switch checked={comentar} onCheckedChange={setComentar} />
          </label>
          <p className="text-[10px] text-muted-foreground">
            {quemVe} · expira em {expira} · comentários {comentar ? "liberados" : "bloqueados"}.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* design system e marca */
export function SystemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const e = useEstudio();
  const atual = sistemas.find((s) => s.id === e.sistemaAtivo) ?? sistemas[0]!;

  const aplicar = () => {
    const cores = paletaPorSistema[atual.id] ?? atual.cores;
    e.atualizarDoc(
      (d) =>
        comEstilo(comEstilo(comEstilo(d, "cta", { fundo: cores[0] }), "titulo", { cor: cores[2] }), "prova", {
          cor: cores[1],
        }),
      `Aplicou o sistema ${atual.nome}`,
    );
    toast.success(`${atual.nome} aplicado ao design aberto.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Design system e marca</DialogTitle>
          <DialogDescription className="text-[12px]">
            Escolha um sistema para anexar ao projeto e aplicar ao design aberto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[240px_1fr] gap-4">
          <div className="space-y-1.5">
            {sistemas.map((s) => (
              <button
                key={s.id}
                onClick={() => e.setSistemaAtivo(s.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md border p-2 text-left",
                  e.sistemaAtivo === s.id ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-secondary",
                )}
              >
                <span className="flex gap-0.5">
                  {s.cores.map((c) => (
                    <span key={c} className="size-4 rounded-[3px]" style={{ background: c }} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium">{s.nome}</span>
                  <span className="block text-[10px] text-muted-foreground">{s.origem}</span>
                </span>
                {e.sistemaAtivo === s.id && <Check className="size-3.5 text-accent" />}
              </button>
            ))}
          </div>

          <div className="space-y-3 rounded-md border border-border bg-card p-3">
            <p className="text-[12px] font-semibold">{atual.nome}</p>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Cores</p>
              <div className="flex gap-1.5">
                {atual.cores.map((c) => (
                  <span key={c} className="h-8 flex-1 rounded" style={{ background: c }} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Tipografia</p>
              <p className="text-xl font-semibold tracking-tight">Söhne Semibold 32</p>
              <p className="text-[12px] text-muted-foreground">Söhne Regular 14 · corpo do texto</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Componentes</p>
              <div className="flex flex-wrap gap-1.5">
                {["Botão", "Cartão", "Campo", "Tabela", "Aviso"].map((c) => (
                  <span key={c} className="rounded border border-border px-2 py-1 text-[11px]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={() => {
                  e.enviarPedido(`Aplicar a paleta do sistema ${atual.nome} com cor no CTA`);
                  onOpenChange(false);
                }}
                className="h-7 flex-1 rounded border border-border text-[11px] hover:bg-secondary"
              >
                Pedir ao assistente
              </button>
              <button onClick={aplicar} className="h-7 flex-1 rounded bg-primary text-[11px] text-primary-foreground">
                Aplicar ao design aberto
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

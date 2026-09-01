import { useState } from "react";
import { FileImage, FileText, Presentation, Globe, Package, Send, Link2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { sistemas } from "@/lib/estudio-mock";
import { useEstudio } from "./EstudioContext";
import { cn } from "@/lib/utils";

const formatos = [
  { id: "pdf", rotulo: "PDF", icone: FileText },
  { id: "img", rotulo: "Imagem", icone: FileImage },
  { id: "slides", rotulo: "Slides", icone: Presentation },
  { id: "html", rotulo: "HTML offline", icone: Globe },
  { id: "zip", rotulo: ".zip do projeto", icone: Package },
  { id: "ext", rotulo: "Ferramenta externa", icone: Send },
];

/* 1m — exportar */
export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [formato, setFormato] = useState("pdf");
  const [escopo, setEscopo] = useState("atual");

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
              {["atual", "todas"].map((s) => (
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
              <span>2×</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={25} />
          </div>
          <label className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">Tamanho de papel</span>
            <select className="h-7 rounded border border-border bg-card px-2 text-[11px]">
              <option>A4 retrato</option>
              <option>A4 paisagem</option>
              <option>Personalizado 1440×1024</option>
            </select>
          </label>
        </div>

        <button className="h-8 rounded-md bg-primary text-[12px] font-medium text-primary-foreground">Exportar</button>
      </DialogContent>
    </Dialog>
  );
}

/* 1m — compartilhar */
export function ShareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Compartilhar</DialogTitle>
          <DialogDescription className="text-[12px]">Link público para revisão.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5">
          <div className="flex h-8 flex-1 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-[11px] text-muted-foreground">
            <Link2 className="size-3.5" /> estudio.app/p/aurora-home
          </div>
          <button
            onClick={() => setCopiado(true)}
            className="h-8 rounded-md bg-primary px-3 text-[11px] font-medium text-primary-foreground"
          >
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>

        <div className="space-y-3 rounded-md border border-border bg-card p-3 text-[12px]">
          <label className="flex items-center justify-between">
            <span className="text-muted-foreground">Quem vê</span>
            <select className="h-7 rounded border border-border bg-card px-2 text-[11px]">
              <option>Qualquer pessoa com o link</option>
              <option>Só convidados</option>
              <option>Só o time</option>
            </select>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-muted-foreground">Expira em</span>
            <select className="h-7 rounded border border-border bg-card px-2 text-[11px]">
              <option>7 dias</option>
              <option>24 horas</option>
              <option>Nunca</option>
            </select>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-muted-foreground">Permite comentar</span>
            <Switch defaultChecked />
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* 1n — design system e marca */
export function SystemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const e = useEstudio();
  const atual = sistemas.find((s) => s.id === e.sistemaAtivo) ?? sistemas[0]!;

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
              <button className="h-7 flex-1 rounded border border-border text-[11px] hover:bg-secondary">
                Trocar sistema
              </button>
              <button className="h-7 flex-1 rounded bg-primary text-[11px] text-primary-foreground">
                Aplicar ao design aberto
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

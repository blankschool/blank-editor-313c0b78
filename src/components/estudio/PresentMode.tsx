import { X } from "lucide-react";
import { useEstudio } from "./EstudioContext";

export function PresentMode() {
  const e = useEstudio();
  if (!e.apresentando) return null;
  const aba = e.abas.find((a) => a.id === e.abaAtiva);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-primary/95 p-10">
      <button
        onClick={() => e.setApresentando(false)}
        className="absolute right-5 top-5 flex items-center gap-1.5 rounded-md border border-primary-foreground/25 px-2.5 py-1 text-[12px] text-primary-foreground"
      >
        <X className="size-3.5" /> Sair
      </button>
      <div className="w-full max-w-4xl rounded-lg bg-card p-10 shadow-[var(--shadow-panel)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{aba?.nome}</p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight">
          Desenhe, converse e publique no mesmo lugar
        </h2>
        <p className="mt-3 max-w-xl text-[14px] text-muted-foreground">
          Modo apresentação: o palco ocupa a tela inteira, sem painéis nem barras.
        </p>
        <div className="mt-8 h-56 rounded-lg bg-canvas" />
      </div>
    </div>
  );
}

import { X } from "lucide-react";
import { useEstudio } from "./EstudioContext";
import { Artboard } from "./Stage";

export function PresentMode() {
  const e = useEstudio();
  if (!e.apresentando) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-primary/95 p-10">
      <button
        onClick={() => e.setApresentando(false)}
        className="absolute right-5 top-5 flex items-center gap-1.5 rounded-md border border-primary-foreground/25 px-2.5 py-1 text-[12px] text-primary-foreground"
      >
        <X className="size-3.5" /> Sair
      </button>
      <div
        className="w-full max-w-4xl overflow-hidden rounded-lg shadow-[var(--shadow-panel)]"
        style={{ background: e.doc.fundo }}
      >
        <Artboard doc={e.doc} />
      </div>
    </div>
  );
}

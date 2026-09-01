import { Copy, Plus, Search, Star, SlidersHorizontal, FileText, Layers } from "lucide-react";
import { useEstudio, type FiltroBiblioteca } from "./EstudioContext";
import { arvoreProjeto } from "@/lib/estudio-mock";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const filtros: { id: FiltroBiblioteca; rotulo: string }[] = [
  { id: "recentes", rotulo: "Recentes" },
  { id: "favoritos", rotulo: "Favoritos" },
  { id: "tipo", rotulo: "Por tipo" },
];

export function LibrarySidebar() {
  const { designs, busca, setBusca, filtro, setFiltro, abrirDesign, duplicarDesign, novoDesign, favoritar, abaAtiva } =
    useEstudio();

  const lista = designs
    .filter((d) => d.nome.toLowerCase().includes(busca.toLowerCase()))
    .filter((d) => (filtro === "favoritos" ? d.favorito : true))
    .sort((a, b) => (filtro === "tipo" ? a.tipo.localeCompare(b.tipo) : 0));

  return (
    <aside className="flex w-[262px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-1.5 p-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar designs"
            className="h-7 w-full rounded-md border border-border bg-card pl-7 pr-2 text-[12px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
        </div>
        <button className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-card hover:bg-secondary">
          <SlidersHorizontal className="size-3.5" />
        </button>
      </div>

      <div className="flex gap-1 px-2.5 pb-2">
        {filtros.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
              filtro === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 gap-2 px-2.5 pb-3">
          {lista.map((d) => (
            <div
              key={d.id}
              className={cn(
                "group overflow-hidden rounded-md border bg-card text-left transition-shadow hover:shadow-[var(--shadow-panel)]",
                abaAtiva === d.id ? "border-primary" : "border-border",
              )}
            >
              <button onClick={() => abrirDesign(d.id)} className="block w-full">
                <div className="h-16 w-full" style={{ background: d.tom }} />
              </button>
              <div className="flex items-start gap-1 p-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium leading-tight">{d.nome}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {d.tipo} · {d.atualizado}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => favoritar(d.id)}
                    title="Favoritar"
                    className="grid size-4 place-items-center rounded hover:bg-secondary"
                  >
                    <Star className={cn("size-3", d.favorito && "fill-accent text-accent")} />
                  </button>
                  <button
                    onClick={() => duplicarDesign(d.id)}
                    title="Duplicar"
                    className="grid size-4 place-items-center rounded hover:bg-secondary"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={novoDesign}
          className="mx-2.5 mb-4 flex h-8 w-[calc(100%-20px)] items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-[11px] font-semibold text-muted-foreground hover:border-accent hover:text-accent"
        >
          <Plus className="size-3.5" /> Novo design
        </button>

        <div className="border-t border-border px-2.5 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Layers className="size-3" /> Árvore do projeto
          </p>
          {arvoreProjeto.map((p) => (
            <div key={p.id} className="mb-2">
              <p className="text-[11px] font-medium">{p.nome}</p>
              <ul className="mt-0.5 space-y-0.5 border-l border-border pl-2">
                {p.filhos.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="size-3 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

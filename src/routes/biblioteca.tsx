import { Link, createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/estudio/TopBar";
import { LibrarySidebar } from "@/components/estudio/LibrarySidebar";
import { useEstudio } from "@/components/estudio/EstudioContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";

const titulo = "Biblioteca — Estúdio";
const descricao = "Todos os designs do projeto: telas, decks, documentos e protótipos, com busca e filtros.";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: titulo },
      { name: "description", content: descricao },
      { property: "og:title", content: titulo },
      { property: "og:description", content: descricao },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BibliotecaPage,
});

function BibliotecaPage() {
  const e = useEstudio();
  const lista = e.designs
    .filter((d) => d.nome.toLowerCase().includes(e.busca.toLowerCase()))
    .filter((d) => (e.filtro === "favoritos" ? d.favorito : true));

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">Biblioteca de designs</h1>
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LibrarySidebar />
        <ScrollArea className="flex-1 bg-canvas">
          <div className="p-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Biblioteca</h2>
                <p className="text-[12px] text-muted-foreground">
                  {lista.length} arquivos em {e.projeto}. Clique para abrir no palco.
                </p>
              </div>
              <button
                onClick={e.novoDesign}
                className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground"
              >
                <Plus className="size-3.5" /> Novo design
              </button>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {lista.map((d) => (
                <Link
                  key={d.id}
                  to="/d/$designId"
                  params={{ designId: d.id }}
                  className="overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-[var(--shadow-panel)]"
                >
                  <div className="h-32 w-full" style={{ background: d.tom }} />
                  <div className="p-2.5">
                    <p className="truncate text-[12px] font-medium">{d.nome}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {d.tipo} · {d.atualizado}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </main>
  );
}

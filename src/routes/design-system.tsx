import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TopBar } from "@/components/estudio/TopBar";
import { LibrarySidebar } from "@/components/estudio/LibrarySidebar";
import { SystemDialog } from "@/components/estudio/Dialogs";

const titulo = "Design system e marca — Estúdio";
const descricao = "Meus sistemas, biblioteca compartilhada, cores, tipografia e componentes do projeto.";

export const Route = createFileRoute("/design-system")({
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
  component: DesignSystemPage,
});

function DesignSystemPage() {
  const navigate = useNavigate();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">Design system e marca</h1>
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LibrarySidebar />
        <div className="flex-1 bg-canvas" />
      </div>
      <SystemDialog
        open
        onOpenChange={(v) => {
          if (!v) void navigate({ to: "/" });
        }}
      />
    </main>
  );
}

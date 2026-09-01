import { Outlet, createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/estudio/TopBar";
import { LibrarySidebar } from "@/components/estudio/LibrarySidebar";
import { Stage } from "@/components/estudio/Stage";
import { PanelRail } from "@/components/estudio/RightPanel";
import { ChatPane } from "@/components/estudio/ChatPane";

export const Route = createFileRoute("/d/$designId")({
  head: () => ({
    meta: [
      { title: "Palco — Estúdio" },
      { name: "description", content: "Arquivo em foco no palco do Estúdio, com abas, zoom, viewport e ferramentas." },
      { property: "og:title", content: "Palco — Estúdio" },
      { property: "og:description", content: "Arquivo em foco no palco do Estúdio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">Estúdio — workspace de design com assistente</h1>
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LibrarySidebar />
        <Stage />
        <Outlet />
        <PanelRail />
        <ChatPane />
      </div>
    </main>
  );
}

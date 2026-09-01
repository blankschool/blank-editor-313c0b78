import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { PanelLeftOpen, MessageSquare } from "lucide-react";
import { TopBar } from "@/components/estudio/TopBar";
import { LibrarySidebar } from "@/components/estudio/LibrarySidebar";
import { Stage } from "@/components/estudio/Stage";
import { PanelRail } from "@/components/estudio/RightPanel";
import { ChatPane } from "@/components/estudio/ChatPane";
import { useEstudio } from "@/components/estudio/EstudioContext";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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

const CHAVE_LARGURAS = "estudio:larguras:v1";

function WorkspaceLayout() {
  const e = useEstudio();
  const [layout, setLayout] = useState<Record<string, number> | undefined>(undefined);

  useEffect(() => {
    try {
      const bruto = localStorage.getItem(CHAVE_LARGURAS);
      if (bruto) setLayout(JSON.parse(bruto) as Record<string, number>);
    } catch {
      /* ignora */
    }
  }, []);

  const guardar = useCallback((novo: Record<string, number>) => {
    try {
      localStorage.setItem(CHAVE_LARGURAS, JSON.stringify(novo));
    } catch {
      /* ignora */
    }
  }, []);

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">Estúdio — workspace de design com assistente</h1>
      <TopBar />
      <div className="flex min-h-0 flex-1">
        {!e.bibliotecaAberta && (
          <div className="flex w-10 shrink-0 flex-col items-center gap-2 border-r border-border bg-sidebar py-2">
            <button
              onClick={() => e.setBibliotecaAberta(true)}
              title="Abrir biblioteca"
              className="grid size-7 place-items-center rounded-md hover:bg-secondary"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          </div>
        )}

        <ResizablePanelGroup
          orientation="horizontal"
          defaultLayout={layout}
          onLayoutChanged={guardar}
          className="min-w-0 flex-1"
        >
          {e.bibliotecaAberta && (
            <>
              <ResizablePanel id="biblioteca" defaultSize="18" minSize="12" maxSize="32" className="min-w-0">
                <LibrarySidebar />
              </ResizablePanel>
              <ResizableHandle
                withHandle
                onDoubleClick={() => e.setBibliotecaAberta(false)}
                title="Arraste para redimensionar · duplo clique recolhe"
                className="w-1.5 bg-transparent hover:bg-border"
              />
            </>
          )}

          <ResizablePanel id="palco" defaultSize="60" minSize="30" className="min-w-0">
            <div className="flex h-full min-w-0">
              <Stage />
              <Outlet />
            </div>
          </ResizablePanel>

          {e.conversaAberta && (
            <>
              <ResizableHandle
                withHandle
                onDoubleClick={() => e.setConversaAberta(false)}
                title="Arraste para redimensionar · duplo clique recolhe"
                className="w-1.5 bg-transparent hover:bg-border"
              />
              <ResizablePanel id="conversa" defaultSize="22" minSize="16" maxSize="40" className="min-w-0">
                <ChatPane />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        <PanelRail />
      </div>


      {!e.conversaAberta && (
        <button
          onClick={() => e.setConversaAberta(true)}
          title="Abrir conversa"
          className="fixed bottom-3 right-14 z-20 flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[12px] font-medium shadow-[var(--shadow-panel)] hover:bg-secondary"
        >
          <MessageSquare className="size-3.5" /> Conversa
        </button>
      )}
    </main>
  );
}

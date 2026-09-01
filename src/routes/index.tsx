import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { EstudioProvider } from "@/components/estudio/EstudioContext";
import { TopBar } from "@/components/estudio/TopBar";
import { LibrarySidebar } from "@/components/estudio/LibrarySidebar";
import { Stage } from "@/components/estudio/Stage";
import { RightPanel } from "@/components/estudio/RightPanel";
import { ChatPane } from "@/components/estudio/ChatPane";
import { ExportDialog, ShareDialog, SystemDialog } from "@/components/estudio/Dialogs";
import { PresentMode } from "@/components/estudio/PresentMode";

const titulo = "Estúdio — workspace de design com assistente";
const descricao =
  "Peça em texto, veja o arquivo nascer no palco e edite direto: biblioteca, versões, comentários, exportação e sincronização com o código em um só workspace.";

export const Route = createFileRoute("/")({
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
  component: EstudioPage,
});

function EstudioPage() {
  const [exportar, setExportar] = useState(false);
  const [compartilhar, setCompartilhar] = useState(false);
  const [sistema, setSistema] = useState(false);

  return (
    <EstudioProvider>
      <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <h1 className="sr-only">Estúdio — workspace de design com assistente</h1>
        <TopBar
          onExportar={() => setExportar(true)}
          onCompartilhar={() => setCompartilhar(true)}
          onSistema={() => setSistema(true)}
        />
        <div className="flex min-h-0 flex-1">
          <LibrarySidebar />
          <Stage />
          <RightPanel />
          <ChatPane />
        </div>
        <ExportDialog open={exportar} onOpenChange={setExportar} />
        <ShareDialog open={compartilhar} onOpenChange={setCompartilhar} />
        <SystemDialog open={sistema} onOpenChange={setSistema} />
        <PresentMode />
      </main>
    </EstudioProvider>
  );
}

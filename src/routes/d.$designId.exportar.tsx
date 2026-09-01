import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExportDialog } from "@/components/estudio/Dialogs";

export const Route = createFileRoute("/d/$designId/exportar")({
  head: () => ({
    meta: [
      { title: "Exportar — Estúdio" },
      { name: "description", content: "Escolha formato, escopo e tamanho para exportar o design aberto." },
      { property: "og:title", content: "Exportar — Estúdio" },
      { property: "og:description", content: "Exporte o design em PDF, imagem, slides, HTML ou .zip." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExportarRoute,
});

function ExportarRoute() {
  const { designId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <ExportDialog
      open
      onOpenChange={(v) => {
        if (!v) void navigate({ to: "/d/$designId", params: { designId } });
      }}
    />
  );
}

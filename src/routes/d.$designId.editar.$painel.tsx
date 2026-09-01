import { createFileRoute, notFound } from "@tanstack/react-router";
import { PanelSurface } from "@/components/estudio/RightPanel";
import { TextPanel, ColorPanel, LayoutPanel, LayersPanel } from "@/components/estudio/EditPanels";

const titulos: Record<string, string> = {
  texto: "Texto e tipografia",
  cor: "Cor e preenchimento",
  layout: "Layout e espaçamento",
  estrutura: "Estrutura e camadas",
};

export const Route = createFileRoute("/d/$designId/editar/$painel")({
  beforeLoad: ({ params }) => {
    if (!titulos[params.painel]) throw notFound();
  },
  head: ({ params }) => {
    const t = `Editar · ${titulos[params.painel] ?? "elemento"} — Estúdio`;
    const d = "Modo editar do palco: selecione um elemento e ajuste texto, cor, layout ou estrutura.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: EditarPainelRoute,
});

function EditarPainelRoute() {
  const { painel } = Route.useParams();

  return (
    <PanelSurface titulo={titulos[painel] ?? "Editar"}>
      {painel === "texto" && <TextPanel />}
      {painel === "cor" && <ColorPanel />}
      {painel === "layout" && <LayoutPanel />}
      {painel === "estrutura" && <LayersPanel />}
    </PanelSurface>
  );
}

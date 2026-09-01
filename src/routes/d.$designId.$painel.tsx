import { createFileRoute, notFound } from "@tanstack/react-router";
import { PanelSurface, VersoesPanel, ComentariosPanel, CodigoPanel } from "@/components/estudio/RightPanel";
import { LayersPanel, PropsPanel } from "@/components/estudio/EditPanels";

const titulos: Record<string, string> = {
  ajustes: "Ajustes",
  camadas: "Camadas",
  versoes: "Versões",
  comentarios: "Comentários",
  codigo: "Código",
};

export const Route = createFileRoute("/d/$designId/$painel")({
  beforeLoad: ({ params }) => {
    if (!titulos[params.painel]) throw notFound();
  },
  head: ({ params }) => {
    const t = `${titulos[params.painel] ?? "Painel"} — Estúdio`;
    const d = "Painel lateral do workspace, aberto sob demanda a partir do palco.";
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
  component: PainelRoute,
});

function PainelRoute() {
  const { painel } = Route.useParams();

  return (
    <PanelSurface titulo={titulos[painel] ?? "Painel"}>
      {painel === "ajustes" && <PropsPanel />}
      {painel === "camadas" && <LayersPanel />}
      {painel === "versoes" && <VersoesPanel />}
      {painel === "comentarios" && <ComentariosPanel />}
      {painel === "codigo" && <CodigoPanel />}
    </PanelSurface>
  );
}

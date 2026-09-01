import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { PanelSurface } from "@/components/estudio/RightPanel";
import { InspectorPanel } from "@/components/estudio/EditPanels";

const antigos: Record<string, "simples" | "pro"> = {
  texto: "simples",
  cor: "simples",
  layout: "simples",
  estrutura: "pro",
};

const titulos: Record<string, string> = {
  simples: "Editar · Simples",
  pro: "Editar · Pro",
};

export const Route = createFileRoute("/d/$designId/editar/$painel")({
  beforeLoad: ({ params }) => {
    const alvo = antigos[params.painel];
    if (alvo) {
      throw redirect({
        to: "/d/$designId/editar/$painel",
        params: { designId: params.designId, painel: alvo },
      });
    }
    if (!titulos[params.painel]) throw notFound();
  },
  head: ({ params }) => {
    const t = `${titulos[params.painel] ?? "Editar"} — Estúdio`;
    const d = "Inspector do Estúdio: aparência, texto, posição e camadas do elemento selecionado.";
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
    <PanelSurface titulo="Editar">
      <InspectorPanel aba={painel === "pro" ? "pro" : "simples"} />
    </PanelSurface>
  );
}

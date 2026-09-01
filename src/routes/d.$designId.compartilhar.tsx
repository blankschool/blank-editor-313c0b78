import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShareDialog } from "@/components/estudio/Dialogs";

export const Route = createFileRoute("/d/$designId/compartilhar")({
  head: () => ({
    meta: [
      { title: "Compartilhar — Estúdio" },
      { name: "description", content: "Gere um link público de revisão com permissões e prazo de expiração." },
      { property: "og:title", content: "Compartilhar — Estúdio" },
      { property: "og:description", content: "Link público de revisão com permissões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompartilharRoute,
});

function CompartilharRoute() {
  const { designId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <ShareDialog
      open
      onOpenChange={(v) => {
        if (!v) void navigate({ to: "/d/$designId", params: { designId } });
      }}
    />
  );
}

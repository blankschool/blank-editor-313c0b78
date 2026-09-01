import { createFileRoute } from "@tanstack/react-router";
import { PresentMode } from "@/components/estudio/PresentMode";

export const Route = createFileRoute("/d/$designId/apresentar")({
  head: () => ({
    meta: [
      { title: "Apresentar — Estúdio" },
      { name: "description", content: "Modo apresentação em tela cheia, sem painéis nem barras." },
      { property: "og:title", content: "Apresentar — Estúdio" },
      { property: "og:description", content: "Modo apresentação em tela cheia do arquivo em foco." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PresentMode,
});

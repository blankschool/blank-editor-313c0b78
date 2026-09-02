import { createFileRoute } from "@tanstack/react-router";
import { HomePanel } from "@/components/estudio/HomePanel";

const titulo = "Estúdio — material de campanha editável";
const descricao =
  "Abra um template, edite textos e fotos direto no palco e exporte em PNG. Seus designs ficam salvos na sua conta.";

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
  component: HomePanel,
});

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/d/$designId/editar/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/d/$designId/editar/$painel",
      params: { designId: params.designId, painel: "texto" },
    });
  },
});

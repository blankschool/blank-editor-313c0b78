/**
 * /t/<slug> — o canvas servido como HTML real.
 *
 * Existe porque o Supabase Storage se recusa a servir HTML como HTML: ele
 * grava o content-type certo e entrega `text/plain`, de propósito, para que
 * ninguém hospede página executável no domínio dele. Um link direto para o
 * bucket mostra o código-fonte, não a página.
 *
 * O HTML sai de `canvasParaHtml`, o mesmo gerador do preview e do export —
 * então o que se vê aqui é o que o palco desenha, por construção.
 *
 * O iframe é `srcDoc` e não `src`: o documento é autossuficiente e fica
 * isolado do CSS do app, que é o ponto de um preview fiel.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { canvasParaHtml } from "@/lib/canvas-html";
import { canvasAgrum, canvasBarretos } from "@/lib/estudio-canvas-seeds";
import type { DocCanvas } from "@/lib/estudio-doc";

/** Enquanto os templates moram no código. O passo seguinte é ler de
 *  `intel.art_templates`, e aí este mapa sai. */
const TEMPLATES: Record<string, DocCanvas> = {
  barretos: canvasBarretos,
  "agrum-eleicao": canvasAgrum,
};

/** id de design (uuid) tambem serve como slug: /t/<uuid> abre o design gravado */
const EH_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/t/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} — preview HTML` }],
  }),
  component: PreviewTemplate,
});

function PreviewTemplate() {
  const { slug } = Route.useParams();
  const [doBanco, setDoBanco] = useState<DocCanvas | null>(null);

  // Um uuid no lugar do slug carrega o design gravado. E o que permite conferir
  // um design importado com a mesma regua do template — mesmo gerador, mesmo
  // pixel-diff.
  useEffect(() => {
    if (!EH_UUID.test(slug)) return;
    let vivo = true;
    void supabase
      .from("designs")
      .select("nome, doc")
      .eq("id", slug)
      .maybeSingle()
      .then(({ data }) => {
        const d = data?.doc as DocCanvas | undefined;
        if (vivo && d?.kind === "canvas") setDoBanco({ ...d, nome: d.nome ?? data?.nome });
      });
    return () => {
      vivo = false;
    };
  }, [slug]);

  const doc = TEMPLATES[slug] ?? doBanco ?? undefined;

  const html = useMemo(
    () => (doc ? canvasParaHtml(doc, { titulo: doc.nome ?? slug }) : ""),
    [doc, slug],
  );

  if (!doc) {
    return (
      <div className="grid min-h-screen place-items-center gap-3 bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Template <code className="font-mono">{slug}</code> não encontrado.
        </p>
        <p className="text-xs text-muted-foreground">
          Disponíveis: {Object.keys(TEMPLATES).join(", ")}
        </p>
        <Link to="/biblioteca" className="text-xs underline">
          Voltar para a biblioteca
        </Link>
      </div>
    );
  }

  const paginas = doc.paginas.length;
  const p1 = doc.paginas[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-sm font-semibold">{doc.nome ?? slug}</h1>
          <span className="text-xs text-muted-foreground">
            {paginas} {paginas === 1 ? "página" : "páginas"}
            {p1 ? ` · ${p1.largura}×${p1.altura}` : ""}
          </span>
        </div>
        <a
          href={`data:text/html;charset=utf-8,${encodeURIComponent(html)}`}
          download={`${slug}.html`}
          className="text-xs underline"
        >
          Baixar HTML
        </a>
      </header>
      <iframe
        title={`Preview de ${slug}`}
        srcDoc={html}
        className="w-full flex-1 border-0 bg-[#0b0f0d]"
        sandbox="allow-same-origin"
      />
    </div>
  );
}

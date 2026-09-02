import assert from "node:assert/strict";
import test from "node:test";
import {
  coverImg,
  docCanvasBranco,
  fontesDisponiveisCanvas,
  normalizarEnquadramentoImg,
  type DocCanvas,
} from "../src/lib/estudio-doc.ts";

const perto = (recebido: number, esperado: number, tolerancia = 0.001) => {
  assert.ok(
    Math.abs(recebido - esperado) <= tolerancia,
    `esperava ${recebido} próximo de ${esperado}`,
  );
};

test("um design em branco começa com uma página realmente vazia", () => {
  const doc = docCanvasBranco();

  assert.equal(doc.kind, "canvas");
  assert.equal(doc.paginas.length, 1);
  assert.deepEqual(doc.paginas[0]?.camadas, []);
});

test("cover preserva a proporção natural em molduras horizontais e verticais", () => {
  for (const [w, h] of [
    [200, 80],
    [334, 334],
    [400, 500],
    [80, 200],
  ]) {
    const img = coverImg(w, h, 1080, 1350);

    perto(img.w / img.h, 1080 / 1350);
    assert.ok(img.w >= w);
    assert.ok(img.h >= h);
  }
});

test("normaliza enquadramento salvo com proporção diferente da imagem", () => {
  const img = normalizarEnquadramentoImg({ x: 0, y: 0, w: 200, h: 80 }, 1080, 1350, 200, 80, 0);

  perto(img.w / img.h, 1080 / 1350);
  assert.ok(img.w >= 200);
  assert.ok(img.h >= 80);
});

test("lista fontes selecionáveis do arquivo, das camadas e da seleção atual sem duplicar", () => {
  const doc: DocCanvas = {
    kind: "canvas",
    fontes: [
      { familia: "Anicon Sans", peso: 400, url: "/anicon.woff2" },
      { familia: "NYT Franklin", peso: 300, url: "/franklin-light.woff2" },
      { familia: "NYT Franklin", peso: 700, url: "/franklin-bold.woff2" },
    ],
    paginas: [
      {
        id: "p1",
        largura: 1080,
        altura: 1440,
        camadas: [{ tipo: "texto", id: "t1", x: 0, y: 0, texto: "Título", fonte: "Georgia" }],
      },
    ],
  };

  assert.deepEqual(fontesDisponiveisCanvas(doc, "Fonte da seleção"), [
    "Fonte da seleção",
    "Anicon Sans",
    "NYT Franklin",
    "Georgia",
  ]);
});

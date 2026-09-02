# Fotos certas no PNG, erradas no palco — corrigir

## O que está acontecendo

Confirmei no seu próprio navegador: existe uma regra global de CSS (`img { max-width: 100% }`, do reset do Tailwind) que **encolhe a largura da foto** dentro da moldura.

Testei com os números reais do círculo do Barretos: a foto deveria ser desenhada com 609×761 px dentro de uma moldura de 334×334, mas o navegador entrega **334×761** — largura cortada, altura mantida. Resultado: a foto fica estreita e deslocada para fora do círculo, e aparece o fundo do estádio por trás — exatamente o que os círculos vermelhos da sua captura mostram.

No círculo da direita o efeito é total: a foto deveria ter 937 px de largura e é clampada para 334, ficando inteira fora do recorte — por isso o círculo mostra só a plateia.

O PNG exportado sai certo porque o exportador desenha direto no canvas 2D, sem passar por CSS — daí a diferença entre o arquivo e o editor.

## Correção

1. Anular o clamp nas fotos das camadas de imagem do palco: `max-width: none` e `max-height: none` no estilo da `<img>` (foto principal, prévia "fantasma" do modo ajuste e qualquer miniatura que use o mesmo cálculo de enquadramento).
2. Aplicar a mesma proteção no gerador de HTML usado pela página real `/t/{id}` e pelo preview, para o documento público não sofrer do mesmo clamp caso o reset esteja presente ali.
3. Não mexer no modelo do documento, no exportador PNG, no inspector nem nas rotas — os números gravados já estão corretos.

## Verificação

Depois do ajuste, abro o Barretos no navegador e comparo: as duas fotos dos círculos devem aparecer com a largura gravada (609 e 937 px), preenchendo o recorte, e o palco deve bater com o PNG exportado.

## Detalhes técnicos

- `src/components/estudio/Stage.tsx`: `estiloImg` em `ImagemCanvasView` ganha `maxWidth: "none"` e `maxHeight: "none"`.
- `src/lib/canvas-html.ts`: mesmas duas propriedades no estilo inline da `<img>` da camada de imagem.

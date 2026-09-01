# Handles de verdade + ajuste da imagem dentro do placeholder

## 1. Ajustar a imagem dentro da moldura (sem achatar)

Hoje a camada imagem guarda `img {x,y,w,h}` mas nada permite mexer nisso, e o `<img>` é
esticado para o tamanho gravado — por isso algumas ficam achatadas.

- Ao enviar/trocar imagem, calcular `img` em **cover** com a proporção real do arquivo
  (nunca deformar): a imagem preenche a moldura e sobra é cortada.
- Redimensionar a moldura recalcula o cover, mantendo a proporção da foto.
- Modo "ajustar imagem": duplo clique numa camada imagem entra no modo crop
  (moldura clara, resto escurecido). Dentro dele:
  - arrastar move a foto dentro da moldura;
  - roda do mouse / slider de zoom escala a foto a partir do centro;
  - botões "Preencher", "Caber" e "Redefinir";
  - `Esc` ou clique fora sai do modo.
- Os limites impedem sobrar área vazia na moldura.
- Tudo grava via `atualizarDocCanvas`, então entra no desfazer/refazer e no rascunho.

## 2. Handles no padrão Canva (para todos os tipos de camada, inclusive texto)

Substituir os 4 quadradinhos atuais por um conjunto completo em volta da seleção:

- **8 handles**: 4 cantos + 4 laterais (topo, base, esquerda, direita).
- **Hit area maior que o visual**: cada handle é um alvo invisível de ~18px
  (compensado pelo zoom) com o desenho de ~9px centralizado dentro. Cantos redondos,
  laterais em barra fina, como no Canva.
- **Cursor por posição**: `nwse-resize`, `nesw-resize`, `ns-resize`, `ew-resize`,
  `move` no corpo, `grabbing` durante o arraste.
- **Handle de rotação isolado**: círculo com ícone de giro, 28px acima do topo da
  caixa, fora da área dos handles de resize, cursor próprio.
- **Texto também ganha handles**: laterais ajustam largura da caixa (quebra de linha),
  cantos escalam o tamanho da fonte proporcionalmente; nada é achatado.
- Shift no canto trava proporção; Alt redimensiona a partir do centro; rotação
  encaixa de 15 em 15 graus com Shift.
- Uma faixa de contorno fina em volta da seleção, sem cobrir o conteúdo.

Rotação passa a existir no modelo (`rotacao` em graus por camada) e é aplicada no
palco, na exportação PNG e nos campos do inspector Pro.

## 3. Ícone de "transformar em placeholder"

O `Frame` (grade) sai. No lugar entra um ícone de moldura de imagem com sinal de troca
(`ImageUp`), com rótulo claro no tooltip: "Transformar em moldura de imagem".

## Detalhes técnicos

- `src/lib/estudio-doc.ts`: campo `rotacao?: number` nas camadas; helpers
  `coverImg(molduraW, molduraH, natW, natH)` e `limitarImg` para o crop.
- `src/components/estudio/Stage.tsx`: novo componente `AlcasSelecao` (hit area,
  cursores, rotação) usado por `CanvasComSelecao`; `ModoArraste` ganha
  `n | s | e | w | girar`; modo crop no `CamadaCanvasView` da imagem.
- Reaproveita o `iniciar`/`encaixar` já existentes; guias e snapping continuam iguais.
- Sem rota nova, sem tocar em `kind` fluxo/html.

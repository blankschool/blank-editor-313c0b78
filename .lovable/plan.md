# Canvas: teclado, painel da camada e seleção flutuante

Sem rota nova, sem apagar componente, sem tocar em `fluxo`/`html`, sem Hug/Fill/flex.

## 1. Atalhos de teclado

Ativos apenas quando o documento aberto é canvas e o foco não está em input/textarea/contenteditable.

- `V` cursor, `H` mão
- `T` cria texto no centro da página visível e seleciona
- `R` cria retângulo 200×80 e seleciona
- `Delete`/`Backspace` apaga a camada selecionada
- setas movem 1px, `Shift`+seta move 10px
- `Cmd/Ctrl+D` duplica a camada com deslocamento +16/+16 e seleciona a cópia
- `Cmd/Ctrl+Z` fica mudo (nenhum histórico novo é inventado)

Cada alteração grava por `atualizarDocCanvas` com rótulo curto; sequências de setas são agrupadas pelo debounce que já existe.

## 2. Painel da camada selecionada

Painel simples, dentro do espaço de edição que já existe, mostrando só os campos que o modelo já tem:

- **Texto**: conteúdo, fonte, tamanho, peso, cor, alinhamento, entrelinha, entreletras
- **Forma**: preenchimento, raio, opacidade, borda (largura, estilo, cor)
- **Imagem**: opacidade, raio; `src` somente leitura
- **Todos**: posição X e Y; largura e altura só quando não for texto

Link "Add: shadow": ao clicar, a camada ganha um campo opcional de sombra (deslocamento X, deslocamento Y, desfoque, cor) que passa a ser editável e é aplicado no palco. Sem filtro, sem rotação, sem exportar PNG.

## 3. Seleção flutuante

A barra de ações da seleção deixa de ficar presa no rodapé do palco. Ela passa a aparecer logo acima do elemento clicado, com um respiro entre a barra e o elemento, acompanhando a posição e o zoom. Quando não couber acima (elemento colado no topo), ela aparece logo abaixo, com o mesmo respiro.

## Detalhes técnicos

- `src/lib/estudio-doc.ts`: campo opcional `sombra?: { x; y; blur; cor }` nas camadas de canvas; helper `duplicarCamadaCanvas` e reuso de `novaCamadaTexto` / `novaCamadaForma`.
- `src/components/estudio/Stage.tsx`: `CamadaCanvasView` aplica `boxShadow`/`textShadow` a partir de `sombra`; overlay da seleção posicionado a partir da geometria da camada (x, y, escala) em vez de `bottom-3 left-1/2`.
- Hook de teclado dentro de `CanvasComSelecao` (listener em `window`, guardas de foco e de `kind`).
- Painel novo em `src/components/estudio/EditPanels.tsx`, ao lado dos já existentes `TextPanelCanvas`/`ColorPanelCanvas`, reaproveitando `acharCamadaCanvas` e `comCamadaCanvas`.

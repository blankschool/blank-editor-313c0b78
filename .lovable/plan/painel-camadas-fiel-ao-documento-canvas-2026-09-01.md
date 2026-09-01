# Painel Camadas fiel ao documento canvas

Hoje o painel Camadas sempre lista os 8 slots do documento fluxo (`camadasDoDoc`), mesmo quando o palco mostra um canvas ou um preview html. A mudança faz o painel se adaptar ao tipo do documento aberto.

## Comportamento por tipo de documento

- **Fluxo**: nada muda — mesma árvore de 8 slots, olho, cadeado, reordenar.
- **HTML**: o painel mostra apenas "Preview, sem camadas".
- **Canvas**: a árvore lista as camadas reais da página visível.

## Árvore de camadas no canvas

Cada linha traz:

- ícone do tipo (texto, imagem, forma)
- nome curto da camada (ex.: fundo, círculo 1955, mulher, AGRUM JORNAL)
- olho para ocultar/mostrar
- clique na linha seleciona a camada; a camada correspondente ganha contorno no palco

Sem arraste, sem reordenar, sem edição de texto nesta etapa. Quando o canvas tem várias páginas (Agrum, 12 páginas), um seletor curto no topo do painel escolhe qual página a árvore está listando; a seleção acompanha a página.

## Ids e nomes nas sementes

Cada camada de `estudio-canvas-seeds.ts` (Barretos e Agrum) recebe um `id` estável e um `nome` curto quando ainda não tiver. Ids seguem o padrão `<pagina>-<n>` e os nomes vêm do papel da peça no HTML original (fundo, anel, recorte, manchete, etc.). Camadas antigas já salvas sem id continuam funcionando: o painel usa o índice como chave de reserva.

## Detalhes técnicos

- `src/lib/estudio-doc.ts`: `CanvasCamada` ganha `id?: string`, `nome?: string`, `oculto?: boolean`; nova função `camadasDaPaginaCanvas(doc, paginaId)` devolve `{ id, nome, tipo, oculto }` para a árvore.
- `src/lib/estudio-canvas-seeds.ts`: acrescenta `id` e `nome` em todas as camadas das duas sementes (transformação de dados, sem mudar geometria).
- `src/components/estudio/EstudioContext.tsx`: novo estado `paginaCanvas` (id da página visível, padrão a primeira) e `camadaCanvas` (id selecionado), mais `atualizarDocCanvas(fn, rotulo)` reaproveitando o mesmo caminho de gravação com debounce que já salva `designs.doc`. Alternar o olho grava `oculto` na camada.
- `src/components/estudio/Stage.tsx`: `CanvasView`/`CamadaCanvasView` passam a respeitar `oculto`, aplicar contorno na camada selecionada e chamar a seleção no clique.
- `src/components/estudio/EditPanels.tsx`: `LayersPanel` ramifica por `ehDocCanvas` / `ehDocHtml` antes da árvore de fluxo; a árvore de fluxo atual continua idêntica.
- Sem rota nova, sem componente removido, sem arraste ou guias.

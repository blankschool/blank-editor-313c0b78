# Terceiro tipo de documento: `kind: "canvas"`

Hoje o palco sabe desenhar dois documentos: o fluxo editável de 8 blocos e o preview em iframe (`kind: "html"`). Esta mudança acrescenta um terceiro, `kind: "canvas"`, gravado no mesmo campo jsonb, sem tocar nos outros dois.

## O que é um canvas

Um documento canvas tem uma lista de páginas de 1080x1440. Cada página tem camadas posicionadas por `x, y, w, h`, e cada camada é de um dos três tipos:

- texto (conteúdo, fonte, tamanho, peso, cor, alinhamento, entrelinha, espaçamento)
- imagem (caminho do arquivo em `/previews/...`, ajuste cover/contain)
- forma (retângulo com cor de preenchimento, raio, opacidade, rotação opcional)

O Artboard desenha as camadas em posição absoluta, na ordem da lista. Sem arraste, sem guias, sem edição — nesta etapa é só desenho fiel.

## Barretos e Agrum viram canvas

- **Barretos**: canvas de 1 página, com as mesmas peças do HTML em `public/previews/barretos` (fotos servidas de `/previews/barretos/assets/...`).
- **Agrum Eleição**: canvas de 12 páginas, fotos de `/previews/agrum-eleicao/assets/...`.

As camadas são transcritas a partir da posição/estilo já presentes nos HTMLs, sem converter HTML em tempo de execução e sem mexer em `docPadrao`. As fontes (`/previews/<pasta>/fonts/...`) são registradas via `@font-face` no CSS global para o texto sair igual.

No seletor "Novo design" as duas entradas passam a criar documentos canvas. Designs canvas ou html já salvos continuam abrindo como foram gravados.

## Páginas no palco

As 12 páginas do Agrum aparecem empilhadas verticalmente no palco, com o número da página ao lado de cada uma, respeitando o zoom e o enquadramento que já existem. Barretos, com uma página só, aparece como hoje.

## Segurança do que já funciona

- Documento fluxo: comportamento idêntico, incluindo painéis de edição, camadas, variantes e interpretador do chat.
- Documento html: iframe 1080x1440 escalado, sem alteração.
- Canvas inválido ou com dado faltando não derruba o palco: cai num aviso discreto dentro do artboard e o resto do workspace continua.
- Painéis de edição, chat e versões tratam canvas como somente leitura, do mesmo jeito que já tratam html.

## Detalhes técnicos

- `src/lib/estudio-doc.ts`: novos tipos `DocCanvas`, `CanvasPagina`, `CanvasCamada` (união texto/imagem/forma), guarda `ehDocCanvas`, e `DocSalvo = DesignDoc | DocHtml | DocCanvas`.
- `src/lib/estudio-canvas-seeds.ts` (novo arquivo de dados, não é mock de UI): os documentos canvas de Barretos e Agrum.
- `src/components/estudio/Stage.tsx`: no `Artboard`, ramo para `ehDocCanvas` antes do ramo de fluxo, renderizando páginas e camadas em `position: absolute`; ramo protegido por error boundary local.
- `src/components/estudio/EstudioContext.tsx`: `previewsHtml`/`novoDesign` passam a gravar o doc canvas para esses dois presets; o restante da lógica de doc remoto continua tratando qualquer doc com `kind` como não editável.
- Sem rota nova, sem componente removido, sem alteração no fluxo dos designs existentes.

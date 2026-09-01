# Editar: desfazer/refazer, placeholder de imagem e texto rico

Cinco ajustes no que já existe. Sem rota nova, sem apagar componente, sem tocar em `fluxo`/`html`.

## 1. Desfazer / Refazer de verdade

Hoje `historico` é só um registro de eventos: não guarda documento, então não há como voltar. Passa a existir uma pilha real no `EstudioContext`:

- Cada mutação (`atualizarDoc` / `atualizarDocCanvas`) empilha o documento anterior; mutações seguidas com o mesmo rótulo dentro de ~400 ms (digitar, arrastar, setas) viram um passo só.
- `desfazer()` e `refazer()` trocam o documento e respeitam o rascunho: com o inspector aberto continua tudo em memória; fechado, grava com o debounce que já existe.
- Atalhos: `Cmd/Ctrl+Z` desfaz, `Cmd/Ctrl+Shift+Z` e `Cmd/Ctrl+Y` refazem — só fora de input/textarea.
- Os dois ícones ganham estado desabilitado quando não há passo.

## 2. Raio

- Confirmar no palco onde o raio deixa de pintar e corrigir ali (o campo grava, o palco precisa aplicar em imagem e forma, inclusive quando a imagem tem recorte interno).
- Campo aceita valor vazio sem virar `NaN` e limita entre 0 e metade do menor lado, com botão para arredondar total (círculo/pílula).
- Camada de **texto** hoje não tem raio no modelo; ganha `raio` opcional que pinta junto com o `fundo` do texto.

## 3. Placeholder de imagem

- Qualquer camada pode virar **placeholder**: ação "Transformar em placeholder" na barra flutuante e no inspector.
- Placeholder é uma camada imagem sem `src`: mostra moldura tracejada com ícone e o texto "Adicionar imagem", respeitando raio, opacidade e sombra.
- Clique duplo no placeholder (ou botão "Enviar imagem" no inspector) abre o seletor de arquivo, envia pelo `enviarImagemCanvas` que já existe e preenche o `src`, ajustando a imagem para cobrir o quadro.
- Botão "Remover imagem" volta a camada ao estado de placeholder sem perder posição, tamanho e estilo.

## 4. Seleção parcial de texto (negrito, cor e o resto)

O modelo já tem `partes` (trechos com peso e cor), mas o inspector achata tudo num `textarea`. Passa a existir edição por trecho:

- No inspector, o conteúdo vira um campo rico: selecionar um pedaço e aplicar **negrito**, itálico, sublinhado, riscado, cor e tamanho afeta só aquele trecho.
- Duplo clique na camada no palco entra em edição no lugar, com a mesma seleção parcial e uma mini-barra (B / I / U / S / cor).
- Digitar preserva os trechos em vez de apagá-los; trechos vizinhos com o mesmo estilo são fundidos ao salvar.
- Os controles de tipografia sem seleção continuam valendo para a camada inteira.
- `CanvasParteTexto` ganha `italico`, `sublinhado`, `riscado` e `tamanho`, e `CamadaCanvasView` pinta cada `span` com eles — controle sem pintura no palco não entra.

## 5. Botão "Pedir ao assistente"

Na barra flutuante da seleção, vira só o ícone de brilho, com `title`/`aria-label` "Pedir ao assistente". Mesmo tamanho e espaçamento dos outros ícones, mantendo a cor de destaque.

## Detalhes técnicos

- `src/components/estudio/EstudioContext.tsx`: `pilhaDesfazer` / `pilhaRefazer` (limite ~50 estados), agrupamento por rótulo + tempo, `desfazer`, `refazer`, `podeDesfazer`, `podeRefazer` no contexto; listener de teclado global junto com os atalhos que já existem no `Stage`.
- `src/lib/estudio-doc.ts`: `raio?` em `CanvasCamadaTexto`; `CanvasParteTexto` com `italico`, `sublinhado`, `riscado`, `tamanho`; `src` opcional em `CanvasCamadaImagem` (placeholder) + helpers `aplicarEstiloEmTrecho(camada, inicio, fim, patch)`, `normalizarPartes` e `virarPlaceholder`.
- `src/components/estudio/Stage.tsx`: render de placeholder, upload por duplo clique, edição no lugar com `contenteditable` mapeado de/para `partes`, `borderRadius` em texto, barra flutuante com o assistente só em ícone.
- `src/components/estudio/EditPanels.tsx`: editor de conteúdo com seleção parcial, controles de trecho, seção de placeholder/upload, raio com validação.
- `src/components/estudio/TopBar.tsx` (ou a barra do palco onde ficam os ícones): ligar Desfazer/Refazer ao contexto com estado desabilitado.

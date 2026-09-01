# Inspector Editar unificado (Simples / Pro)

Sem produto novo: os quatro painéis fatiados de Editar viram um inspector só, com duas abas, gravando apenas em campos que já existem em `CanvasCamada`, `EstiloEl` ou `LayoutDoc`.

## Abas

`/d/{id}/editar/{painel}` continua sendo a mesma rota. `painel` passa a aceitar `simples` e `pro`; `texto`, `cor` e `layout` redirecionam para `simples`, `estrutura` para `pro`. Nada de aba Código ou Ajustes aqui — seguem no trilho.

## Simples

Cabeçalho fixo: título "Editar", **Descartar** e **Salvar** (Salvar só ativo quando há alteração).

Corpo, na ordem, mostrando apenas o que o nó realmente tem:

- **Aparência** — cor/preenchimento, opacidade, raio (forma e imagem).
- **Texto** — só aparece se o nó tem texto: conteúdo, fonte, peso, tamanho, entrelinha, entre letras, alinhamento, cor. No canvas somam-se itálico, sublinhado e riscado (campos novos em `CanvasCamadaTexto`), caixa (`normal/maiúsculas/minúsculas`) e fundo com opção "Nenhum".
- **Imagem** — `src` somente leitura, opacidade, raio, espelhar.
- **Adicionar:** linha final com `sombra` e `borda` (borda só em forma). Cada item vira seção quando clicado, com "Remover" que apaga o campo — mesmo padrão que a sombra já usa. Sem transformação e sem filtro: não existem no modelo.
- Cada seção traz **Redefinir**, que devolve os valores daquela seção ao estado salvo.
- **Ponto azul** ao lado de cada rótulo cujo valor difere da versão salva.
- **Exportar seleção** (só canvas, camada selecionada): PNG 1× e 2×, fundo transparente com xadrez na prévia. Função nova dedicada à camada; `docParaPng` continua exclusivo do fluxo.

## Rascunho, Descartar, Salvar

Hoje toda edição grava no banco com debounce. Passa a existir um rascunho:

- Ao abrir o inspector, guarda-se o documento salvo como base.
- Edições feitas dentro do inspector atualizam o palco na hora, mas não vão ao banco.
- **Salvar** grava e vira a nova base. **Descartar** volta à base.
- Edições fora do inspector (arrastar no palco, painel Camadas) continuam gravando como hoje.

## Pro

Só o que o modelo suporta:

- Árvore de camadas da página visível (nome, tipo, olho) — a mesma fonte do painel Camadas, sem tags HTML.
- X / Y e W / H (W/H ocultos em texto sem largura definida).
- z-order: trazer à frente / enviar para trás / topo / fundo, reordenando `camadas` da página.
- Sombra (offset x, y, blur, cor).

Nada de flex, justify, padding, Ajustar/Fixo/Preencher ou Em fluxo/Absoluta.

## Por tipo de documento

- **canvas**: inspector completo (Simples + Pro).
- **fluxo**: Simples com os campos de `EstiloEl` e `LayoutDoc` que já existiam nos painéis atuais; Pro mostra a ordem dos blocos (`doc.ordem`) e nada de X/Y/W/H.
- **html**: aviso curto de preview somente leitura, sem controles.

## Detalhes técnicos

- `src/lib/estudio-doc.ts`: `CanvasCamadaTexto` ganha `italico?`, `sublinhado?`, `riscado?`, `caixa?`, `fundo?`; helper `moverCamadaCanvas(doc, paginaId, camadaId, dir|extremo)` para z-order; `camadaParaPng(nodeSelector, escala)` para exportar a seleção.
- `src/components/estudio/EstudioContext.tsx`: estado de rascunho (`baseSalva`, `sujo`, `salvarRascunho`, `descartarRascunho`) reutilizando `agendarSalvar`; `atualizarDoc`/`atualizarDocCanvas` ganham um modo que só atualiza o local.
- `src/components/estudio/EditPanels.tsx`: novo `InspectorPanel` com abas, montado sobre os subcomponentes já existentes (`TextPanelCanvas`, `ColorPanelCanvas`, `SelecaoCanvasPanel`, `CamadasCanvasPanel`); os antigos `TextPanel`/`ColorPanel`/`LayoutPanel`/`LayersPanel` continuam exportados para o trilho.
- `src/routes/d.$designId.editar.$painel.tsx`: aceita `simples`/`pro`, redireciona os slugs antigos.
- `src/components/estudio/Stage.tsx`: a barra flutuante da seleção aponta para `editar/simples`.

# Inspector Editar unificado (Simples / Pro)

Sem produto novo: os quatro painéis fatiados de Editar viram um inspector só, com duas abas, gravando apenas em campos que já existem em `CanvasCamada`, `EstiloEl` ou `LayoutDoc`.

## Abas

`/d/{id}/editar/{painel}` continua sendo a mesma rota. `painel` passa a aceitar `simples` e `pro`; `texto`, `cor` e `layout` redirecionam para `simples`, `estrutura` para `pro`. Nada de aba Código ou Ajustes aqui — seguem no trilho.

## Simples

Cabeçalho fixo: título "Editar", **Descartar** e **Salvar** (Salvar só ativo quando há alteração).

Corpo, na ordem, mostrando apenas o que o nó realmente tem:

- **Aparência** — cor/preenchimento, opacidade, raio (forma e imagem).
- **Texto** — só aparece se o nó tem texto: conteúdo, fonte, peso, tamanho, entrelinha, entre letras, alinhamento, cor. No canvas somam-se itálico, sublinhado, riscado, caixa (`normal/maiúsculas/minúsculas`) e fundo com opção "Nenhum". Cada um desses campos novos só entra junto com o CSS correspondente em `CamadaCanvasView` (`fontStyle`, `textDecoration`, `textTransform`, `background` no div da camada) — controle sem pintura no palco não é desenhado. `partes` (spans) fica de fora: I/U/S valem para a camada inteira, como já acontece com peso e cor.
- **Imagem** — `src` somente leitura, opacidade, raio, espelhar.
- **Adicionar:** linha final com `sombra` e `borda` (borda só em forma). Cada item vira seção quando clicado, com "Remover" que apaga o campo — mesmo padrão que a sombra já usa. Sem transformação e sem filtro: não existem no modelo.
- Cada seção traz **Redefinir**, que devolve os valores daquela seção ao estado salvo.
- **Ponto azul** ao lado de cada rótulo cujo valor difere da versão salva.
- **Exportar seleção** (só canvas, camada selecionada): PNG 1× e 2×, fundo transparente com xadrez na prévia. Função nova dedicada à camada; `docParaPng` continua exclusivo do fluxo.

## Rascunho, Descartar, Salvar

Hoje toda edição grava no banco com debounce. Enquanto o inspector estiver aberto, **toda** mutação do documento fica no rascunho — inclusive geometria vinda do palco (arrastar, redimensionar, setas, duplicar, apagar), porque tudo passa pelo mesmo `atualizarDocCanvas` e o debounce mandaria o rascunho junto.

- Ao abrir o inspector, guarda-se o documento salvo como base.
- Toda edição atualiza o palco na hora e nada vai ao banco.
- **Salvar** grava e vira a nova base. **Descartar** volta à base, posição e estilo incluídos.
- Sair da rota de edição com alterações pendentes pergunta antes (Salvar / Descartar / Continuar editando); nada some silenciosamente.
- Com o inspector fechado, a gravação com debounce segue como hoje.


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

- `src/lib/estudio-doc.ts`: `CanvasCamadaTexto` ganha `italico?`, `sublinhado?`, `riscado?`, `caixa?`, `fundo?`; helper `moverCamadaCanvas(doc, paginaId, camadaId, dir|extremo)` para z-order.
- `src/lib/estudio-doc.ts`: `camadaParaPng(camadaId, escala)` clona o nó `[data-camada="…"]` do palco, remove o outline de seleção, mede em escala 1× (página 1080, ignorando o `transform: scale()` do palco) e só então rasteriza em 1× ou 2× com fundo transparente. Não toca em `docParaPng`.
- `src/components/estudio/Stage.tsx`: `CamadaCanvasView` passa a aplicar `fontStyle`, `textDecoration`, `textTransform` e `background` da camada; a barra flutuante da seleção passa a abrir `editar/simples` (com atalho para `pro` na ação de árvore) em vez de `texto`/`cor`.
- `src/components/estudio/EstudioContext.tsx`: estado de rascunho (`baseSalva`, `sujo`, `salvarRascunho`, `descartarRascunho`); enquanto o inspector estiver aberto, `atualizarDoc`/`atualizarDocCanvas` não chamam `agendarSalvar`, valendo para qualquer origem de mutação.
- `src/components/estudio/EditPanels.tsx`: novo `InspectorPanel` com abas, montado sobre os subcomponentes já existentes (`TextPanelCanvas`, `ColorPanelCanvas`, `SelecaoCanvasPanel`, `CamadasCanvasPanel`); os antigos `TextPanel`/`ColorPanel`/`LayoutPanel`/`LayersPanel` continuam exportados para o trilho.
- `src/routes/d.$designId.editar.$painel.tsx`: aceita `simples`/`pro`, redireciona os slugs antigos.


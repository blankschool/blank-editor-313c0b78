# Editar conteúdo das camadas canvas

O painel Camadas já lista e oculta camadas de um doc `kind: "canvas"`. Falta que Texto, Cor e a seleção no palco editem a camada de verdade.

## O que muda

**Seleção**
- Clique numa camada no palco ou na linha da árvore passa a ser a mesma seleção (`camadaCanvas` + `paginaCanvas`, já no contexto). Contorno na peça continua como está.

**Painel Texto (doc canvas)**
- Mostra o conteúdo da camada de texto selecionada.
- Camada com `texto`: uma caixa com esse texto.
- Camada com `partes`: uma caixa só, com o texto corrido (partes coladas na ordem, sem forçar linha nova). Ao digitar, grava tudo em `texto` da camada e esvazia `partes`. Peso e cor passam a valer para a camada inteira pelos controles de tipografia — sem preservar span por span neste turno.
- Controles de tipografia que a camada canvas realmente tem: fonte, peso, tamanho, entrelinha, entre letras, alinhamento.
- Sem camada de texto selecionada: aviso curto ("selecione uma camada de texto").
- Camada imagem: painel mostra o `src` em campo somente leitura (sem upload).
- Camada forma: aviso de que não tem texto.

**Painel Cor (doc canvas)**
- Só o essencial desta etapa: cor da camada de texto (`cor`) ou preenchimento da forma (`cor`), mais opacidade da camada.
- Paleta existente + amostra livre reutilizadas.

**Gravação**
- Toda alteração passa por `atualizarDocCanvas`, que já grava em `designs.doc` com debounce. Recarregar a página mostra o texto novo.

**Sem mudança**
- Doc `fluxo`: TextPanel e ColorPanel exatamente como hoje.
- Doc `html`: leitura apenas.
- Sem drag, sem guias, sem rota nova, sem componente removido, sem os 8 slots em cima do canvas.

## Detalhes técnicos

- `src/lib/estudio-doc.ts`: helpers `camadaCanvasPorId(pagina, id)` e `comCamadaCanvas(doc, paginaId, camadaId, patch)` para aplicar patch imutável numa camada por id estável (`idCamadaCanvas`).
- `src/components/estudio/EditPanels.tsx`: `TextPanel` e `ColorPanel` ganham um ramo canvas no topo (`e.docCanvas` presente) e mantêm o corpo atual para fluxo; sub-componentes `TextPanelCanvas` e `ColorPanelCanvas` no mesmo arquivo.
- `src/components/estudio/Stage.tsx`: garantir que o clique na camada define página + camada selecionada (já existe em `CanvasComSelecao`); nenhum outro ajuste de render.

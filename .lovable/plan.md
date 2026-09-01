# Barra de ações da seleção: ancorar acima do elemento

Hoje a barra (Texto / Cor / Layout / Estrutura / Pedir ao assistente) fica presa no rodapé do palco quando a medição falha, e o rótulo de caminho fica fixo no canto superior esquerdo. Ela deve seguir o elemento selecionado.

## Comportamento

- A barra aparece sempre acima da caixa do elemento selecionado, alinhada à esquerda dele.
- Espaçamento fixo de 12 px entre o topo do elemento e a base da barra, para nunca sobrepor.
- Se não houver espaço acima (elemento colado no topo do palco), a barra vira para baixo do elemento, com o mesmo espaçamento.
- Se a barra ultrapassar a borda direita ou esquerda do palco, ela desliza para dentro.
- O rótulo de caminho (Herói > Título) passa a acompanhar a mesma âncora, logo acima da barra, em vez de ficar fixo no canto.
- Sem seleção medida, nada de barra flutuando no rodapé: ela só aparece quando há caixa medida.

## Técnico

Arquivo único: `src/components/estudio/Stage.tsx`, componente `SelecaoOverlay`.

- Medir a altura real da barra com um `ref` + `ResizeObserver` (hoje usa o valor fixo 46) para calcular o deslocamento vertical correto.
- Nova função de posicionamento: `top = caixa.y - alturaBarra - 12`; se `top < 0`, usar `caixa.y + caixa.h + 12`.
- Clamp horizontal contra a largura do palco.
- Remeasure já existente (`useLayoutEffect` + resize) passa a observar também scroll do palco e zoom.
- Nada de rota nova, nenhum componente removido, sem alteração em doc `fluxo`/`html`/`canvas` além do posicionamento visual.

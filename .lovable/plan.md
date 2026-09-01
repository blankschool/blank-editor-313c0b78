# Alças da foto: só cantos, sempre proporcional

## O que muda

No modo "ajustar imagem" (zoom + pan dentro da máscara), a foto passa a ter **apenas 4 alças de canto**, e qualquer redimensionamento é **proporcional** — nunca estica. Isso elimina o achatamento na origem, sem mexer na matemática do arraste.

A seleção normal de camadas (texto, forma, imagem fora do modo ajuste) **continua com as 8 alças**, porque ali esticar é um comportamento legítimo. Se você quiser 4 cantos em tudo, é uma troca de uma linha depois.

## Detalhes técnicos

Arquivo: `src/components/estudio/Stage.tsx`

1. Nova constante ao lado de `DIRECOES`:
   ```ts
   const DIRECOES_CANTO: Direcao[] = ["nw", "ne", "se", "sw"];
   ```
   `DIRECOES` (8) segue sendo usada por `AlcasSelecao` (seleção de camada).

2. Em `ImagemCanvasView` (bloco de alças do modo recorte, ~linha 858), trocar `DIRECOES.map` por `DIRECOES_CANTO.map`. O cálculo de `left`/`top` já cobre cantos; os ramos de meio deixam de ser usados.

3. No `mover` do arraste da foto (~linhas 608-619), substituir o bloco condicional por escala proporcional incondicional:
   ```ts
   const k = Math.max(w / (st.base.w || 1), h / (st.base.h || 1));
   w = (st.base.w || 1) * k;
   h = (st.base.h || 1) * k;
   ```
   Shift deixa de liberar esticamento aqui (continua servindo para travar a rotação em 15°). A variável `canto` sai por não ser mais usada.

4. Nada muda em `ajustarImgRot`, na cobertura da máscara, na rotação isolada, no export PNG nem no inspector.

## Resultado

Arrastar qualquer canto da foto dentro da moldura só escala uniforme; arrastar o meio move; a alça isolada gira. Sem alça lateral, sem foto achatada.

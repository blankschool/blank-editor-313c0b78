# Exportar PNG sem as fotos — corrigir

## O que está acontecendo

Testei no seu próprio navegador, na página aberta agora:

- As fotos são baixáveis normalmente (as URLs do Storage respondem 200 e o navegador consegue lê-las).
- O problema é o método de rasterização. Hoje a página inteira é desenhada dentro de um SVG (`foreignObject`) e depois virada PNG. Nesse modo, o Chrome **não pinta imagens aninhadas** — nem quando a foto já está embutida como dado dentro do próprio SVG. Fiz o teste isolado: a caixa foi desenhada, a foto ficou vazia.
- Texto, cores, formas e fontes continuam pintando normalmente por esse caminho (também confirmado no teste).

Resultado: o PNG sai exatamente como o arquivo que você mandou — layout, tipografia e círculos certos, sem nenhuma foto.

## Correção

Parar de depender do SVG para as fotos e montar o PNG em camadas, na ordem certa:

1. Pinta o fundo da página.
2. Percorre as camadas na ordem do documento (de trás para frente):
   - **Camada de imagem** → desenhada direto no canvas 2D, sem SVG: recorte da moldura (raio/círculo), rotação da camada, posição/escala/rotação da foto dentro da máscara e opacidade. É o mesmo cálculo que o palco já usa, então o que você vê é o que sai.
   - **Texto, forma e desenho** → continuam pelo caminho atual (que já funciona), agrupando camadas vizinhas numa única passada para não ficar lento.
3. Camadas ocultas ficam de fora; alças, contorno de seleção, guias e overlay de recorte continuam ausentes (nunca entram nesse gerador).

Isso vale para "Tela atual" e "Todas as telas", em 1×–4×.

## Verificação

Depois de implementar, exporto uma página no navegador e confiro por amostragem de pixel que as fotos aparecem no lugar certo (fundo, círculos e recorte), comparando com o palco.

## Detalhes técnicos

- `src/lib/canvas-png.ts`: `paginaCanvasParaPng` passa a compor em passadas. Novo desenhador nativo para `CanvasCamadaImagem` (clip com `roundRect`/elipse, `translate`+`rotate` na moldura, segundo `rotate` para `imgRot`, `globalAlpha` para opacidade). Imagens carregadas via `fetch` → `createImageBitmap` (mantendo o cache atual de URLs).
- O SVG intermediário passa a ser gerado só com as camadas não-imagem; a embutida de fontes em data URL continua igual.
- Sem mudança no modelo do documento, no palco, no inspector nem no preview HTML público.

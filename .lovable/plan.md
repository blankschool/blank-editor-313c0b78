# Trazer de volta a barra de ações (agora ancorada) no documento canvas

A barra some porque ela pertence ao overlay do documento **fluxo**, que mede um elemento `[data-el]`. Em documento canvas esse elemento não existe: antes a barra caía no fallback fixo no rodapé do palco (o que incomodava), e agora, sem fallback, ela não aparece.

## O que fazer

1. **Canvas ganha barra própria**, ancorada na camada selecionada:
   - Aparece acima da caixa da camada, alinhada à esquerda, com 12 px de folga (contra-escalada pelo zoom, como o rótulo atual).
   - Sem espaço acima, vira para baixo da camada com a mesma folga; nunca sai das bordas da página.
   - Some junto com a seleção.
2. **Conteúdo da barra no canvas** (só ações que o modelo já suporta):
   - Rótulo: nome/tipo da camada · largura×altura.
   - Texto (abre painel Texto) e Cor (abre painel Cor) — para camada imagem, Texto fica oculto.
   - Duplicar camada (+16,+16) e Excluir camada (ações já existentes).
   - "Pedir ao assistente".
3. **Fluxo continua como está**: barra ancorada acima do elemento, sem o fallback fixo.
4. Corrigir o `0×0` do rótulo: quando a camada de texto não tem `w`/`h` no modelo, medir a caixa renderizada antes de exibir as dimensões.

## Técnico

Arquivo: `src/components/estudio/Stage.tsx`.

- No `Artboard` canvas, junto do bloco `geoSel && selNaPagina` (linha ~830), substituir o rótulo solto por uma barra flutuante que reúne rótulo + ações, posicionada com `top = geoSel.y - alturaBarra/escala - 12/escala`, com flip para baixo e clamp nas bordas da página; `transform: scale(1/escala)` com `transformOrigin` coerente ao lado escolhido.
- Ações reutilizam `duplicarCamadaCanvas`, a remoção de camada já existente e `e.setPainelEdicao("texto"|"cor")`; nada de rota nova.
- Dimensões do rótulo: usar a geometria efetiva medida (fallback para o `getBoundingClientRect` da camada) em vez de `w`/`h` ausentes.
- Sem mudanças em documento `html`, sem novos componentes de rota, sem remover `SelecaoOverlay`.

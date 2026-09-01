# Ajuste da imagem dentro do frame (máscara), no padrão Canva

Hoje o modo "ajustar imagem" já separa moldura e foto (a foto tem x/y/w/h próprios dentro de um container com `overflow: hidden`), mas a manipulação é só arrastar + zoom por roda/slider. Faltam os handles que transformam **a imagem** e a rotação dela dentro da máscara.

## O que muda

1. **Duas camadas explícitas**
   - Janela fixa: a camada imagem continua com tamanho/rotação da moldura, `overflow: hidden` e o recorte da forma (raio, inclusive 50% = círculo).
   - Conteúdo posicionável: a foto por trás, com posição, escala e rotação próprias. Entrar em modo ajuste nunca altera a moldura.

2. **Handles atuando na imagem (não na moldura)**
   - No modo ajuste, as alças de seleção da camada dão lugar a alças que envolvem **a foto**: 8 alças com hit area de 20px e desenho menor, cursor por posição corrigido pela rotação da foto.
   - Cantos: escala proporcional da foto a partir do canto oposto (Shift = livre).
   - Laterais: esticam a foto (com Shift travando proporção), respeitando a cobertura mínima da moldura.
   - Arrastar o miolo: move a foto dentro da máscara (já existe, mantido).
   - Alça de rotação isolada, acima da caixa da foto, com linha de conexão — gira a foto em torno do próprio centro.

3. **Rotação da foto**
   - Novo campo opcional `imgRot` na camada imagem (grau), aplicado só no conteúdo interno.
   - A restrição de "não deixar buraco" passa a considerar a caixa girada da foto: se a foto girada não cobrir mais a moldura, ela é reescalada/reposicionada para o mínimo que cobre.

4. **Feedback visual do modo ajuste**
   - Fora da moldura: foto em fantasma (já existe) e o resto do palco escurecido, moldura clara.
   - Barra flutuante mantém zoom, Preencher, Caber, Redefinir e Concluir; Redefinir também zera `imgRot`.
   - Esc, clique fora ou Concluir saem do modo.

5. **Exportação**
   - `camadaParaPng` passa a aplicar também a rotação interna da foto, além da rotação da camada.

## Fora do escopo deste turno

Sem rota nova, sem novo componente de moldura, sem clip-paths customizados além dos já existentes (raio/círculo), sem alterar tipos `fluxo` e `html`.

## Detalhes técnicos

- `src/lib/estudio-doc.ts`: campo `imgRot?: number` em `CanvasCamadaImagem`; `limitarImg` ganha variante ciente de rotação (AABB da foto girada precisa conter a moldura); helper de escala mínima para cobrir.
- `src/components/estudio/Stage.tsx`: dentro de `ImagemCanvasView`, novo bloco de alças em modo recorte reaproveitando a matemática de `AlcasSelecao` (hit area, cursores, rotação), operando sobre `CaixaImg` + `imgRot` e gravando via `onRecorte` com o mesmo debounce atual.
- Estilo interno: `transform: rotate(imgRot)` no wrapper da `<img>`, mantendo `left/top/width/height` como estão; container externo intocado.
- `EditPanels.tsx` (aba Pro): campo de rotação da imagem junto aos campos existentes da camada.

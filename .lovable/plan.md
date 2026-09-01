# Mover, redimensionar e criar camadas no canvas

Sem rota nova, sem componente novo de tela, sem tocar nos documentos de fluxo e HTML.

## Arrastar no palco

- Com a ferramenta cursor ativa, `pointerdown` numa camada do canvas seleciona e inicia o arrasto.
- Durante o movimento, `x` e `y` da camada acompanham o mouse em estado local (render imediato, sem gravar a cada frame).
- O palco está em `scale = (zoom/100) × (largura do viewport / 1080)`; o delta do mouse é dividido por essa escala antes de virar delta de camada, para a peça não fugir do cursor.
- Ao soltar, a posição final é gravada uma vez com `atualizarDocCanvas` ("mover camada"), entrando no histórico/versões como qualquer outra edição.
- Ferramenta mão continua fazendo pan do palco e nunca move camada. Camada oculta ou documento não-canvas não arrasta.

## Redimensionar

- A camada selecionada recebe quatro alças nos cantos, desenhadas em tamanho compensado pela escala (para continuarem clicáveis com zoom baixo).
- Arrastar a alça altera `w` e `h` (e `x`/`y` quando a alça é superior/esquerda), apenas para camadas de imagem e forma.
- Camada de texto neste turno só move: mostra a moldura de seleção, sem alças.
- Grava no soltar, igual ao arrasto.

## Guias temporárias (nunca entram no documento)

Enquanto arrasta ou redimensiona, linhas finas aparecem sobre a prancheta quando o alvo se aproxima de:

- margens de 108px da prancheta (esquerda, direita, topo, base)
- centro vertical e horizontal da prancheta
- bordas e centros das outras camadas visíveis da mesma página

Snap com tolerância de 4px (na escala do documento). Ao soltar, as guias somem e nada delas é salvo.

## Adicionar camada (painel Camadas)

Três botões atuando na página atual; cada camada nova recebe id estável (`crypto.randomUUID()` prefixado) e entra no fim da lista (na frente das demais), já selecionada:

- **Texto**: centro da página, conteúdo "Novo texto", fonte NYT Franklin, tamanho 48, cor branca.
- **Forma**: retângulo 200×80, preenchimento `#4ADC75`, no centro.
- **Imagem**: abre input de arquivo, envia para o bucket `uploads` em `${user.id}/${uuid}-${nome}` usando o helper de upload que já existe em `estudio-db.ts`, e cria a camada com a URL que o projeto já usa. Se o upload falhar, mostra o erro em toast e não cria camada nem placeholder falso. Sem sessão, avisa que precisa entrar.

## Apagar camada

Lixeira na camada selecionada dentro do painel Camadas, com confirmação curta (AlertDialog). Remove a camada da página via `atualizarDocCanvas` e limpa a seleção.

## Detalhes técnicos

- Arquivos tocados: `src/components/estudio/Stage.tsx` (arrasto, alças, guias), `src/components/estudio/EditPanels.tsx` (botões adicionar/lixeira em `CamadasCanvasPanel`), `src/lib/estudio-doc.ts` (helpers `novaCamadaTexto/Forma/Imagem`, `removerCamadaCanvas`, cálculo de guias/snap).
- Nenhum estado transitório de arrasto entra no `DocCanvas`; guias vivem em estado de componente.
- Fluxo (`DesignDoc`) e HTML seguem exatamente como estão; os 8 slots não aparecem sobre canvas.

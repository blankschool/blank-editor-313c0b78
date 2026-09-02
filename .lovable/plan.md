# Canvas gravando no banco + Exportar PNG do canvas

Duas frentes: (1) tudo que o palco e o inspector mudam vai ao banco na hora e aparece na página real `/t/{id}`; (2) o Exportar passa a baixar o PNG do canvas de verdade (com rotação e o recorte da foto), em vez do desenho do documento de fluxo.

## 1. Gravar direto no banco (autosave)

Hoje, com o inspector Editar aberto, qualquer mudança fica presa num rascunho local e o banco só recebe ao clicar Salvar — por isso a página real não acompanha.

- `atualizarDocCanvas` e `atualizarDoc` passam a gravar sempre, com o debounce que já existe, mesmo em modo de edição.
- Descartar continua existindo: volta ao estado de quando o inspector foi aberto e grava essa volta.
- Salvar vira "gravar agora": força o flush do debounce e limpa o ponto azul.
- O ponto azul (diferente do salvo) continua comparando com o estado de abertura do inspector, não com o banco.
- Undo/redo (Cmd+Z) também grava o resultado.
- Depois de gravar, invalidar as consultas do design e da biblioteca para a página real e o preview lerem a versão nova.

## 2. Placeholders e imagens

- O envio de imagem já sobe para o Storage; garantir que o `src` retornado, o enquadramento (`img`) e a rotação interna (`imgRot`) entrem no documento pelo mesmo caminho de gravação, sem passar pelo rascunho.
- Trocar a imagem, recortar, mover ou girar dentro da moldura grava igual a qualquer outra edição.

## 3. Página real `/t/{id}`

- Já lê o design do banco e usa o mesmo gerador do palco. Conferir que o gerador cobre texto rico, fonte/cor/alinhamento, moldura com raio, rotação da camada e recorte da foto; corrigir o que faltar para o HTML bater com o palco.

## 4. Exportar PNG do canvas

- No diálogo Exportar, quando o documento for canvas, o formato PNG passa a rasterizar as páginas do canvas (1080x1440), não `docParaPng` do fluxo.
- Escopo "Tela atual" baixa a página aberta no palco; escopo "Todas as telas" baixa um PNG por página.
- Respeita rotação de camada, rotação e recorte da foto dentro da moldura, e raio/máscara.
- Sem alças de seleção, sem contorno, sem guias, sem overlay de recorte no arquivo final.
- A escala (1×–4×) do diálogo continua valendo.
- Documentos de fluxo e HTML seguem exportando como hoje.

## Detalhes técnicos

- `src/components/estudio/EstudioContext.tsx`: remover o desvio `modoEdicaoRef` nas gravações, manter `baseDoc`/`baseCanvas` só como referência de Descartar e do ponto azul; `salvarRascunho` vira flush imediato.
- `src/lib/estudio-doc.ts`: nova função de rasterização de página de canvas (reaproveitando o clone + estilos inlinados de `camadaParaPng`, filtrando nós de UI marcados como overlay) e o download por página.
- `src/components/estudio/Dialogs.tsx`: ramo canvas no `exportar()`.
- `src/lib/canvas-html.ts`: ajustes pontuais se algo do palco não estiver refletido.
- `roadmap.md`: marcar os itens da seção "Canvas ↔ preview HTML real".

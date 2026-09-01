# Ligar as exclusões e adicionar dois designs de preview em HTML

Nada de tela nova, rota nova ou mock. Só clique ligado ao que já existe, mais um modo de documento `html` para preview.

## 1. Apagar design (biblioteca)

- `LibrarySidebar`: no grupo hover do card (junto de favoritar/duplicar), botão lixeira que abre um `AlertDialog` — "Apagar este design? Versões e conversa vão junto." — e no confirmar chama `excluirDesign(d.id)` do contexto.
- Mesma lixeira no hover de cada linha da Árvore do projeto, com o mesmo diálogo.
- Fechar aba continua sendo só `fecharAba` (não apaga nada) — sem mudança.

## 2. Ocultar/remover elemento no palco

- Barra flutuante do modo editar (Stage): o `Trash2` passa a marcar `estilos[alvo].oculto = true` via `atualizarDoc` (rótulo "Ocultou X"), em vez de tirar de `ordem`.
- Lixeira do `LayersPanel`: mesma ação (ocultar).
- No `LayersPanel`, ação nova "Remover bloco" que aí sim tira o id de `doc.ordem` (é o comportamento que hoje está na lixeira).

## 3. Apagar comentário e mensagem

- `estudio-db.ts`: duas funções finas — `removerComentario(id)` (delete em `comments`; `replies` caem por cascade) e `removerMensagem(id)` (delete em `messages`).
- `EstudioContext`: `apagarComentario` e `apagarMensagem` que chamam essas funções e invalidam as queries já existentes (`comments`/`messages` da aba ativa).
- Painel de comentários: ação "Apagar" no thread. `ChatPane`: ação "Apagar" na mensagem — só some da thread, não desfaz o palco nem versões.

## 4. Designs de preview em HTML

- Os dois HTML enviados vão para `public/previews/agrum-eleicao/index.html` e `public/previews/barretos/index.html`, servidos como estão (as fontes `fonts/*.woff2` não vieram; o CSS já tem fallback de sistema, então o texto renderiza com fonte substituta).
- O botão "Novo design" vira um pequeno menu (dropdown já existente no projeto) com três opções: **Em branco** (fluxo atual, `docPadrao`), **Agrum Eleição** e **Barretos**.
- Os dois presets criam o design com `doc = { kind: "html", src: "/previews/<slug>/index.html" }` — sem conversão para `DesignDoc`, sem tocar em `docPadrao`.
- `Artboard`: se `doc.kind === "html"`, renderiza um `iframe` de 1080x1440 com esse `src`, escalado pelo zoom do palco. Sem seleção, sem overlay de edição, sem `interpretarPedido`.
- Painéis de edição, versões e o interpretador simplesmente não se aplicam a esses docs; designs antigos seguem exatamente o fluxo de hoje.

## Detalhes técnicos

- `DesignDoc` ganha um irmão no tipo lido do banco: `type DocSalvo = DesignDoc | { kind: "html"; src: string }`, com um guard `ehDocHtml(doc)` usado por `Artboard`, pelos painéis e pelo chat para desviar do caminho editável. `docPadrao` fica intacto.
- Exclusões reaproveitam `excluirDesign`/`excluirVersao`/`removerDesign` — nenhuma mutation nova além dos dois deletes de comment/message que hoje não existem.
- `AlertDialog` vem de `@/components/ui/alert-dialog`.

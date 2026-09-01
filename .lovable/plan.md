# Supabase vira a memória do Estúdio + casco mais vazio

Sem rota nova, sem componente novo de tela, sem apagar componente existente.

## 1. Revalidar o servidor

Rodar de novo, contra o client atual (`VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`):
cadastro sem e-mail, login imediato, `listBuckets()` devolvendo `renders` e `uploads`
depois do login, e upload privado em `uploads` no caminho
`${user.id}/${crypto.randomUUID()}-${file.name}`. Antes do login, `[]` é o esperado.
O resultado de cada item é reportado; nada é dado como certo sem a chamada real.

## 2. Esquema no seu Supabase

Um arquivo SQL no repo (`supabase/schema.sql`) com as tabelas e as políticas, para você
rodar no SQL editor do self-hosted (não tenho service_role, então não aplico por você):

- `projects(id, owner, nome, criado_em)`
- `designs(id, project_id, owner, nome, tipo, favorito, tom, doc jsonb, atualizado_em)`
- `versions(id, design_id, owner, rotulo, autor, doc jsonb, criado_em)`
- `messages(id, design_id, owner, autor, payload jsonb, criado_em)`
- `comments(id, design_id, owner, x, y, texto, resolvido, criado_em)`
- `replies(id, comment_id, owner, texto, criado_em)`

Cada tabela: `GRANT` para `authenticated`, RLS ligada, políticas `owner = auth.uid()`
para select/insert/update/delete. Sem acesso anônimo.

## 3. Estado vindo do banco

`EstudioContext` para de nascer em `estudio-mock.ts`:

- lista de designs, doc do palco, versões, conversa e pinos passam a vir de queries
  TanStack Query sobre essas tabelas, com o client existente.
- Novo design = `insert` em `designs` com `docPadrao`.
- Editar o palco = `update` em `designs.doc` com debounce (~500ms) e cache otimista.
- Enviar no chat = grava a mensagem em `messages`, roda `interpretarPedido` no doc,
  salva o doc e abre uma row em `versions`; a thread só fala depois.
- Restaurar = copia `versions.doc` de volta para `designs.doc`.
- Comentários/respostas gravam em `comments`/`replies`.
- Recarregar a página mostra o mesmo arquivo, vindo do banco.
- Sem sessão: lista vazia e só o botão "Novo design". Nada de Marina, Checkout ou
  conversa fictícia. `TopBar` mostra o usuário de `supabase.auth` (e sair de verdade).
- `localStorage` fica só para cromado: larguras dos painéis, aberto/fechado, zoom.
  O design deixa de ser gravado lá.

## 4. Casco mais vazio

Em `src/routes/d.$designId.tsx`, a faixa do workspace passa a ser
`ResizablePanelGroup` / `ResizablePanel` / `ResizableHandle` já existentes:

```text
[ Biblioteca ]||[ Palco + Outlet ]||[ Conversa ]   PanelRail fixo à direita
```

- Biblioteca e Conversa começam colapsadas.
- Handle em estilo puxador vertical; duplo clique recolhe/expande.
- Biblioteca recolhida vira trilho de ~40px (ícone que reabre).
- Conversa recolhida some e volta por um botão na barra do palco.
- Painel direito continua abrindo pelo trilho, como hoje.
- Larguras e estado de colapso guardados em `localStorage`.

Escondido até o clique da função correspondente (permanece no DOM, nada deletado):
filtros da biblioteca, árvore do projeto, régua, seletor de viewport, comentar e os
links extras do TopBar — entram pelo ícone, pelo `⋯` ou pelo modo editar.

## Detalhes técnicos

- Queries com chaves `["designs"]`, `["design", id]`, `["versions", id]`,
  `["messages", id]`, `["comments", id]`; invalidação após cada mutation.
- `docsRef` some; a fonte do doc é o cache da query.
- `estudio-mock.ts` mantém só tipos/constantes que ainda são usados (camadas,
  sistemas, mapa de código); designs/conversa/comentários iniciais saem do fluxo.

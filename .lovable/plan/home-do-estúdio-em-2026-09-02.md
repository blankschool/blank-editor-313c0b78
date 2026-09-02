# Home do Estúdio em `/`

Hoje `/` só redireciona para `/d/d1`. Vira uma tela inicial de verdade: painel do projeto, com login na frente quando não há sessão.

## Sem sessão: tela de entrada

`/` renderiza uma tela de boas-vindas em coluna única com a marca do Estúdio, uma frase curta do que é o produto e o formulário de entrar/cadastrar inline (mesma lógica de `entrar` / `cadastrar` já existente). Nada de biblioteca, atalhos ou dados vazios enquanto não há sessão. Ao autenticar, a mesma rota passa a mostrar o painel.

## Com sessão: painel do projeto

Uma página com a `TopBar` no topo, sem o trilho de edição, dividida em:

1. **Cabeçalho** — nome do projeto (editável como já é hoje), contagem de designs, botão "Novo design".
2. **Início rápido em destaque** — fileira de cartões grandes: "Canvas em branco" mais um cartão para cada template do catálogo (Barretos, Agrum e o que o manifest trouxer). Clique cria e abre o design, usando `novoDesign(slug)`.
3. **Recentes** — grade de cartões dos designs ordenados por atualização, com miniatura, nome, tipo e data. Clique abre `/d/{id}`.
4. **Favoritos** — mesma grade, só os marcados; some quando não há nenhum.
5. **Estado vazio** — quando não há design algum, um bloco convidando a começar por um dos cartões de início rápido.

Busca no topo da página filtra recentes e favoritos (reaproveita `busca` do contexto).

## Detalhes técnicos

- `src/routes/index.tsx`: remove o `beforeLoad`/`redirect`, passa a ter `component` e `head()` próprio (título/descrição/og do Estúdio).
- Novo componente `src/components/estudio/HomePanel.tsx` com as seções; a tela de login pode ficar num `HomeAuth` no mesmo arquivo, reusando `entrar`/`cadastrar` do `EstudioContext` (o `AuthDialog` continua existindo para os outros fluxos).
- Consome só o que o contexto já expõe: `designs`, `catalogoTemplates`, `novoDesign`, `favoritar`, `projeto`/`setProjeto`, `temSessao`, `carregandoSessao`, `busca`.
- Enquanto `carregandoSessao`, mostra esqueleto — evita piscar a tela de login para quem já está logado.
- Tokens semânticos existentes (papel quente, `bg-canvas`, `--shadow-panel`); nenhuma cor nova fixada no componente.
- Sem alterações em rotas `/d/*`, no palco, no inspector ou no banco.

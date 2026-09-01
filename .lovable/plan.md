# Cada área do Estúdio com sua própria rota

Hoje tudo vive numa única rota `/`: painéis, modais, modo editar e apresentação são só estado local, sempre montados. A mudança transforma cada área em uma rota real, montada apenas quando o usuário clica.

## Mapa de rotas

```text
/                         → redireciona para o último design aberto (ou biblioteca)
/biblioteca               → biblioteca de designs (grid, busca, filtros, árvore)
/d/$designId              → palco com o arquivo em foco (layout do workspace)
/d/$designId/ajustes      → painel de props
/d/$designId/camadas      → estrutura e camadas
/d/$designId/versoes      → versões, comparar, histórico
/d/$designId/comentarios  → modo comentar, pinos e threads
/d/$designId/codigo       → repositório, mapa telas ↔ arquivos
/d/$designId/editar       → modo editar (trilha, alças, barra flutuante)
/d/$designId/editar/texto | cor | layout | estrutura → painéis do modo editar
/d/$designId/apresentar   → tela cheia
/d/$designId/exportar     → exportar (formatos, escopo, dimensões)
/d/$designId/compartilhar → link público e permissões
/design-system            → meus sistemas, biblioteca, preview
```

## Comportamento

- O painel direito deixa de abrir por padrão: `/d/$designId` mostra só o palco. Um painel aparece quando o usuário clica no botão correspondente, e a URL muda junto.
- Clicar de novo no mesmo botão fecha o painel (volta para `/d/$designId`).
- Abas de arquivos viram links: trocar de aba navega para `/d/<outro-id>`.
- Exportar, compartilhar e design system continuam como modal, mas com rota própria — abrem ao navegar e fecham voltando para a rota pai.
- Apresentar e modo editar são rotas de tela cheia / overlay, montadas só quando acionadas.
- Cada rota tem `head()` próprio (título e descrição em PT-BR) para links compartilháveis.

## Detalhes técnicos

- Layout do workspace em `src/routes/d.$designId.tsx` (TopBar + LibrarySidebar + Stage + `<Outlet />`), com folhas para cada painel; `d.$designId.index.tsx` renderiza nada no slot lateral.
- `EstudioProvider` sobe para `src/routes/__root.tsx` para preservar estado entre navegações; `abaAtiva`, `painelDireito`, `modoEditar` e `apresentando` saem do contexto e passam a derivar da URL (`params`/`pathname`).
- Painéis existentes (`RightPanel`, `EditPanels`, `Dialogs`, `PresentMode`) são divididos em componentes por área e importados pelas rotas folha — sem reescrever a UI.
- Navegação sempre com `<Link to params>`; nenhum `<a href>` interpolado.
- Segue sem backend e sem persistência.

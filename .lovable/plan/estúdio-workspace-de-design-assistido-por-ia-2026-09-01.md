# Estúdio — workspace de design assistido por IA

Implementação completa do wireframe `Wireframe Estudio.dc.html` (áreas 1a–1o) como interface de produto acabada, em português (BR), funcionando como protótipo clicável com estado local (sem backend).

Observação: o conector claude_design não está ligado neste projeto, então a implementação usa o arquivo enviado no chat — que contém o mesmo desenho referenciado no link.

## O que será construído

Um workspace de tela cheia em `/`, com todas as áreas do wireframe:

```text
┌─ topo: projeto ▾ · renomear · trocar   |   compartilhar · exportar · conta ─┐
│ biblioteca  │  abas de arquivos abertos                    [+]             │
│ (busca,     │ ┌──────────── palco de preview ────────────┐   painel        │
│  filtros,   │ │      arquivo em foco / modo editar       │   lateral       │
│  grid de    │ └──────────────────────────────────────────┘   (ajustes,     │
│  designs,   │  barra: zoom · viewport · ferramentas · Editar   camadas,    │
│  novo)      │                                                  comentários)│
├─────────────┴──────────── compositor + fluxo da conversa ──────────────────┤
```

### Áreas cobertas

- **Shell (1a)** — barra de projeto, biblioteca lateral de designs (busca, filtros recentes/favoritos/tipo, abrir, duplicar, novo), abas de arquivos, palco, barra do palco.
- **Compositor (1b)** — chips de contexto anexado, campo de pedido, anexar/skill/modelo, enviar/parar.
- **Conversa (1c)** — pedido do usuário, lista de tarefas ao vivo, formulário de perguntas (opções, slider, "decide você"), card de arquivo gerado, ações da resposta.
- **Palco (1d)** — abas reordenáveis, recarregar, pan/zoom/régua/grade, tela cheia, viewport mobile/tablet/desktop, botão Editar.
- **Modo editar (1e–1i)** — trilha de ancestrais, etiqueta do elemento, alças e medidas, barra flutuante, e painéis de texto/tipografia, cor/preenchimento, layout/espaçamento, estrutura/camadas.
- **Ajustes (1j)** — props expostas: textos, toggles, sliders com unidade, variantes, restaurar padrão.
- **Arquivos e versões (1k)** — árvore do projeto, versões lado a lado, comparar/duplicar/restaurar, histórico.
- **Comentários (1l)** — modo comentar, pinos ancorados, threads, filtro abertos/resolvidos.
- **Exportar e compartilhar (1m)** — formatos, escopo, dimensões, link público com permissões.
- **Design system (1n)** — meus sistemas, biblioteca, preview, cores/tipografia/logo/componentes.
- **Código (1o)** — repositório, pasta local, mapa telas ↔ arquivos, sincronizar/diferenças/handoff.

## Comportamento (protótipo clicável)

Estado em React, dados fictícios em memória: abrir/fechar/fixar abas, alternar filtros e viewport, entrar e sair do modo editar com seleção de elemento, abrir painéis e modais, enviar um pedido no compositor e receber uma resposta simulada com tarefas e card de arquivo, criar e resolver comentários. Nada persiste ao recarregar.

## Direção visual

Produto acabado, não wireframe: base clara quente (papel #f7f6f3), tinta quase-preta, um acento único, cantos suaves, densidade de ferramenta profissional (linhas finas, tipos pequenos, muita hierarquia). Tokens semânticos em `src/styles.css`; ícones Lucide; nada de roxo genérico ou gradientes de landing page.

## Detalhes técnicos

- Rota única `src/routes/index.tsx` (o workspace substitui o placeholder), com `head()` próprio (título/descrição/OG em PT-BR).
- Componentes em `src/components/estudio/`: `TopBar`, `LibrarySidebar`, `FileTabs`, `Stage`, `StageBar`, `Composer`, `ConversationFlow`, `EditToolbar`, painéis `TextPanel`/`ColorPanel`/`LayoutPanel`/`LayersPanel`, `PropsPanel`, `VersionsPanel`, `CommentsLayer`, `ExportDialog`, `DesignSystemDialog`, `CodeSyncPanel`.
- Estado central num hook `useEstudio` (React state + context), com dados mock em `src/lib/estudio-mock.ts`.
- shadcn/ui para dialog, tabs, popover, slider, tooltip, dropdown; tudo com tokens do design system.
- Sem backend, sem persistência, sem chamadas de rede.

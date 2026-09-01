# Palco vivo: cada controle escreve no documento

Nenhuma rota, modal, página ou mock novo. Só ligar o que já existe em `src/components/estudio` ao estado.

## Documento do design

O artboard deixa de ser JSX fixo e vira um objeto por design no `EstudioContext`:
título, subtítulo, CTA, lista de logos, prova social ligada/desligada, variante
(Calmo / Produto / Ousado), fonte, peso, tamanho, entrelinha, alinhamento, cores
(texto, fundo, borda), opacidade, gap, padding, raio, borda, sombra, densidade,
herói em tela cheia.

`Stage.tsx` passa a renderizar a partir desse objeto. A variante troca composição
de verdade (ordem, proporção do herói, presença da faixa de prova social), não só
o botão ativo.

## Painéis que realmente editam

- `TextPanel`: textarea escreve no campo do elemento selecionado; fonte, peso,
  tamanho, caixa, alinhamento, entrelinha e entre letras pintam no palco.
- `ColorPanel`: alvo (texto/fundo/borda) + paleta + amostra livre + opacidade
  aplicam no elemento selecionado.
- `LayoutPanel`: direção, gap, padding, largura, borda, raio e sombra aplicam na
  seção selecionada; trazer à frente / enviar para trás reordena.
- `PropsPanel`: título, CTA, nº de logos, prova social, tela cheia, densidade e
  variante escrevem no documento.
- `LayersPanel`: selecionar camada muda `selecionado`, o overlay do palco mede o
  elemento real e o painel mostra o texto daquele alvo; olho oculta, cadeado
  bloqueia edição, lixeira remove, inserir bloco insere.
- Overlay: alças posicionadas sobre o elemento selecionado de fato; Duplicar
  clona o bloco, Excluir remove, "Pedir ao assistente" envia um pedido pré-preenchido
  para a conversa com o alvo como contexto.

## Conversa que aplica

`enviarPedido` interpreta o texto (palavras-chave de cor, título, CTA, variante,
prova social, densidade, tipografia), executa passo a passo com timers reais e:

1. marca cada tarefa como feita só depois do passo acontecer;
2. aplica a mudança no documento do design aberto;
3. cria uma versão nova na lista (`v8`, `v9`, …) com o snapshot do documento;
4. só então escreve a resposta na thread.

"Parar" cancela os timers pendentes e encerra a tarefa em curso como interrompida.
Os chips de contexto entram na decisão (design system ativo define a paleta usada;
chip de arquivo define o alvo). Botões da mensagem: Editar recarrega o texto no
compositor, Reenviar refaz o pedido, Copiar usa a área de transferência, Refazer
reexecuta gerando outra versão, Comentar cria um pino, Ramificar duplica o design
a partir daquele estado.

## Versões, exportar, compartilhar, código

- Versões guardam snapshots; comparar mostra as diferenças entre dois estados,
  restaurar devolve o palco àquele snapshot, duplicar clona o modelo em um novo design.
- Exportar baixa o artboard atual como HTML (e PNG via canvas quando possível),
  respeitando escopo e dimensões escolhidos.
- Compartilhar gera o link da rota atual e copia para a área de transferência.
- Código lista os arquivos reais deste repositório (`src/components/estudio/Stage.tsx`,
  `EditPanels.tsx`, `EstudioContext.tsx`, `ChatPane.tsx`, `RightPanel.tsx`, rotas
  `src/routes/d.$designId*`), com o mapa tela ↔ arquivo verdadeiro.
- Recarregar (barra de abas) recarrega o documento do armazenamento; Abrir em nova
  janela abre a rota em outra aba.

## Persistência

Documentos, versões, abas, comentários e conversa vão para `localStorage`
(`estudio:v1`), com hidratação após montagem para não quebrar o SSR. Recarregar a
página mantém o design.

## Supabase self-hosted

- Instalar `@supabase/supabase-js`.
- Criar `src/lib/supabase.ts` com `createClient(import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: true,
  autoRefreshToken: true, detectSessionInUrl: true } })`.
- Registrar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env` do projeto e
  tipar em `ImportMetaEnv`.
- Sem projeto Cloud novo, sem `service_role`, sem uso de admin no frontend. Neste
  turno o cliente fica disponível e a persistência do estúdio segue em
  `localStorage`; a migração das tabelas para o self-hosted (com RLS por usuário)
  entra num passo seguinte, quando você definir o esquema.

## Detalhes técnicos

- `EstudioContext` ganha `documentos: Record<designId, DesignDoc>`, `atualizarDoc`,
  `selecionarElemento`, `versoesPorDesign`, `restaurarVersao`, `snapshot()`.
- Painéis trocam `useState`/`defaultValue` por valores controlados vindos do contexto.
- Nenhum arquivo de rota novo; `estudio-mock.ts` só perde o que virar estado real.

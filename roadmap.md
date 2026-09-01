
## Painel direito por rota (2026-09-01)
- [x] painelDireito derivado só da URL /d/{id}/<painel>
- [x] modoEdicao não força "props"
- [x] Editar não seleciona "titulo" em canvas nem abre Ajustes
- [x] abrir/criar design cai em /d/{id} com lados fechados
- [x] PropsPanel canvas: aviso ou campos da camada
- [x] trilho: ativo só pela rota; reclique fecha

## Handles + imagem no placeholder (2026-09-01)
- [ ] cover/contain: imagem nunca achatada (upload, resize, seeds)
- [ ] modo recorte: arrastar e zoom da foto dentro da moldura
- [ ] alças com hit area 20px, cursor por posição, alça de rotação isolada
- [ ] rotação no modelo (`rotacao`) + inspector Pro
- [ ] alças também no texto
- [ ] ícone de "virar placeholder" trocado (sai o Frame/grid)

## Canvas ↔ preview HTML real (pedido 2026-09-01 16:46)
- [ ] rota que renderiza o canvas como HTML real (mesmas camadas/posições)
- [ ] gravar cada versão do canvas na tabela de versões com o HTML correspondente
- [ ] canvas/inspector gravando direto no banco e refletindo na página real
- [ ] preview HTML com mesmo texto, fontes e cores do palco
- [ ] placeholder com imagem atualiza o preview HTML
- [ ] Exportar PNG deve baixar a imagem do canvas (não o doc de fluxo)

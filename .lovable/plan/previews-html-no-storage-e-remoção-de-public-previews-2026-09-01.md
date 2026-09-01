# Previews html no Storage e remoção de public/previews

## O que muda

1. `src/lib/estudio-doc.ts` — em `previewsHtml`, os dois `src` passam a apontar para o bucket `templates`:
   - barretos: `https://sites-blank-editor-supabase.ickanz.easypanel.host/storage/v1/object/public/templates/barretos/index.html`
   - agrum: `https://sites-blank-editor-supabase.ickanz.easypanel.host/storage/v1/object/public/templates/agrum-eleicao/index.html`
2. Apagar `public/previews` por completo (os dois `index.html`, `assets/` e `fonts/` das duas pastas).

## O que não muda

- Nenhuma rota nova, nenhuma tela removida.
- Novo design canvas continua vindo de `estudio-canvas-seeds.ts` (JSON no código).
- Designs html já salvos no banco com `src` `/previews/...` ficam como estão neste turno.
- `src/styles.css` já carrega as fontes do Storage; nada a fazer lá.

## Observação

Os dois `index.html` precisam existir no bucket `templates` (público) nesses caminhos, senão o iframe fica vazio depois da remoção local.

# Apontar os assets dos previews para o Storage

Trocar todos os caminhos locais `/previews/...` por URLs públicas do Supabase self-hosted, mantendo `public/previews` no repositório.

## Base das URLs

```text
https://sites-blank-editor-supabase.ickanz.easypanel.host/storage/v1/object/public/templates
```

- `/previews/<pasta>/assets/<arquivo>` → `.../templates/<pasta>/<arquivo>` (sem o segmento `assets`)
- `/previews/<pasta>/fonts/<arquivo>` → `.../templates/<pasta>/fonts/<arquivo>`

## O que muda

1. `src/lib/estudio-canvas-seeds.ts` — 46 ocorrências de `src` de imagem (barretos e agrum-eleicao) passam a usar a URL do Storage.
2. `public/previews/barretos/index.html` e `public/previews/agrum-eleicao/index.html` — `src` das imagens e `url(...)` das `@font-face` apontam para o Storage.
3. `src/styles.css` — as quatro `@font-face` dos previews (Anicon Sans e NYT Franklin) passam a carregar de `.../templates/agrum-eleicao/fonts/<arquivo>`.

Os arquivos em `public/previews` continuam no repositório; nada é apagado.

## Observação

As URLs só funcionam se o bucket `templates` estiver público e já contiver os arquivos nesses caminhos. Se algum asset ainda não estiver lá, a imagem/fonte fica quebrada até o upload.

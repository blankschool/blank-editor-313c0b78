# Apagar os templates do Storage

Os cards "Ganhar Dinheiro", "Agrum Eleição" e "Barretos" não são designs do banco — por isso continuaram na tela depois da limpeza. Eles vêm do catálogo `templates/manifest.json` no bucket público do seu Supabase self-hosted.

## O que será feito

1. Listar o que existe hoje no bucket `templates` (manifesto, pastas dos slugs, `doc.json` e imagens de cada template).
2. Apagar os arquivos de cada template listado no manifesto.
3. Substituir `manifest.json` por uma lista vazia (`[]`), para o app não voltar a mostrar nada e o importador continuar funcionando ao adicionar templates novos.
4. Conferir na Home: a seção "Começar" fica só com "Canvas em branco", e o menu "Novo design" na Biblioteca também sem templates.

## Detalhes técnicos

- Bucket: `templates` em `https://sites-blank-editor-supabase.ickanz.easypanel.host/storage/v1/object/public/templates`.
- A remoção usa a sessão autenticada no preview + chave publishable (`supabase.storage.from("templates").remove([...])` e `.upload("manifest.json", "[]", { upsert: true })`). Nada de service_role no frontend.
- Se as políticas de Storage não permitirem escrita/remoção com a sua conta, eu paro e te passo o SQL/policy exata a aplicar no Supabase — sem contornar com chave secreta.
- Nenhuma mudança de código de app: `carregarCatalogoTemplates` já trata catálogo vazio retornando lista vazia.

## Aviso

A operação é irreversível: os `doc.json` e imagens dos três templates somem do bucket. Designs já criados a partir deles (se houver algum no futuro) não são afetados, pois guardam o próprio documento no banco.

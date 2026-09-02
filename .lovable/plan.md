# Apagar todos os designs

Limpeza única, sem mudança de código.

## O que vou fazer

1. Rodar a exclusão no preview usando a sua sessão já logada: listar todos os designs visíveis e apagar um a um pela tabela `designs`.
2. Versões, mensagens e comentários somem junto — as tabelas têm `on delete cascade` no `design_id` (e as respostas em cascata do comentário).
3. Conferir depois que a contagem de designs voltou zero e recarregar a Biblioteca/Home.

## Sobre "todos os usuários"

O RLS de `designs` só permite `owner = auth.uid()`, e o frontend nunca usa `service_role`. Pela sessão do browser eu consigo apagar apenas os designs da sua conta.

Para limpar também os designs de outras contas, rode este SQL no SQL editor do seu Supabase self-hosted (privilégio total, ignora RLS):

```sql
delete from public.designs;
-- opcional, se quiser zerar também os projetos:
-- delete from public.projects;
```

Isso remove em cascata `versions`, `messages`, `comments` e `replies`.

## Fora do escopo

- Nenhuma alteração em rotas, componentes ou schema.
- Templates e arquivos no Storage ficam intactos.
- Ação irreversível: não há lixeira nem backup automático.

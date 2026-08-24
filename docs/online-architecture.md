# Arquitetura online

## Componentes

- **Vercel:** aplicação Next.js, páginas, autenticação SSR e APIs leves;
- **Supabase Auth:** contas e sessões;
- **Supabase Postgres:** projetos, ativos, variantes e fila de render;
- **Supabase Storage:** vídeos originais, proxies e resultados em bucket privado;
- **OpenAI:** transcrição em português e timestamps das legendas;
- **Worker FFmpeg:** processo separado que consome a fila e grava os resultados;
- **GitHub:** fonte, revisão, CI e integração de previews com a Vercel.

## Por que o render é separado

Uploads e renders longos não devem permanecer dentro de uma requisição comum da Vercel. O navegador envia o vídeo diretamente ao Supabase Storage, a aplicação cria os jobs e um worker com FFmpeg executa cada variante. Assim, uma frase com três vídeos gera três jobs; três frases com três vídeos geram nove jobs.

## Fluxo de produção

1. usuário autentica;
2. navegador cria projeto;
3. vídeo é enviado diretamente ao bucket privado `video-assets`;
4. metadata é registrada em `media_assets`;
5. cada frase cria uma `creative_variant`;
6. cada combinação cria um `render_job`;
7. worker reserva um job, baixa a mídia e executa FFmpeg;
8. resultado é enviado ao Storage e o job vira `completed`;
9. interface acompanha progresso e libera download por URL assinada.

## Segurança

- `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY` e `RENDER_WORKER_SECRET` são somente do servidor;
- frontend recebe apenas a URL e a chave publicável do Supabase;
- tabelas usam RLS por `user_id`;
- vídeos ficam em bucket privado, separados por pasta de usuário;
- service/secret key nunca é enviada ao navegador;
- URLs de download devem ser assinadas e expirar;
- arquivos devem ter política de retenção configurável.

## Limite do primeiro MVP

A interface local já aceita vídeos, múltiplas frases e mostra todas as combinações. Para ativar persistência e render online ainda é necessário criar/conectar um projeto Supabase, aplicar `supabase/schema.sql`, criar o bucket privado e publicar um worker FFmpeg.

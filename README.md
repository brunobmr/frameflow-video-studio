# Frameflow Video Studio

Aplicação orientada a modelos para transformar um ou vários vídeos em variações de criativos, com afirmações, legendas, cortes assistidos e render em lote.

## Estado atual

O estúdio visual já permite:

- importar um ou vários vídeos MP4/MOV/WebM;
- visualizar o primeiro vídeo diretamente no layout 9:16;
- selecionar o modelo aprovado de afirmação superior;
- cadastrar, duplicar e excluir várias frases;
- visualizar cada frase sobre o vídeo;
- ativar/desativar a prévia das legendas;
- preservar os padrões validados no teste local;
- gerar a matriz de jobs: `vídeos × frases`.
- renderizar as variações no próprio navegador em 1080 × 1920;
- preservar o áudio original e baixar cada resultado em WebM.
- transcrever em português e gravar legendas de até duas linhas;
- detectar e remover pausas superiores a 0,5 segundo;
- permitir exportação com ou sem o áudio original.

Padrão inicial:

- saída `1080 × 1920`, proporção 9:16;
- afirmação com fonte equivalente a 58 px em `y = 340 px`;
- áudio original, sem música;
- legendas em português, até duas linhas, brancas com contorno preto;
- pausas/respirações sugeridas somente acima de 0,5 segundo;
- revisão humana antes de aplicar cortes.

## Executar localmente

Requisitos: Node.js 22+ e pnpm.

```bash
pnpm install
pnpm dev
```

Abra `http://localhost:3000`.

Verificações:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Arquitetura de produção

- **Next.js + Vercel:** interface e APIs leves;
- **Supabase Auth:** contas e sessões;
- **Supabase Postgres:** projetos, mídias, variantes e jobs;
- **Supabase Storage:** vídeos e resultados privados;
- **OpenAI:** transcrição e timestamps das legendas;
- **Worker FFmpeg:** render pesado fora das requisições da Vercel;
- **GitHub:** versionamento, CI e previews conectados à Vercel.

Leia [a arquitetura online](docs/online-architecture.md) e [a especificação do modelo](docs/templates/lofi-afirmacao-superior.md).

## Configuração

Copie `.env.example` para `.env.local` e preencha apenas os serviços ativados. Nunca exponha `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY` ou `RENDER_WORKER_SECRET` no navegador.

Para ativar o Supabase:

1. criar um projeto;
2. aplicar e revisar `supabase/schema.sql`;
3. criar o bucket privado `video-assets` pelo Dashboard/API;
4. configurar URL e chave publicável;
5. executar os advisors de segurança e desempenho;
6. conectar o repositório à Vercel.

## Estrutura

```text
app/                 páginas, estilos e endpoints Next.js
components/          estúdio, prévia, frases e fila
lib/                 regras do editor e clientes Supabase
supabase/schema.sql  modelo de dados e RLS
scripts/             utilitários de legendas
docs/                decisões, testes e arquitetura
.github/workflows/   CI para typecheck, lint e build
```

## Próximas entregas

1. conectar um projeto Supabase real;
2. implementar login e persistência de projetos;
3. enviar arquivos diretamente ao Storage;
4. criar editor manual para revisar os timestamps das legendas;
5. publicar o worker FFmpeg e acompanhar progresso;
6. ativar downloads por URLs assinadas;
7. publicar previews pela integração GitHub–Vercel.

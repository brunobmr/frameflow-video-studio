# Modelo 01 — Lofi com afirmação superior

## Objetivo

Transformar um vídeo falado em um Reel vertical com uma afirmação fixa ou editável na parte superior, seguindo as duas referências fornecidas em 24/08/2026.

## Tela de saída

- resolução: `1080 x 1920 px`;
- proporção: `9:16`;
- orientação: vertical;
- vídeo preenche todo o quadro;
- exportação inicial: MP4, H.264 e AAC;
- FPS: preservar o original quando compatível; caso contrário, normalizar para 30 FPS.

## Composição visual

### Vídeo principal

- preenchimento em modo `cover`, sem barras laterais;
- crop central ajustável pelo usuário;
- rosto preferencialmente no centro horizontal;
- não ampliar além do necessário para preencher 9:16;
- preservar a região inferior para eventuais legendas futuras.

### Afirmação superior

- posição: centralizada horizontalmente;
- posição vertical padrão: aproximadamente `14%` da altura (`270 px` em 1080 x 1920), dentro da faixa superior segura;
- largura máxima: `84%` da tela (`907 px`);
- altura automática conforme o texto;
- caixa branca com cantos arredondados;
- texto preto, centralizado e em negrito/semi-negrito;
- fonte inicial: sans-serif semelhante a Arial/Inter;
- tamanho inicial: `58 px`, com redução automática até `40 px` quando necessário para preservar margens e não cobrir o rosto;
- entrelinha: `1.05–1.15`;
- padding horizontal: `28 px`;
- padding vertical: `14 px`;
- até três linhas;
- emojis permitidos;
- sem animação no MVP; entrada/saída suave poderá ser adicionada depois.

O texto não deverá ficar atrás dos elementos de interface do Instagram. A posição será configurável, mas limitada à área segura.

## Texto

No primeiro protótipo, a afirmação será digitada manualmente. Depois, o sistema poderá sugerir uma frase a partir da transcrição.

Texto definido para o primeiro teste: **“Esse vídeo é pra você petista”**.

Campos editáveis:

- conteúdo;
- fonte;
- tamanho;
- cor do texto;
- cor e opacidade da caixa;
- posição vertical;
- largura máxima;
- alinhamento.

## Cortes de fala

- limiar inicial: remover somente pausas/respirações com duração superior a `500 ms`;
- manter uma margem curta antes e depois da fala para não cortar fonemas;
- aplicar microfades no áudio para evitar estalos;
- apresentar todos os cortes como sugestões revisáveis;
- não aplicar automaticamente cortes com baixa confiança;
- distinguir silêncio mensurável de respiração detectada — são eventos diferentes.

O valor de `500 ms` será configurável por projeto. A detecção será validada com o vídeo real antes de ser usada em lote.

## Legendas

Legendas não fazem parte da identidade visual principal deste primeiro modelo, mas a arquitetura deverá permitir ativá-las. Quando ativas, ocuparão a metade inferior, sem competir com a afirmação superior.

Padrão inicial validado:

- transcrição em português com timestamps por palavra;
- blocos de até duas linhas e aproximadamente sete palavras;
- duração máxima desejada de 2,6 segundos por bloco;
- fonte Arial em negrito;
- texto branco com contorno preto;
- alinhamento central na faixa inferior segura;
- arquivo SRT preservado para revisão e reutilização;
- texto incorporado ao vídeo apenas no render final.

## Áudio do primeiro teste

- preservar somente o áudio original do vídeo;
- não adicionar música;
- aplicar apenas os ajustes necessários nos pontos de corte.

## Controles do primeiro protótipo

1. selecionar o vídeo;
2. editar a afirmação;
3. reposicionar/enquadrar o vídeo;
4. ativar ou desativar cortes sugeridos;
5. visualizar antes/depois;
6. exportar em 1080 x 1920.

## Critérios de aceite

- a caixa superior não cobre o rosto nos vídeos de teste;
- o texto permanece legível em até três linhas;
- o crop não deforma o vídeo;
- nenhum corte remove partes audíveis de palavras;
- áudio e vídeo permanecem sincronizados;
- o arquivo exportado tem exatamente 1080 x 1920 px;
- a composição se mantém dentro das áreas seguras do Reel.

## Decisões ainda pendentes

- texto permanece durante todo o vídeo ou tem intervalo configurável;
- fonte definitiva da identidade visual;
- inclusão de legendas em versões posteriores;
- inclusão opcional de música em versões posteriores.

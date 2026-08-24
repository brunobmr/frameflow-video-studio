# Teste 01 — Lofi com afirmação superior

## Entrada

- arquivo: `WhatsApp Video 2026-08-24 at 10.31.52.mp4`;
- duração: 50,13 s;
- vídeo: H.264, 576 x 1024, aproximadamente 30 FPS;
- áudio: AAC, 44,1 kHz, estéreo;
- proporção original: 9:16.

## Configuração

- saída: 1080 x 1920, 30 FPS;
- afirmação: “Esse vídeo é pra você petista”;
- áudio original, sem música;
- sem legendas;
- primeiro render sem cortes automáticos.

## Pausas candidatas acima de 500 ms

Detecção inicial com limiar de -35 dB:

| Início | Fim | Duração |
|---:|---:|---:|
| 10,811 s | 11,326 s | 514 ms |
| 32,358 s | 32,859 s | 502 ms |
| 46,025 s | 46,549 s | 524 ms |
| 48,018 s | 48,554 s | 536 ms |

Esses intervalos são candidatos a silêncio, não uma classificação definitiva de respiração. Devem ser ouvidos/revisados antes de gerar a versão com cortes.

## Resultado

- arquivo: `outputs/teste-lofi-afirmacao.mp4`;
- duração: 50,13 s;
- tamanho: 28.617.042 bytes;
- vídeo: H.264, 1080 x 1920, 30 FPS;
- áudio: AAC, 44,1 kHz, estéreo.

## Revisão 02

- fonte aumentada de 48 px para 58 px;
- faixa deslocada para `y = 270 px`, aproximadamente 14% da altura;
- padding aumentado para 26 px;
- primeira versão preservada para comparação;
- resultado: `outputs/teste-lofi-afirmacao-v2.mp4`.

## Revisão 03 — posição aprovada

- afirmação deslocada para `y = 340 px`;
- resultado: `outputs/teste-lofi-afirmacao-v3.mp4`.

## Revisão 04 — legendas

- transcrição em português com 155 palavras e timestamps individuais;
- revisão por um segundo modelo para corrigir “ações que fazem”;
- 23 blocos de legenda em até duas linhas;
- texto branco em negrito, contorno preto e posição inferior segura;
- SRT: `outputs/legendas-teste-01.srt`;
- vídeo: `outputs/teste-lofi-afirmacao-legendas-v1.mp4`.

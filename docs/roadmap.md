# Roadmap de validação

## Fase 0 — definição com material real

Resultado: três modelos especificados com exemplos, medidas e opções editáveis.

- reunir vídeos e referências;
- definir resolução, proporções, fontes, cores e safe areas;
- listar quais campos mudam por vídeo e quais pertencem ao modelo;
- medir duração e volume típicos dos lotes;
- escolher o comportamento de cortes e legendas em casos ambíguos.

## Fase 1 — protótipo técnico

Resultado: um vídeo entra e um MP4 composto sai.

- validar FFmpeg empacotado no Windows;
- obter metadados com FFprobe;
- gerar proxy e thumbnail;
- renderizar o modelo de tela dividida;
- exibir progresso e erros de render.

## Fase 2 — editor utilizável

Resultado: projeto salvo, prévia e ajustes básicos.

- criar/abrir/salvar projeto;
- trocar mídias do modelo;
- ajustar crop, posição e escala;
- configurar texto, fonte, cor e fundo;
- desfazer/refazer operações;
- exportar em 9:16 e 16:9.

## Fase 3 — automação de fala

Resultado: legenda editável e cortes sugeridos.

- transcrever com timestamps por palavra;
- segmentar e quebrar legendas por regras de leitura;
- detectar silêncio por energia/duração;
- classificar possíveis respirações separadamente;
- permitir revisão rápida e comparação antes/depois;
- aplicar fades curtos para evitar estalos nos cortes.

## Fase 4 — produção em massa

Resultado: executar o mesmo preset sobre vários itens com segurança.

- importar pasta/planilha de entradas;
- validar arquivos antes de iniciar;
- limitar renders simultâneos conforme CPU/GPU/RAM;
- pausar, cancelar e retomar;
- repetir apenas itens com falha;
- gerar relatório final com caminhos e mensagens de erro.

## Riscos a testar cedo

- diferenças entre prévia do navegador e render do FFmpeg;
- qualidade da detecção de respiração em música ou ambientes ruidosos;
- fontes e emojis inconsistentes no computador do usuário;
- vídeos com FPS variável, rotação por metadata ou áudio dessincronizado;
- consumo de disco por proxies e renders temporários;
- aceleração de hardware diferente entre máquinas.

## Primeira sprint sugerida

1. validar a especificação do modelo lofi com afirmação superior usando o vídeo fornecido;
2. criar o esqueleto Tauri + React;
3. implementar importação e FFprobe;
4. implementar o render 9:16 com afirmação superior via FFmpeg;
5. mostrar progresso, cancelar e abrir o arquivo exportado;
6. testar com os exemplos reais e registrar tempos/erros.

Ao final da sprint, devemos ter uma demonstração de ponta a ponta, mesmo que o layout ainda seja fixo. Isso reduz o principal risco técnico antes de investir na interface completa.

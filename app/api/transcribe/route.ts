export const runtime = "nodejs";
export const maxDuration = 60;

type WhisperWord = { start?: number; end?: number; word?: string };

function buildCues(words: WhisperWord[]) {
  const cues: Array<{ start: number; end: number; text: string }> = [];
  let group: Array<{ start: number; end: number; word: string }> = [];

  const flush = () => {
    if (!group.length) return;
    cues.push({ start: group[0].start, end: group[group.length - 1].end, text: group.map((item) => item.word).join(" ") });
    group = [];
  };

  for (const item of words) {
    if (typeof item.start !== "number" || typeof item.end !== "number" || !item.word?.trim()) continue;
    const word = item.word.trim();
    const candidate = [...group, { start: item.start, end: item.end, word }];
    const candidateText = candidate.map((part) => part.word).join(" ");
    if (group.length && (candidate.length > 7 || candidateText.length > 44)) flush();
    group.push({ start: item.start, end: item.end, word });
    if (/[.!?…]$/.test(word)) flush();
  }
  flush();
  return cues;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "Transcrição ainda não configurada." }, { status: 503 });

  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Selecione um vídeo válido." }, { status: 400 });
  if (file.size > 24 * 1024 * 1024) return Response.json({ error: "O arquivo deve ter no máximo 24 MB para transcrição." }, { status: 413 });

  const body = new FormData();
  body.append("file", file, file.name);
  body.append("model", "whisper-1");
  body.append("language", "pt");
  body.append("response_format", "verbose_json");
  body.append("timestamp_granularities[]", "word");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
  });

  if (!response.ok) {
    const failure = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return Response.json({ error: failure?.error?.message ?? "Não foi possível transcrever o vídeo." }, { status: response.status });
  }

  const transcription = await response.json() as { text?: string; words?: WhisperWord[] };
  const words = transcription.words ?? [];
  const cues = buildCues(words);
  const pauses = words.slice(1).flatMap((word, index) => {
    const previous = words[index];
    if (typeof previous.end !== "number" || typeof word.start !== "number") return [];
    return word.start - previous.end > 0.5 ? [{ start: previous.end, end: word.start }] : [];
  });

  return Response.json({ text: transcription.text ?? "", cues, pauses });
}

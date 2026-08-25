import { approvedLofiSettings } from "./editor";

type CapturableVideo = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

export type CaptionCue = { start: number; end: number; text: string };
export type PauseRange = { start: number; end: number };
export type RenderOptions = {
  captions: CaptionCue[];
  pauses: PauseRange[];
  preserveAudio: boolean;
};

function waitForEvent(target: EventTarget, event: string) {
  return new Promise<void>((resolve, reject) => {
    const onEvent = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("Não foi possível ler o vídeo selecionado.")); };
    const cleanup = () => {
      target.removeEventListener(event, onEvent);
      target.removeEventListener("error", onError);
    };
    target.addEventListener(event, onEvent, { once: true });
    target.addEventListener("error", onError, { once: true });
  });
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

function instagramClassicFont() {
  return getComputedStyle(document.body).getPropertyValue("--font-instagram-classic").trim() || "Arial, sans-serif";
}

function drawCaption(context: CanvasRenderingContext2D, cue?: CaptionCue) {
  if (!cue) return;
  const { width, height } = context.canvas;
  context.font = "700 50px Arial, Helvetica, sans-serif";
  const lines = wrapText(context, cue.text, width - 180).slice(0, 2);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.lineWidth = 10;
  context.strokeStyle = "rgba(0,0,0,.92)";
  context.fillStyle = "white";
  const lineHeight = 62;
  const startY = height - 350 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    context.strokeText(line, width / 2, y);
    context.fillText(line, width / 2, y);
  });
}

function drawFrame(context: CanvasRenderingContext2D, video: HTMLVideoElement, phrase: string, captions: CaptionCue[]) {
  const { width, height } = context.canvas;
  const videoRatio = video.videoWidth / video.videoHeight;
  const canvasRatio = width / height;
  let sourceWidth = video.videoWidth;
  let sourceHeight = video.videoHeight;
  let sourceX = 0;
  let sourceY = 0;
  if (videoRatio > canvasRatio) {
    sourceWidth = video.videoHeight * canvasRatio;
    sourceX = (video.videoWidth - sourceWidth) / 2;
  } else {
    sourceHeight = video.videoWidth / canvasRatio;
    sourceY = (video.videoHeight - sourceHeight) / 2;
  }
  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);

  const maxTextWidth = width - 160;
  let fontSize = approvedLofiSettings.headlineFontSize;
  let lines: string[] = [];
  do {
    context.font = `700 ${fontSize}px ${instagramClassicFont()}`;
    lines = wrapText(context, phrase, maxTextWidth - 56);
    if (lines.length > 3) fontSize -= 2;
  } while (lines.length > 3 && fontSize > 38);

  const lineHeight = Math.round(fontSize * 1.13);
  const textWidth = Math.max(...lines.map((line) => context.measureText(line).width));
  const boxWidth = Math.min(maxTextWidth, textWidth + 56);
  const boxHeight = lines.length * lineHeight + 34;
  const boxX = (width - boxWidth) / 2;
  const boxY = approvedLofiSettings.headlineY - boxHeight / 2;
  context.fillStyle = "rgba(255,255,255,0.96)";
  context.beginPath();
  context.roundRect(boxX, boxY, boxWidth, boxHeight, 24);
  context.fill();
  context.fillStyle = "#0a0a0a";
  context.textAlign = "center";
  context.textBaseline = "middle";
  lines.forEach((line, index) => context.fillText(line, width / 2, boxY + 17 + lineHeight / 2 + index * lineHeight));
  drawCaption(context, captions.find((cue) => video.currentTime >= cue.start && video.currentTime <= cue.end));
}

function supportedMimeType() {
  return ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
    .find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

export async function extractAudioForTranscription(file: File, onProgress: (progress: number) => void) {
  const video = document.createElement("video") as CapturableVideo;
  const sourceUrl = URL.createObjectURL(file);
  video.src = sourceUrl;
  video.preload = "auto";
  video.playsInline = true;
  video.muted = true;
  try {
    await waitForEvent(video, "loadedmetadata");
    const capture = video.captureStream ?? video.mozCaptureStream;
    if (!capture) throw new Error("Use Chrome ou Edge atualizado para preparar as legendas.");
    await video.play();
    const audioTracks = capture.call(video).getAudioTracks();
    if (!audioTracks.length) throw new Error("O vídeo não possui uma faixa de áudio reconhecível.");
    const audioStream = new MediaStream(audioTracks);
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
    const recorder = new MediaRecorder(audioStream, { mimeType, audioBitsPerSecond: 64_000 });
    const chunks: BlobPart[] = [];
    recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
    const stopped = new Promise<Blob>((resolve, reject) => {
      recorder.addEventListener("stop", () => resolve(new Blob(chunks, { type: mimeType })));
      recorder.addEventListener("error", () => reject(new Error("Não foi possível preparar o áudio para transcrição.")));
    });
    const updateProgress = () => {
      onProgress(Math.min(99, Math.round((video.currentTime / video.duration) * 100) || 0));
      if (!video.ended) requestAnimationFrame(updateProgress);
    };
    recorder.start(1000);
    updateProgress();
    await waitForEvent(video, "ended");
    recorder.stop();
    const blob = await stopped;
    audioStream.getTracks().forEach((track) => track.stop());
    onProgress(100);
    return blob;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function renderVideoVariant(
  file: File,
  phrase: string,
  options: RenderOptions,
  onProgress: (progress: number) => void,
) {
  if (typeof MediaRecorder === "undefined") throw new Error("Use Chrome ou Edge atualizado para exportar.");
  const video = document.createElement("video") as CapturableVideo;
  const sourceUrl = URL.createObjectURL(file);
  video.src = sourceUrl;
  video.preload = "auto";
  video.playsInline = true;
  video.muted = true;
  try {
    await waitForEvent(video, "loadedmetadata");
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = approvedLofiSettings.outputWidth;
    canvas.height = approvedLofiSettings.outputHeight;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Não foi possível preparar a renderização.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    await video.play();
    const capture = video.captureStream ?? video.mozCaptureStream;
    if (!capture) throw new Error("Use Chrome ou Edge atualizado para exportar.");
    const sourceStream = capture.call(video);
    const sourceFrameRate = sourceStream.getVideoTracks()[0]?.getSettings().frameRate ?? 30;
    const outputFrameRate = Math.max(30, Math.min(60, Math.round(sourceFrameRate)));
    const canvasStream = canvas.captureStream(outputFrameRate);
    if (options.preserveAudio) {
      sourceStream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
    }
    const mimeType = supportedMimeType();
    const recorder = new MediaRecorder(canvasStream, {
      ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 20_000_000, audioBitsPerSecond: 256_000,
    });
    const chunks: BlobPart[] = [];
    recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
    const stopped = new Promise<Blob>((resolve, reject) => {
      recorder.addEventListener("stop", () => resolve(new Blob(chunks, { type: mimeType || "video/webm" })));
      recorder.addEventListener("error", () => reject(new Error("A exportação foi interrompida.")));
    });
    let animationFrame = 0;
    let isSkipping = false;
    const paint = () => {
      const pause = options.pauses.find((range) => video.currentTime >= range.start && video.currentTime < range.end);
      if (pause && !isSkipping) {
        isSkipping = true;
        video.currentTime = pause.end;
        video.addEventListener("seeked", () => { isSkipping = false; }, { once: true });
      }
      drawFrame(context, video, phrase, options.captions);
      onProgress(Math.min(99, Math.round((video.currentTime / video.duration) * 100) || 0));
      if (!video.ended) animationFrame = requestAnimationFrame(paint);
    };
    recorder.start(1000);
    paint();
    await waitForEvent(video, "ended");
    cancelAnimationFrame(animationFrame);
    recorder.stop();
    const blob = await stopped;
    canvasStream.getTracks().forEach((track) => track.stop());
    onProgress(100);
    return blob;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(sourceUrl);
  }
}

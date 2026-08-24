import { approvedLofiSettings } from "./editor";

type CapturableVideo = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
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

function drawFrame(context: CanvasRenderingContext2D, video: HTMLVideoElement, phrase: string) {
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
    context.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
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
  context.roundRect(boxX, boxY, boxWidth, boxHeight, 18);
  context.fill();
  context.fillStyle = "#0a0a0a";
  context.textAlign = "center";
  context.textBaseline = "middle";
  lines.forEach((line, index) => context.fillText(line, width / 2, boxY + 17 + lineHeight / 2 + index * lineHeight));
}

function supportedMimeType() {
  return ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
    .find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

export async function renderVideoVariant(file: File, phrase: string, onProgress: (progress: number) => void) {
  if (typeof MediaRecorder === "undefined") throw new Error("Use Chrome ou Edge atualizado para exportar.");
  const video = document.createElement("video") as CapturableVideo;
  const sourceUrl = URL.createObjectURL(file);
  video.src = sourceUrl;
  video.preload = "auto";
  video.playsInline = true;
  video.muted = true;
  try {
    await waitForEvent(video, "loadedmetadata");
    const canvas = document.createElement("canvas");
    canvas.width = approvedLofiSettings.outputWidth;
    canvas.height = approvedLofiSettings.outputHeight;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Não foi possível preparar a renderização.");
    const canvasStream = canvas.captureStream(30);
    const capture = video.captureStream ?? video.mozCaptureStream;
    if (!capture) throw new Error("Use Chrome ou Edge atualizado para preservar o áudio.");
    await video.play();
    const sourceStream = capture.call(video);
    sourceStream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
    const mimeType = supportedMimeType();
    const recorder = new MediaRecorder(canvasStream, {
      ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 192_000,
    });
    const chunks: BlobPart[] = [];
    recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
    const stopped = new Promise<Blob>((resolve, reject) => {
      recorder.addEventListener("stop", () => resolve(new Blob(chunks, { type: mimeType || "video/webm" })));
      recorder.addEventListener("error", () => reject(new Error("A exportação foi interrompida.")));
    });
    let animationFrame = 0;
    const paint = () => {
      drawFrame(context, video, phrase);
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

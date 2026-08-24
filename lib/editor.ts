export type EditorSettings = {
  captions: boolean;
  preserveOriginalAudio: boolean;
  silenceThresholdSeconds: number;
  outputWidth: number;
  outputHeight: number;
  headlineY: number;
  headlineFontSize: number;
};

export const approvedLofiSettings: EditorSettings = {
  captions: true,
  preserveOriginalAudio: true,
  silenceThresholdSeconds: 0.5,
  outputWidth: 1080,
  outputHeight: 1920,
  headlineY: 340,
  headlineFontSize: 58,
};

export type RenderJob = {
  id: string;
  fileName: string;
  phrase: string;
  status: "ready" | "queued" | "rendering" | "done";
};

export function buildRenderJobs(files: File[], phrases: string[]): RenderJob[] {
  return files.flatMap((file, fileIndex) =>
    phrases
      .map((phrase) => phrase.trim())
      .filter(Boolean)
      .map((phrase, phraseIndex) => ({
        id: `${file.name}-${fileIndex}-${phraseIndex}`,
        fileName: file.name,
        phrase,
        status: "ready" as const,
      })),
  );
}

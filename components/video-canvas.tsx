"use client";

import { Play, UploadCloud } from "lucide-react";

type VideoCanvasProps = {
  videoUrl: string | null;
  phrase: string;
  captions: boolean;
};

export function VideoCanvas({ videoUrl, phrase, captions }: VideoCanvasProps) {
  return (
    <div className="phone-stage">
      <div className="phone-frame">
        <div className="phone-speaker" />
        {videoUrl ? (
          <video className="preview-video" src={videoUrl} controls playsInline />
        ) : (
          <div className="empty-preview">
            <div><UploadCloud size={28} /><strong>Seu vídeo aparece aqui</strong><span>Selecione um arquivo para começar</span></div>
          </div>
        )}

        <div className="safe-area top-safe">área segura</div>
        <div className={`headline-overlay ${phrase ? "" : "is-placeholder"}`}>
          {phrase || "Sua afirmação superior"}
        </div>

        {captions && videoUrl && (
          <div className="caption-overlay">legendas automáticas<br />em até duas linhas</div>
        )}

        {!videoUrl && <button className="center-play" aria-label="Aguardar vídeo"><Play size={22} fill="currentColor" /></button>}
      </div>
      <div className="canvas-meta"><span>1080 × 1920</span><span>30 FPS</span><span>WebM</span></div>
    </div>
  );
}

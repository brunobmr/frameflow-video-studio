"use client";

import { AlertCircle, Clock3, Download, Layers3, LoaderCircle } from "lucide-react";
import type { RenderJob } from "@/lib/editor";

export function RenderQueue({ jobs }: { jobs: RenderJob[] }) {
  if (!jobs.length) {
    return (
      <div className="queue-empty">
        <Layers3 size={20} />
        <div><strong>A fila aparecerá aqui</strong><p>Prepare as versões para conferir cada combinação.</p></div>
      </div>
    );
  }

  return (
    <section className="render-queue">
      <div className="queue-title"><div><Clock3 size={17} /> Fila de versões</div><span>{jobs.length}</span></div>
      <div className="queue-list">
        {jobs.map((job, index) => (
          <div className="queue-item" key={job.id}>
            <span className="queue-index">{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{job.phrase}</strong><small>{job.fileName}</small></div>
            {job.status === "done" && job.outputUrl ? (
              <a className="queue-download" href={job.outputUrl} download={job.outputName}>
                <Download size={14} /> Baixar
              </a>
            ) : job.status === "error" ? (
              <span className="queue-status is-error" title={job.error}><AlertCircle size={14} /> falhou</span>
            ) : job.status === "rendering" ? (
              <span className="queue-status"><LoaderCircle className="spin" size={14} /> {job.progress ?? 0}%</span>
            ) : (
              <span className="queue-status"><Clock3 size={14} /> aguardando</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

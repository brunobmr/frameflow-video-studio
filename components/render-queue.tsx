"use client";

import { CheckCircle2, Clock3, Layers3 } from "lucide-react";
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
            <span className="queue-status"><CheckCircle2 size={14} /> pronta para render</span>
          </div>
        ))}
      </div>
    </section>
  );
}

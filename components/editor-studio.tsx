"use client";

import {
  Captions,
  ChevronDown,
  CircleHelp,
  Clapperboard,
  Cloud,
  Download,
  Film,
  Layers3,
  Play,
  Settings2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { approvedLofiSettings, buildRenderJobs, type RenderJob } from "@/lib/editor";
import { extractAudioForTranscription, renderVideoVariant, type CaptionCue, type PauseRange } from "@/lib/render-browser";
import { PhraseEditor } from "./phrase-editor";
import { RenderQueue } from "./render-queue";
import { VideoCanvas } from "./video-canvas";

const DEFAULT_PHRASE = "Esse vídeo é pra você petista";
type TranscriptData = { text: string; cues: CaptionCue[]; pauses: PauseRange[] };

export function EditorStudio() {
  const [files, setFiles] = useState<File[]>([]);
  const [phrases, setPhrases] = useState<string[]>([DEFAULT_PHRASE]);
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);
  const [captions, setCaptions] = useState(approvedLofiSettings.captions);
  const [cutPauses, setCutPauses] = useState(true);
  const [preserveAudio, setPreserveAudio] = useState(true);
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [renderStage, setRenderStage] = useState<"idle" | "extracting" | "transcribing" | "rendering">("idle");
  const [showHelp, setShowHelp] = useState(false);
  const outputUrls = useRef<string[]>([]);
  const selectedFile = files[0] ?? null;
  const activePhrase = phrases[activePhraseIndex] ?? "";
  const firstDownload = jobs.find((job) => job.status === "done" && job.outputUrl);
  const videoUrl = useMemo(
    () => selectedFile ? URL.createObjectURL(selectedFile) : null,
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => () => {
    outputUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const versionCount = useMemo(
    () => files.length * phrases.filter((phrase) => phrase.trim()).length,
    [files, phrases],
  );

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("video/"));
    setFiles(nextFiles);
    setJobs([]);
  }

  function goToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function prepareVersions() {
    const nextJobs = buildRenderJobs(files, phrases);
    setJobs(nextJobs.map((job) => ({ ...job, status: "queued" })));
    setIsRendering(true);
    const transcripts = new Map<number, TranscriptData>();

    if (captions || cutPauses) {
      setRenderStage("transcribing");
      try {
        for (const fileIndex of [...new Set(nextJobs.map((job) => job.fileIndex))]) {
          setRenderStage("extracting");
          const audio = await extractAudioForTranscription(files[fileIndex], (progress) => {
            setJobs((current) => current.map((item) => item.fileIndex === fileIndex ? { ...item, progress } : item));
          });
          setRenderStage("transcribing");
          const body = new FormData();
          body.append("file", audio, `${files[fileIndex].name.replace(/\.[^.]+$/, "")}-audio.webm`);
          const response = await fetch("/api/transcribe", { method: "POST", body });
          const data = await response.json() as TranscriptData & { error?: string };
          if (!response.ok) throw new Error(data.error ?? "Não foi possível gerar as legendas.");
          transcripts.set(fileIndex, data);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha na transcrição.";
        setJobs((current) => current.map((item) => ({ ...item, status: "error", error: message })));
        setIsRendering(false);
        setRenderStage("idle");
        return;
      }
    }

    setRenderStage("rendering");
    for (const job of nextJobs) {
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, status: "rendering", progress: 0 } : item));
      try {
        const transcript = transcripts.get(job.fileIndex);
        const blob = await renderVideoVariant(files[job.fileIndex], job.phrase, {
          captions: captions ? transcript?.cues ?? [] : [],
          pauses: cutPauses ? transcript?.pauses ?? [] : [],
          preserveAudio,
        }, (progress) => {
          setJobs((current) => current.map((item) => item.id === job.id ? { ...item, progress } : item));
        });
        const outputUrl = URL.createObjectURL(blob);
        outputUrls.current.push(outputUrl);
        const baseName = job.fileName.replace(/\.[^.]+$/, "");
        setJobs((current) => current.map((item) => item.id === job.id ? {
          ...item,
          status: "done",
          progress: 100,
          outputUrl,
          outputName: `${baseName}-versao-${job.phraseIndex + 1}.webm`,
        } : item));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha inesperada durante a renderização.";
        setJobs((current) => current.map((item) => item.id === job.id ? { ...item, status: "error", error: message } : item));
      }
    }
    setIsRendering(false);
    setRenderStage("idle");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Play size={17} fill="currentColor" /></div>
          <span>frameflow</span>
          <span className="beta-pill">studio</span>
        </div>

        <div className="project-name">
          <span className="status-dot" />
          Novo teste de criativo
          <ChevronDown size={15} />
        </div>

        <div className="top-actions">
          <button type="button" className="ghost-button" onClick={() => setShowHelp(true)}><CircleHelp size={17} /> Ajuda</button>
          <button type="button" className="avatar-button" aria-label="Perfil de Bruno" title="Perfil será ativado com o login" disabled>BM</button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="sidebar" aria-label="Navegação do projeto">
          <nav className="step-list" aria-label="Etapas do projeto">
            <button type="button" className="step-item is-active" onClick={() => goToSection("entrada")}><span>1</span><UploadCloud size={18} /> Entrada</button>
            <button type="button" className="step-item" onClick={() => goToSection("modelo")}><span>2</span><Clapperboard size={18} /> Modelo</button>
            <button type="button" className="step-item" onClick={() => goToSection("textos")}><span>3</span><Captions size={18} /> Texto e legendas</button>
            <button type="button" className="step-item" onClick={() => goToSection("variacoes")}><span>4</span><Layers3 size={18} /> Variações</button>
          </nav>

          <div className="sidebar-note">
            <Cloud size={19} />
            <div>
              <strong>Render local e privado</strong>
              <p>O vídeo é processado no seu navegador sem ser enviado para terceiros.</p>
            </div>
          </div>
        </aside>

        <section className="control-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Configuração do projeto</p>
              <h1>Crie uma campanha em minutos.</h1>
              <p>Um vídeo pode virar várias versões, cada uma com uma afirmação diferente.</p>
            </div>
            <div className="format-pill">9:16 · 1080 × 1920</div>
          </div>

          <section className="config-card upload-section" id="entrada">
            <div className="section-title-row">
              <div><span className="section-number">01</span><h2>Vídeos de entrada</h2></div>
              {files.length > 0 && <span className="small-status">{files.length} arquivo{files.length > 1 ? "s" : ""}</span>}
            </div>

            <label className={`dropzone ${files.length ? "has-files" : ""}`}>
              <input type="file" accept="video/mp4,video/quicktime,video/webm" multiple onChange={handleFiles} />
              <div className="upload-icon"><UploadCloud size={24} /></div>
              <div>
                <strong>{files.length ? "Trocar vídeos" : "Escolha um ou vários vídeos"}</strong>
                <p>MP4, MOV ou WebM · você poderá gerar versões em massa</p>
              </div>
              <span className="browse-button">Selecionar</span>
            </label>

            {files.length > 0 && (
              <div className="file-strip">
                {files.map((file, index) => (
                  <div className="file-chip" key={`${file.name}-${file.lastModified}`}>
                    <Film size={16} />
                    <span>{file.name}</span>
                    {index === 0 && <em>prévia</em>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="config-card" id="modelo">
            <div className="section-title-row">
              <div><span className="section-number">02</span><h2>Modelo</h2></div>
              <span className="approved-badge"><Sparkles size={14} /> padrão aprovado</span>
            </div>

            <button className="template-card is-selected">
              <div className="template-thumbnail">
                <div className="mini-headline">Afirmação</div>
                <div className="mini-person" />
              </div>
              <div className="template-copy">
                <strong>Afirmação superior</strong>
                <p>Texto destacado na faixa segura, vídeo vertical e áudio original.</p>
                <div className="template-meta"><span>58 px</span><span>y 340 px</span><span>9:16</span></div>
              </div>
              <span className="selected-check">✓</span>
            </button>
          </section>

          <div id="textos"><PhraseEditor phrases={phrases} activeIndex={activePhraseIndex} onActiveIndexChange={setActivePhraseIndex} onChange={setPhrases} /></div>

          <section className="config-card compact-card">
            <div className="section-title-row">
              <div><span className="section-number">04</span><h2>Automação</h2></div>
              <Settings2 size={18} className="muted-icon" />
            </div>

            <div className="setting-list">
              <label className="toggle-row">
                <div><Captions size={18} /><span><strong>Legendas automáticas</strong><small>Português · duas linhas · incluídas no download</small></span></div>
                <input type="checkbox" checked={captions} onChange={(event) => setCaptions(event.target.checked)} />
              </label>
              <label className="toggle-row">
                <div><Settings2 size={18} /><span><strong>Cortar pausas e respirações</strong><small>Remove intervalos detectados acima de 0,5 s</small></span></div>
                <input type="checkbox" checked={cutPauses} onChange={(event) => setCutPauses(event.target.checked)} />
              </label>
              <label className="toggle-row">
                <div><Film size={18} /><span><strong>Manter áudio original</strong><small>Sem música ou trilha adicional</small></span></div>
                <input type="checkbox" checked={preserveAudio} onChange={(event) => setPreserveAudio(event.target.checked)} />
              </label>
            </div>
          </section>

          <div className="action-bar" id="variacoes">
            <div>
              <strong>{versionCount || 0} {versionCount === 1 ? "versão planejada" : "versões planejadas"}</strong>
              <span>{files.length || 0} vídeo{files.length === 1 ? "" : "s"} × {phrases.filter((phrase) => phrase.trim()).length} frase{phrases.filter((phrase) => phrase.trim()).length === 1 ? "" : "s"}</span>
            </div>
            <button className="primary-button" disabled={!versionCount || isRendering} onClick={prepareVersions}>
              <Sparkles size={18} /> {renderStage === "extracting" ? "Preparando áudio…" : renderStage === "transcribing" ? "Gerando legendas…" : renderStage === "rendering" ? "Renderizando…" : "Gerar versões"}
            </button>
          </div>
        </section>

        <aside className="preview-panel" aria-label="Prévia e fila de versões">
          <div className="preview-heading">
            <div><p className="eyebrow">Prévia ao vivo</p><h2>Resultado esperado</h2></div>
            {firstDownload?.outputUrl ? (
              <a className="icon-button" aria-label="Baixar primeira versão" href={firstDownload.outputUrl} download={firstDownload.outputName}><Download size={18} /></a>
            ) : (
              <button type="button" className="icon-button" aria-label="Download disponível após gerar" title="Gere uma versão para baixar" disabled><Download size={18} /></button>
            )}
          </div>

          <VideoCanvas videoUrl={videoUrl} phrase={activePhrase} captions={captions} />

          <div className="variant-tabs" role="group" aria-label="Selecionar frase da prévia">
            {phrases.map((phrase, index) => (
              <button
                className={index === activePhraseIndex ? "is-active" : ""}
                key={index}
                onClick={() => setActivePhraseIndex(index)}
              >
                V{index + 1}<span>{phrase || "Sem texto"}</span>
              </button>
            ))}
          </div>

          <RenderQueue jobs={jobs} />
        </aside>
      </div>

      {showHelp && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowHelp(false)}>
          <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}>
            <div><p className="eyebrow">Como usar</p><h2 id="help-title">Gere suas versões em quatro passos</h2></div>
            <ol><li>Selecione um ou mais vídeos.</li><li>Edite, adicione ou duplique as frases.</li><li>Clique em “Gerar versões”.</li><li>Baixe cada resultado na fila.</li></ol>
            <button type="button" className="primary-button" onClick={() => setShowHelp(false)}>Entendi</button>
          </section>
        </div>
      )}
    </main>
  );
}

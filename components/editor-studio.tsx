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
import { renderVideoVariant } from "@/lib/render-browser";
import { PhraseEditor } from "./phrase-editor";
import { RenderQueue } from "./render-queue";
import { VideoCanvas } from "./video-canvas";

const DEFAULT_PHRASE = "Esse vídeo é pra você petista";

export function EditorStudio() {
  const [files, setFiles] = useState<File[]>([]);
  const [phrases, setPhrases] = useState<string[]>([DEFAULT_PHRASE]);
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);
  const [captions, setCaptions] = useState(approvedLofiSettings.captions);
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const outputUrls = useRef<string[]>([]);
  const selectedFile = files[0] ?? null;
  const activePhrase = phrases[activePhraseIndex] ?? "";
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

  async function prepareVersions() {
    const nextJobs = buildRenderJobs(files, phrases);
    setJobs(nextJobs.map((job) => ({ ...job, status: "queued" })));
    setIsRendering(true);
    for (const job of nextJobs) {
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, status: "rendering", progress: 0 } : item));
      try {
        const blob = await renderVideoVariant(files[job.fileIndex], job.phrase, (progress) => {
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
          <button className="ghost-button"><CircleHelp size={17} /> Ajuda</button>
          <button className="avatar-button" aria-label="Abrir perfil">BM</button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="sidebar" aria-label="Navegação do projeto">
          <nav className="step-list" aria-label="Etapas do projeto">
            <button className="step-item is-active"><span>1</span><UploadCloud size={18} /> Entrada</button>
            <button className="step-item"><span>2</span><Clapperboard size={18} /> Modelo</button>
            <button className="step-item"><span>3</span><Captions size={18} /> Texto e legendas</button>
            <button className="step-item"><span>4</span><Layers3 size={18} /> Variações</button>
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

          <section className="config-card upload-section">
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

          <section className="config-card">
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

          <PhraseEditor
            phrases={phrases}
            activeIndex={activePhraseIndex}
            onActiveIndexChange={setActivePhraseIndex}
            onChange={setPhrases}
          />

          <section className="config-card compact-card">
            <div className="section-title-row">
              <div><span className="section-number">04</span><h2>Automação</h2></div>
              <Settings2 size={18} className="muted-icon" />
            </div>

            <div className="setting-list">
              <label className="toggle-row">
                <div><Captions size={18} /><span><strong>Legendas automáticas</strong><small>Prévia somente · ainda não incluída no download</small></span></div>
                <input type="checkbox" checked={captions} onChange={(event) => setCaptions(event.target.checked)} />
              </label>
              <div className="setting-row">
                <div><Settings2 size={18} /><span><strong>Pausas e respirações</strong><small>Somente sugestões acima do limite</small></span></div>
                <span className="value-chip">acima de 0,5 s</span>
              </div>
              <div className="setting-row">
                <div><Film size={18} /><span><strong>Áudio</strong><small>Sem trilha adicional</small></span></div>
                <span className="value-chip">original</span>
              </div>
            </div>
          </section>

          <div className="action-bar">
            <div>
              <strong>{versionCount || 0} {versionCount === 1 ? "versão planejada" : "versões planejadas"}</strong>
              <span>{files.length || 0} vídeo{files.length === 1 ? "" : "s"} × {phrases.filter((phrase) => phrase.trim()).length} frase{phrases.filter((phrase) => phrase.trim()).length === 1 ? "" : "s"}</span>
            </div>
            <button className="primary-button" disabled={!versionCount || isRendering} onClick={prepareVersions}>
              <Sparkles size={18} /> {isRendering ? "Gerando…" : "Gerar versões"}
            </button>
          </div>
        </section>

        <aside className="preview-panel" aria-label="Prévia e fila de versões">
          <div className="preview-heading">
            <div><p className="eyebrow">Prévia ao vivo</p><h2>Resultado esperado</h2></div>
            <button className="icon-button" aria-label="Baixar prévia"><Download size={18} /></button>
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
    </main>
  );
}

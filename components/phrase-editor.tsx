"use client";

import { Copy, Plus, Trash2 } from "lucide-react";

type PhraseEditorProps = {
  phrases: string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onChange: (phrases: string[]) => void;
};

export function PhraseEditor({ phrases, activeIndex, onActiveIndexChange, onChange }: PhraseEditorProps) {
  function updatePhrase(index: number, value: string) {
    onChange(phrases.map((phrase, phraseIndex) => phraseIndex === index ? value : phrase));
  }

  function addPhrase() {
    onChange([...phrases, ""]);
    onActiveIndexChange(phrases.length);
  }

  function duplicatePhrase(index: number) {
    const next = [...phrases];
    next.splice(index + 1, 0, phrases[index]);
    onChange(next);
    onActiveIndexChange(index + 1);
  }

  function removePhrase(index: number) {
    if (phrases.length === 1) return;
    onChange(phrases.filter((_, phraseIndex) => phraseIndex !== index));
    onActiveIndexChange(Math.max(0, Math.min(activeIndex, phrases.length - 2)));
  }

  return (
    <section className="config-card">
      <div className="section-title-row">
        <div><span className="section-number">03</span><h2>Frases do criativo</h2></div>
        <button className="text-button" onClick={addPhrase}><Plus size={16} /> Adicionar frase</button>
      </div>
      <p className="section-helper">Cada frase cria uma nova versão para o mesmo vídeo.</p>

      <div className="phrase-list">
        {phrases.map((phrase, index) => (
          <div className={`phrase-row ${activeIndex === index ? "is-active" : ""}`} key={index}>
            <button className="version-index" onClick={() => onActiveIndexChange(index)}>V{index + 1}</button>
            <div className="phrase-field">
              <input
                aria-label={`Frase da versão ${index + 1}`}
                maxLength={110}
                value={phrase}
                onChange={(event) => updatePhrase(index, event.target.value)}
                onFocus={() => onActiveIndexChange(index)}
                placeholder="Digite a afirmação superior"
              />
              <span>{phrase.length}/110</span>
            </div>
            <button className="row-icon-button" aria-label="Duplicar frase" onClick={() => duplicatePhrase(index)}><Copy size={16} /></button>
            <button className="row-icon-button danger" aria-label="Remover frase" disabled={phrases.length === 1} onClick={() => removePhrase(index)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

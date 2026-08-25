"use client";

import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

type PhraseEditorProps = {
  phrases: string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onChange: (phrases: string[]) => void;
};

export function PhraseEditor({ phrases, activeIndex, onActiveIndexChange, onChange }: PhraseEditorProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const pendingFocus = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocus.current === null) return;
    const index = pendingFocus.current;
    pendingFocus.current = null;
    inputRefs.current[index]?.focus();
  }, [phrases]);

  function updatePhrase(index: number, value: string) {
    onChange(phrases.map((phrase, phraseIndex) => phraseIndex === index ? value : phrase));
  }

  function addPhrase() {
    onChange([...phrases, ""]);
    onActiveIndexChange(phrases.length);
    pendingFocus.current = phrases.length;
  }

  function duplicatePhrase(index: number) {
    const next = [...phrases];
    next.splice(index + 1, 0, phrases[index]);
    onChange(next);
    onActiveIndexChange(index + 1);
    pendingFocus.current = index + 1;
  }

  function removePhrase(index: number) {
    if (phrases.length === 1) {
      onChange([""]);
      onActiveIndexChange(0);
      pendingFocus.current = 0;
      return;
    }
    onChange(phrases.filter((_, phraseIndex) => phraseIndex !== index));
    onActiveIndexChange(Math.max(0, Math.min(activeIndex, phrases.length - 2)));
  }

  return (
    <section className="config-card">
      <div className="section-title-row">
        <div><span className="section-number">03</span><h2>Frases do criativo</h2></div>
        <button type="button" className="text-button" onClick={addPhrase}><Plus size={16} /> Adicionar frase</button>
      </div>
      <p className="section-helper">Cada frase cria uma nova versão para o mesmo vídeo.</p>

      <div className="phrase-list">
        {phrases.map((phrase, index) => (
          <div className={`phrase-row ${activeIndex === index ? "is-active" : ""}`} key={index}>
            <button type="button" className="version-index" onClick={() => onActiveIndexChange(index)}>V{index + 1}</button>
            <div className="phrase-field">
              <input
                ref={(element) => { inputRefs.current[index] = element; }}
                aria-label={`Frase da versão ${index + 1}`}
                maxLength={110}
                value={phrase}
                onChange={(event) => updatePhrase(index, event.target.value)}
                onFocus={() => onActiveIndexChange(index)}
                placeholder="Digite a afirmação superior"
              />
              <span>{phrase.length}/110</span>
            </div>
            <button type="button" className="row-icon-button" aria-label={`Editar frase ${index + 1}`} onClick={() => inputRefs.current[index]?.focus()}><Pencil size={16} /></button>
            <button type="button" className="row-icon-button" aria-label={`Duplicar frase ${index + 1}`} onClick={() => duplicatePhrase(index)}><Copy size={16} /></button>
            <button type="button" className="row-icon-button danger" aria-label={`Remover frase ${index + 1}`} onClick={() => removePhrase(index)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

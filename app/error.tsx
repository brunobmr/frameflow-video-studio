"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <div className="error-card">
        <p className="eyebrow">Algo saiu do roteiro</p>
        <h1>Não conseguimos abrir o estúdio.</h1>
        <p>Seus vídeos locais não foram alterados. Tente carregar a interface novamente.</p>
        <button className="primary-button" onClick={reset}>Tentar novamente</button>
      </div>
    </main>
  );
}

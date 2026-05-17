'use client'

export function AIAssistantButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <div className="max-w-[1200px] mx-auto w-full flex justify-end">
        <button
          type="button"
          aria-label="Preguntar a IA"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <span className="material-symbols-outlined text-primary-foreground">smart_toy</span>
          <span className="text-sm">Preguntar a IA</span>
        </button>
      </div>
    </div>
  )
}

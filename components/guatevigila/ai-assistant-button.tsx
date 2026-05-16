'use client'

export function AIAssistantButton() {
  return (
    <div className="fixed bottom-0 right-0 z-50 p-6 pointer-events-none">
      <div className="max-w-[1200px] mx-auto w-full flex justify-end">
        <button className="pointer-events-auto bg-surface border border-outline-variant rounded-full w-72 flex items-center gap-2 px-4 py-2 text-on-surface-variant hover:border-on-surface transition-all focus-within:border-primary">
          <span className="material-symbols-outlined text-primary">smart_toy</span>
          <span className="text-xs font-semibold tracking-wide">Preguntar a IA...</span>
        </button>
      </div>
    </div>
  )
}

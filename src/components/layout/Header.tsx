export function Header() {
  return (
    <header className="relative z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Quantum Probability Lab
          </p>
          <h1 className="mt-1 break-words text-2xl font-bold text-white sm:text-3xl">
            양자역학 속 확률 탐험실
          </h1>
        </div>
        <nav aria-label="주요 탐험 영역" className="flex flex-wrap gap-2">
          {['확률적 분포', '확률적 상태', '확률적 사건', '확률적 존재'].map((item) => (
            <a
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/70 hover:bg-cyan-300/10 hover:text-cyan-100"
              href="#concept-hub"
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

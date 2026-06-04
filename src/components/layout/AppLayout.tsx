import type { PropsWithChildren } from 'react';
import { Header } from './Header';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="cosmic-shell min-h-screen text-slate-100">
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}

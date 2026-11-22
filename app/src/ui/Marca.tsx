/** Símbolo Cautela: «C» aberto à direita com triângulo de aviso ao centro (geometria do logótipo da empresa). */
export function Simbolo({ className = '', c = '#14233A', t = '#DA9A1E' }: { className?: string; c?: string; t?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g transform="translate(5.3 0)">
        <path d="M81.25 23.77A40.8 40.8 0 1 0 81.25 76.23" fill="none" stroke={c} strokeWidth="10.7" />
        <path d="M48 34.2 32.3 61.6h31.5z" fill={t} stroke={t} strokeWidth="3.4" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** Nome da aplicação: «CAUTELA» em serifa (como no logótipo) e «SCIE» em mono. */
export function NomeApp({ claro = false, className = '' }: { claro?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 leading-none ${className}`}>
      <span className={`font-brand text-[1.18em] font-semibold uppercase tracking-[0.16em] ${claro ? 'text-white' : 'text-ink'}`}>Cautela</span>
      <span className="font-mono text-[0.62em] font-semibold tracking-[0.2em] text-fire">SCIE</span>
    </span>
  );
}

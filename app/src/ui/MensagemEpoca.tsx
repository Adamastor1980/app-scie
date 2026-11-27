/** Época de Natal: de 25 de novembro a 6 de janeiro (Dia de Reis); fora disso não aparece */
export const epocaNatal = (d = new Date()) => (d.getMonth() === 10 && d.getDate() >= 25) || d.getMonth() === 11 || (d.getMonth() === 0 && d.getDate() <= 6);

/** Flocos e estrelas douradas muito discretos, no fundo azul da marca */
function Ceu() {
  const pts = [[8, 18, 3], [22, 70, 2], [35, 30, 2.5], [48, 82, 2], [61, 14, 2.5], [74, 58, 3], [86, 26, 2], [93, 76, 2.5], [15, 48, 1.5], [55, 46, 1.5], [80, 90, 1.5], [40, 10, 2]];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {pts.map(([x, y, r], i) => <span key={i} className="absolute rounded-full bg-fire" style={{ left: `${x}%`, top: `${y}%`, width: r, height: r, opacity: 0.35 + (i % 3) * 0.2 }} />)}
    </div>
  );
}

/** Estrela de Natal dourada (traço fino, como os ícones da app) */
function Estrela({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M24 3 L27.6 17.2 L42 20.4 L29.8 28 L33.4 43 L24 33.8 L14.6 43 L18.2 28 L6 20.4 L20.4 17.2 Z" fill="none" stroke="#DA9A1E" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M24 12 L25.6 19.4 L33 21 L26.8 24.8 L28.6 32.6 L24 27.8 L19.4 32.6 L21.2 24.8 L15 21 L22.4 19.4 Z" fill="#DA9A1E" opacity="0.9" />
    </svg>
  );
}

/** Mensagem de Natal ligada à segurança — aparece só na época, sozinha */
export default function MensagemEpoca({ hoje = new Date() }: { hoje?: Date }) {
  if (!epocaNatal(hoje)) return null;
  return (
    <div className="relative overflow-hidden bg-ink px-5 py-5 text-white">
      <Ceu />
      <div className="relative flex items-start gap-4">
        <Estrela className="h-12 w-12 shrink-0" />
        <div className="min-w-0">
          <p className="font-brand text-[30px] font-semibold leading-none tracking-wide text-fire">Feliz Natal</p>
          <p className="mt-2 text-[14.5px] font-semibold">Tenha um excelente Natal — sempre em segurança! :)</p>
          <div className="my-2.5 h-px w-16 bg-fire/70" />
          <p className="text-[12.5px] leading-relaxed text-white/75">Não deixe velas acesas nem luzes de Natal ligadas sem ninguém por perto, e não sobrecarregue as tomadas e extensões.</p>
        </div>
      </div>
    </div>
  );
}

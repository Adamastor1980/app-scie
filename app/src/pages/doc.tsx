import { useEffect, useState, type ReactNode } from 'react';
import type { Projeto } from '../data/types';
import { gerarPdfDireto, usarPdfDireto } from '../pdfDireto';

/** Blocos comuns aos documentos A4 (relatório, MAP) */
export function Sheet({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`report-page mx-auto mb-8 w-[210mm] min-h-[297mm] bg-white px-[16mm] py-[16mm] shadow-[0_1px_0_#14233A,8px_8px_0_rgba(20,35,58,0.12)] ${className}`}>{children}</section>;
}

export function H1({ n, children }: { n: string; children: ReactNode }) {
  return (
    <h2 className="avoid-break mb-5 mt-2 flex items-baseline gap-3 border-b-[3px] border-ink pb-2">
      <span className="font-mono text-[13px] font-semibold text-fire-ink">{n}</span>
      <span className="font-display text-[24px] font-extrabold tracking-tight">{children}</span>
    </h2>
  );
}

export function H2({ n, children }: { n: string; children: ReactNode }) {
  return <h3 className="avoid-break mb-2 mt-6 flex items-baseline gap-2 font-display text-[15.5px] font-bold"><span className="font-mono text-[11.5px] text-ink-3">{n}</span>{children}</h3>;
}

export const P = ({ children }: { children: ReactNode }) => <p className="mb-2.5 text-[12px] leading-[1.6] text-ink-2">{children}</p>;

/** Cabeçalho/rodapé das páginas impressas, zoom no ecrã pequeno e geração do PDF (impressão no computador; PDF direto no telemóvel/tablet) */
export function useDocumento(p: Projeto, tituloFicheiro: string, idRaiz: string) {
  const escala = () => Math.min(1, (window.innerWidth - 16) / 800);
  const [zoom, setZoom] = useState(escala);
  const [aGerar, setAGerar] = useState('');

  useEffect(() => {
    const f = () => setZoom(escala());
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  useEffect(() => {
    const st = document.createElement('style');
    const esc = (s: string) => s.replace(/["\\]/g, '');
    st.textContent = `@page { @top-left { content: "${esc(p.empresa.nome || 'SCIE')}"; font: 8pt Inter, sans-serif; color: #5A6478; }
      @top-right { content: "${esc(p.referencia || p.nome)} · v${esc(p.versao)}"; font: 8pt 'JetBrains Mono', monospace; color: #5A6478; }
      @bottom-left { content: "Realizado por: ${esc(p.autor.nome || p.empresa.nome || '')} · ${esc(p.nome)}"; font: 7.5pt Inter, sans-serif; color: #8B92A0; }
      @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 8pt 'JetBrains Mono', monospace; color: #14233A; } }
      @page :first { @top-left { content: none; } @top-right { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }`;
    document.head.appendChild(st);
    return () => { st.remove(); };
  }, [p.empresa.nome, p.autor.nome, p.referencia, p.nome, p.versao]);

  const nomeFich = `${(p.referencia || p.nome).replace(/[^\w\-À-ú ]+/g, '_')} — ${tituloFicheiro} v${p.versao}`;

  const imprimir = async (antes?: () => Promise<void> | void) => {
    await antes?.();
    if (usarPdfDireto()) {
      const raiz = document.getElementById(idRaiz);
      if (!raiz || aGerar) return;
      setAGerar('A preparar…');
      setZoom(1);
      try {
        await new Promise((r) => setTimeout(r, 200));
        await gerarPdfDireto(raiz, nomeFich + '.pdf', `Realizado por: ${p.autor.nome || p.empresa.nome || ''} · ${p.nome}`, setAGerar);
      } catch (e) {
        alert('Não foi possível gerar o PDF: ' + (e as Error).message);
      } finally {
        setAGerar('');
        setZoom(escala());
      }
      return;
    }
    await new Promise((r) => setTimeout(r, 100));
    const t = document.title;
    document.title = nomeFich;
    window.print();
    setTimeout(() => { document.title = t; }, 500);
  };

  return { zoom, aGerar, imprimir };
}

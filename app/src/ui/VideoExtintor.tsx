import { useState } from 'react';
import { PlayCircle } from 'lucide-react';

/** Vídeo de referência: como usar um extintor (escolhido pelo utilizador). Só carrega quando se toca — sem dados nem cookies antes disso. */
export const VIDEO_EXTINTOR = 'cpmIM0OXhy8';

export default function VideoExtintor() {
  const [ver, setVer] = useState(false);
  const url = `https://www.youtube.com/watch?v=${VIDEO_EXTINTOR}`;
  if (!ver) return (
    <button className="flex w-full items-center gap-3 border border-ink bg-white px-4 py-3 text-left hover:bg-paper" onClick={() => setVer(true)}>
      <PlayCircle size={28} className="shrink-0 text-fire-ink" />
      <span><span className="block text-[14px] font-semibold">Como usar um extintor</span><span className="block text-[12px] text-ink-3">Vídeo de referência · toque para ver</span></span>
    </button>
  );
  return (
    <div className="border border-ink bg-white">
      {navigator.onLine ? (
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${VIDEO_EXTINTOR}?rel=0&modestbranding=1&autoplay=1&playsinline=1`}
            title="Como usar um extintor" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        </div>
      ) : <p className="px-4 py-3 text-[13px]">Sem ligação à internet: o vídeo precisa de rede. Tente de novo quando tiver ligação.</p>}
      <p className="flex justify-between gap-3 px-4 py-2 text-[12px]"><span className="text-ink-3">Como usar um extintor</span><a className="font-semibold text-fire-ink hover:underline" href={url} target="_blank" rel="noopener noreferrer">Abrir no YouTube</a></p>
    </div>
  );
}

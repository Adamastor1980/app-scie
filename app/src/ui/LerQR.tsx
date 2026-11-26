import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Leitor de QR com a câmara de trás (telemóvel, tablet ou computador). Funciona sem rede: a leitura é feita no aparelho. */
export default function LerQR({ onLido, onFechar, children }: { onLido: (texto: string) => void; onFechar: () => void; children?: ReactNode }) {
  const video = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState('');
  const cb = useRef(onLido);
  cb.current = onLido;
  useEffect(() => {
    let parar = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    (async () => {
      try {
        const { default: jsQR } = await import('jsqr');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (parar) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        let ult = 0;
        const passo = (t: number) => {
          if (parar) return;
          if (t - ult > 180 && v.videoWidth) {
            ult = t;
            const k = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
            canvas.width = Math.round(v.videoWidth * k); canvas.height = Math.round(v.videoHeight * k);
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const c = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
            if (c?.data) { parar = true; stream?.getTracks().forEach((x) => x.stop()); navigator.vibrate?.(60); cb.current(c.data); return; }
          }
          raf = requestAnimationFrame(passo);
        };
        raf = requestAnimationFrame(passo);
      } catch (e) {
        const n = (e as Error).name;
        setErro(n === 'NotAllowedError' ? 'Sem autorização para usar a câmara. Autorize nas definições do browser, ou procure pelo número abaixo.' : n === 'NotFoundError' ? 'Este aparelho não tem câmara disponível. Procure pelo número abaixo.' : 'Não foi possível abrir a câmara. Procure pelo número abaixo.');
      }
    })();
    return () => { parar = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/95 text-white" role="dialog" aria-label="Ler QR do extintor">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-display text-[17px] font-bold">Apontar ao QR do extintor</p>
        <button className="grid h-10 w-10 place-items-center border border-white/40" aria-label="Fechar" onClick={onFechar}><X size={20} /></button>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[460px] overflow-hidden bg-black">
        {!erro && <video ref={video} className="h-full w-full object-cover" playsInline muted autoPlay />}
        {!erro && <div className="pointer-events-none absolute inset-[18%] border-[3px] border-fire" />}
        {erro && <p className="grid h-full place-items-center p-6 text-center text-[14px]">{erro}</p>}
      </div>
      <div className="mx-auto w-full max-w-[460px] flex-1 overflow-auto bg-paper px-4 py-4 text-ink">{children}</div>
    </div>
  );
}

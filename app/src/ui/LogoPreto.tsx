import { useEffect, useState } from 'react';

const cache = new Map<string, string>();

/**
 * Converte um logótipo para preto sobre branco (só para mostrar; o original não é alterado).
 * O fundo é estimado pelos cantos da imagem; tudo o que se afasta dessa cor fica preto,
 * com transição suave nas arestas.
 */
async function paraPreto(src: string, lado = 160): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = lado;
  c.height = lado;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const k = Math.min(lado / img.width, lado / img.height);
  const w = img.width * k, h = img.height * k;
  ctx.drawImage(img, (lado - w) / 2, (lado - h) / 2, w, h);
  const d = ctx.getImageData(0, 0, lado, lado);
  const px = d.data;
  // cor de fundo: média dos cantos visíveis (transparente conta como branco)
  const cantos = [[(lado - w) / 2 + 1, (lado - h) / 2 + 1], [(lado + w) / 2 - 2, (lado - h) / 2 + 1], [(lado - w) / 2 + 1, (lado + h) / 2 - 2], [(lado + w) / 2 - 2, (lado + h) / 2 - 2]];
  let br = 0, bg = 0, bb = 0;
  for (const [x, y] of cantos) {
    const i = (Math.round(y) * lado + Math.round(x)) * 4;
    const a = px[i + 3] / 255;
    br += px[i] * a + 255 * (1 - a);
    bg += px[i + 1] * a + 255 * (1 - a);
    bb += px[i + 2] * a + 255 * (1 - a);
  }
  br /= 4; bg /= 4; bb /= 4;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3] / 255;
    const r = px[i] * a + 255 * (1 - a), g = px[i + 1] * a + 255 * (1 - a), b = px[i + 2] * a + 255 * (1 - a);
    const dist = Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);
    const t = Math.min(1, Math.max(0, (dist - 40) / 80)); // 0 = fundo, 1 = desenho
    const v = Math.round(255 * (1 - t) + 15 * t); // #0F0F0E (preto da app)
    px[i] = px[i + 1] = v;
    px[i + 2] = Math.round(255 * (1 - t) + 14 * t);
    px[i + 3] = 255;
  }
  ctx.putImageData(d, 0, 0);
  return c.toDataURL('image/png');
}

export default function LogoPreto({ src, className = '' }: { src: string; className?: string }) {
  const [out, setOut] = useState(() => cache.get(src) ?? '');
  useEffect(() => {
    if (cache.has(src)) { setOut(cache.get(src)!); return; }
    let vivo = true;
    paraPreto(src).then((r) => { cache.set(src, r); if (vivo) setOut(r); }).catch(() => { if (vivo) setOut(src); });
    return () => { vivo = false; };
  }, [src]);
  return out ? <img src={out} alt="" className={className} /> : <span className={className} />;
}

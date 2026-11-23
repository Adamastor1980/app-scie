import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// funcionamento offline (só na versão publicada)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register(`./sw.js?v=${__VERSAO__}`).catch(() => {}); });
}

// versão nova publicada com a app aberta (ex.: separador do iPad aberto há dias): ao voltar à app, recarrega com a versão nova
if (import.meta.env.PROD) {
  const atual = (document.querySelector('script[type="module"][src*="/assets/"]') as HTMLScriptElement | null)?.src.split('/assets/')[1];
  let aVerificar = false;
  const avisar = () => {
    if (document.getElementById('versao-nova')) return;
    const d = document.createElement('div');
    d.id = 'versao-nova';
    d.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:100;display:flex;gap:12px;align-items:center;padding:10px 14px;background:#14233A;color:#fff;font:600 13px Inter,sans-serif;box-shadow:0 4px 16px rgba(20,35,58,.25)';
    d.innerHTML = 'Há uma versão nova da app.<button style="background:#DA9A1E;color:#14233A;padding:6px 12px;font:inherit">Atualizar</button>';
    d.querySelector('button')!.onclick = () => location.reload();
    document.body.appendChild(d);
  };
  const verificar = async (recarregar: boolean) => {
    if (!atual || aVerificar || !navigator.onLine) return;
    aVerificar = true;
    try {
      const html = await (await fetch(`./index.html?verificar=${Date.now()}`, { cache: 'no-store' })).text();
      const nova = html.match(/\/assets\/(index-[^"']+\.js)/)?.[1];
      if (nova && nova !== atual) {
        if (recarregar) location.reload();
        else avisar();
      }
    } catch { /* sem rede: tenta mais tarde */ } finally { aVerificar = false; }
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verificar(true); });
  setInterval(() => verificar(false), 15 * 60 * 1000);
}

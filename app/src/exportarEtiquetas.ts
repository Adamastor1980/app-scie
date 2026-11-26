import type { ExtintorInv, Projeto } from './data/types';
import { descExt, rotuloPisoInv, urlExt } from './engine/manutencao';
import { entregarFicheiro } from './pdfDireto';

/** Etiquetas 50 × 30 mm, A4 com 4 colunas × 9 linhas (36 por folha). Cada uma: QR (abre a ficha do extintor), n.º, edifício, piso e local. */
export const ETQ = { w: 50, h: 30, cols: 4, linhas: 9, x0: 5, y0: 13.5 } as const;
const txt = (s: string) => s.replace(/₂/g, '2').replace(/[—–]/g, '-').replace(/≤/g, '<=');

export async function exportarEtiquetas(p: Projeto, lista: ExtintorInv[], inicio = 1) {
  const [{ jsPDF }, QR] = await Promise.all([import('jspdf'), import('qrcode')]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const porFolha = ETQ.cols * ETQ.linhas;
  const nomeEd = (id: string) => p.edificios.find((e) => e.id === id)?.nome ?? '';
  let pos = Math.max(0, inicio - 1) % porFolha;
  let primeira = true;
  for (const e of lista) {
    if (pos === porFolha) { pdf.addPage(); pos = 0; }
    if (primeira) primeira = false;
    const c = pos % ETQ.cols, l = Math.floor(pos / ETQ.cols);
    const x = ETQ.x0 + c * ETQ.w, y = ETQ.y0 + l * ETQ.h;
    const qr = await QR.toDataURL(urlExt(p.id, e.id), { errorCorrectionLevel: 'M', margin: 0, width: 360, color: { dark: '#14233A', light: '#FFFFFF' } });
    pdf.addImage(qr, 'PNG', x + 2.5, y + 3, 24, 24);
    const tx = x + 28.5, larg = ETQ.w - 30;
    pdf.setTextColor('#14233A');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13);
    pdf.text(txt(e.num || '-'), tx, y + 8, { maxWidth: larg });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5);
    const linhas = [nomeEd(e.edificio), rotuloPisoInv(e.piso), e.local, descExt(e)].filter((z) => z && z !== '-').map(txt);
    let yy = y + 12;
    for (const t of linhas) {
      const partes = pdf.splitTextToSize(t, larg) as string[];
      for (const pt of partes.slice(0, 2)) { if (yy > y + 26.5) break; pdf.text(pt, tx, yy); yy += 2.7; }
    }
    pdf.setFontSize(5); pdf.setTextColor('#8B92A0');
    pdf.text('Ler o QR com a camara', tx, y + 28);
    // linha de corte muito clara (útil se não for papel de etiquetas pré-cortado)
    pdf.setDrawColor('#E4E1D6'); pdf.setLineWidth(0.1); pdf.rect(x, y, ETQ.w, ETQ.h);
    pos++;
  }
  const blob = pdf.output('blob');
  await entregarFicheiro(blob, `${(p.referencia || p.nome).replace(/[^\w\-À-ú ]+/g, '_')} — Etiquetas QR dos extintores.pdf`, 'application/pdf');
}

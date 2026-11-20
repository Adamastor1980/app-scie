/**
 * Gera o PDF do relatório diretamente no dispositivo (telemóvel/tablet), sem o diálogo de impressão,
 * que no iPhone não funciona na app instalada. Cada folha A4 do ecrã é convertida em imagem;
 * folhas mais compridas do que uma página são divididas em pontos de quebra seguros (entre linhas de tabela, parágrafos…).
 * No computador continua a usar-se a impressão do browser (texto vetorial, melhor qualidade).
 */
const A4_W = 210;
const A4_H = 297;
const MARGEM_TOPO_CONT = 14; // mm, páginas de continuação
const MARGEM_BAIXO = 16; // mm (rodapé)
const ESCALA = 1.75;

export const usarPdfDireto = () => window.matchMedia('(pointer: coarse)').matches;

function pontosQuebra(sheet: HTMLElement): number[] {
  // candidatos: o fundo de cada elemento; válido só se nenhum elemento «pequeno» (linha, parágrafo, título…) atravessar esse ponto
  const top = sheet.getBoundingClientRect().top;
  const iv: [number, number][] = [];
  sheet.querySelectorAll<HTMLElement>('*').forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.height > 0 && r.height < 160) iv.push([r.top - top, r.bottom - top]);
  });
  const cands = [...new Set(iv.map(([, b]) => Math.round(b)))].sort((x, y) => x - y);
  const tops = [...new Set(iv.map(([t]) => t))].sort((x, y) => x - y);
  // quebra a meio do espaço em branco até ao elemento seguinte (o desenho do texto pode desviar-se uns píxeis da medida)
  return cands
    .filter((q) => !iv.some(([t, b]) => t < q - 1 && b > q + 1))
    .map((q) => {
      const prox = tops.find((t) => t >= q - 0.5);
      return prox === undefined ? q : q + Math.min(8, (prox - q) / 2);
    });
}

export async function gerarPdfDireto(raiz: HTMLElement, nomeFicheiro: string, rodape: string, progresso?: (t: string) => void) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const sheets = Array.from(raiz.querySelectorAll<HTMLElement>('.report-page'));
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  let primeira = true;

  for (let i = 0; i < sheets.length; i++) {
    progresso?.(`A preparar página ${i + 1} de ${sheets.length}…`);
    const s = sheets[i];
    const pxW = s.getBoundingClientRect().width; // largura em px da folha (210 mm)
    const pxPorMm = pxW / A4_W;
    const quebras = pontosQuebra(s);
    const r0 = s.getBoundingClientRect();
    const alturaTotal = r0.height;
    // cada página é capturada separadamente: o iPhone devolve em branco imagens (canvas) muito grandes
    const capturar = (y: number, h: number) =>
      html2canvas(s, { scale: ESCALA, backgroundColor: '#ffffff', useCORS: true, logging: false, x: 0, y, // deslocamento relativo à própria folha
        width: pxW, height: Math.ceil(h) });

    // folha que cabe (quase) numa página: vai inteira, ajustada à altura A4 — evita sobras de poucos milímetros
    if (alturaTotal <= A4_H * pxPorMm * 1.04) {
      const canvas = await capturar(0, alturaTotal);
      const hMm = alturaTotal / pxPorMm;
      const f = Math.min(1, A4_H / hMm);
      if (!primeira) pdf.addPage();
      primeira = false;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.82), 'JPEG', (A4_W - A4_W * f) / 2, 0, A4_W * f, hMm * f);
      continue;
    }

    let y = 0; // px do ecrã
    let cont = false;
    let parte = 1;
    while (y < alturaTotal - 12 * pxPorMm) {
      progresso?.(`A preparar página ${i + 1} de ${sheets.length} (parte ${parte++})…`);
      const topoMm = cont ? MARGEM_TOPO_CONT : 0;
      const maxPx = (A4_H - MARGEM_BAIXO - topoMm) * pxPorMm;
      let fim = y + maxPx;
      if (fim < alturaTotal) {
        const ok = quebras.filter((q) => q > y + 40 && q <= fim);
        if (ok.length) fim = ok[ok.length - 1];
      } else fim = alturaTotal;
      const h = fim - y;
      const canvas = await capturar(y, h);
      if (!primeira) pdf.addPage();
      primeira = false;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.82), 'JPEG', 0, topoMm, A4_W, h / pxPorMm);
      canvas.width = 0; // liberta memória (importante no iPhone)
      y = fim;
      cont = true;
    }
  }

  const total = pdf.getNumberOfPages();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(110);
  for (let n = 2; n <= total; n++) {
    pdf.setPage(n);
    pdf.text(rodape, 14, A4_H - 8);
    pdf.text(`Página ${n} de ${total}`, A4_W - 14, A4_H - 8, { align: 'right' });
  }

  progresso?.('A guardar…');
  const blob = pdf.output('blob');
  const file = new File([blob], nomeFicheiro, { type: 'application/pdf' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: nomeFicheiro });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nomeFicheiro;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

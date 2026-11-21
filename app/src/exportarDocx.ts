import type { Projeto } from './data/types';
import { entregarFicheiro } from './pdfDireto';

/**
 * Exporta o relatório (tal como está no ecrã) para Word (.docx) editável.
 * Converte o DOM das folhas A4 numa versão HTML simples (títulos, parágrafos, tabelas, imagens),
 * que o conversor transforma em DOCX. Figuras com marcações (plantas com pontos) seguem como imagem.
 */

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const BLOCO = new Set(['block', 'flex', 'grid', 'table', 'list-item', 'flow-root']);
const LARG_MAX = 620; // px úteis numa página A4 com margens de 2 cm

function ehBloco(el: Element) {
  return BLOCO.has(getComputedStyle(el).display);
}

async function rasterizar(el: HTMLElement): Promise<string> {
  const { default: html2canvas } = await import('html2canvas');
  const c = await html2canvas(el, { scale: 1.5, backgroundColor: '#ffffff', logging: false, useCORS: true });
  return c.toDataURL('image/jpeg', 0.85);
}

function tamanhoImg(w: number, h: number) {
  const k = Math.min(1, LARG_MAX / Math.max(1, w));
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

async function inline(n: Node): Promise<string> {
  if (n.nodeType === Node.TEXT_NODE) return esc(n.textContent ?? '');
  if (!(n instanceof HTMLElement)) return '';
  if (n.classList.contains('no-print') || ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'svg'].includes(n.tagName)) return '';
  const cs = getComputedStyle(n);
  if (cs.display === 'none') return '';
  if (n.tagName === 'BR') return '<br/>';
  if (n.tagName === 'IMG') return img(n as HTMLImageElement);
  if (n.querySelector(':scope > img') && n.querySelector(':scope > .absolute')) {
    const r = n.getBoundingClientRect();
    const { w, h } = tamanhoImg(r.width, r.height);
    return `<img src="${await rasterizar(n)}" width="${w}" height="${h}" /><br/>`;
  }
  let s = '';
  for (const c of Array.from(n.childNodes)) s += await inline(c);
  if (!s.trim()) return s;
  const peso = parseInt(cs.fontWeight, 10) >= 600;
  const cor = cs.color === 'rgb(229, 56, 14)' ? '#E5380E' : cs.color === 'rgb(18, 122, 75)' ? '#127A4B' : '';
  if (peso) s = `<b>${s}</b>`;
  if (cor) s = `<span style="color:${cor}">${s}</span>`;
  if (cs.display === 'block') s = `${s}<br/>`;
  return s;
}

function img(i: HTMLImageElement) {
  const r = i.getBoundingClientRect();
  const { w, h } = tamanhoImg(r.width || i.naturalWidth, r.height || i.naturalHeight);
  return i.src ? `<img src="${i.src}" width="${w}" height="${h}" />` : '';
}

async function bloco(el: Element): Promise<string> {
  if (!(el instanceof HTMLElement)) return '';
  if (el.classList.contains('no-print') || ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'svg'].includes(el.tagName)) return '';
  const cs = getComputedStyle(el);
  if (cs.display === 'none') return '';
  const tag = el.tagName;

  // figuras com marcações sobrepostas (ex.: planta com pontos): imagem única
  if (el.querySelector(':scope > img') && el.querySelector(':scope > .absolute')) {
    const r = el.getBoundingClientRect();
    const { w, h } = tamanhoImg(r.width, r.height);
    return `<p><img src="${await rasterizar(el)}" width="${w}" height="${h}" /></p>`;
  }
  if (tag === 'IMG') return `<p>${img(el as HTMLImageElement)}</p>`;
  if (tag === 'TABLE') return tabela(el as HTMLTableElement);
  if (tag === 'H1') return `<p style="font-size:26pt;font-weight:bold">${await inline(el)}</p>`;
  if (tag === 'H2') return `<h1>${(await inline(el)).replace(/<br\/>/g, ' ')}</h1>`;
  if (tag === 'H3') return `<h2>${(await inline(el)).replace(/<br\/>/g, ' ')}</h2>`;

  const INLINE = new Set(['SPAN', 'B', 'STRONG', 'A', 'EM', 'I', 'SMALL']);
  if (cs.display === 'flex' && cs.flexDirection === 'row' && el.children.length > 0 && Array.from(el.children).every((c) => INLINE.has(c.tagName) && !c.querySelector('img, table, div, p'))) {
    const partes = (await Promise.all(Array.from(el.childNodes).map((c) => inline(c)))).map((x) => x.replace(/(<br\/>)+$/, '').trim()).filter(Boolean);
    return partes.length ? `<p>${partes.join('&nbsp;&nbsp;')}</p>` : '';
  }
  const filhosBloco = Array.from(el.children).some((c) => ehBloco(c) || c.tagName === 'TABLE' || c.tagName === 'IMG');
  if (!filhosBloco) {
    const t = await inline(el);
    return t.replace(/<br\/>$/, '').trim() ? `<p>${t.replace(/(<br\/>)+$/, '')}</p>` : '';
  }
  // grelhas/flex lado a lado (ex.: capa, assinaturas): uma linha de tabela sem bordas
  if ((cs.display === 'grid' || (cs.display === 'flex' && cs.flexDirection === 'row')) && el.children.length > 1 && el.children.length <= 4 && !el.querySelector('table')) {
    const cols = await Promise.all(Array.from(el.children).map(async (c) => `<td style="vertical-align:top;border:none">${await inline(c)}</td>`));
    return `<table style="width:100%;border:none"><tr>${cols.join('')}</tr></table>`;
  }
  let s = '';
  let linha = '';
  for (const c of Array.from(el.childNodes)) {
    if (c instanceof Element && (ehBloco(c) || c.tagName === 'TABLE' || c.tagName === 'IMG')) {
      if (linha.trim()) { s += `<p>${linha}</p>`; linha = ''; }
      s += await bloco(c);
    } else linha += await inline(c);
  }
  if (linha.trim()) s += `<p>${linha}</p>`;
  return s;
}

async function tabela(t: HTMLTableElement) {
  const larguraT = t.getBoundingClientRect().width || 1;
  let s = '<table style="width:100%;border-collapse:collapse">';
  for (const tr of Array.from(t.rows)) {
    s += '<tr>';
    for (const c of Array.from(tr.cells)) {
      const px = Math.max(24, Math.round((c.getBoundingClientRect().width / larguraT) * LARG_MAX));
      const th = c.tagName === 'TH';
      const span = c.colSpan > 1 ? ` colspan="${c.colSpan}"` : '';
      const fundo = th || getComputedStyle(c).backgroundColor === 'rgb(243, 242, 237)' ? 'background-color:#F3F2ED;' : '';
      const conteudo = c.querySelector('img, table') ? await bloco(c) : await inline(c);
      s += `<td${span} width="${px}" style="width:${px}px;border:1px solid #BBBBBB;padding:3px 5px;vertical-align:top;font-size:9pt;${fundo}">${th ? `<b>${conteudo}</b>` : conteudo.replace(/(<br\/>)+$/, '')}</td>`;
    }
    s += '</tr>';
  }
  return s + '</table>';
}

export async function exportarDocx(p: Projeto, raiz: HTMLElement, tituloFicheiro: string) {
  const folhas = Array.from(raiz.querySelectorAll<HTMLElement>('.report-page'));
  let html = '';
  for (let i = 0; i < folhas.length; i++) {
    const conteudo = await bloco(folhas[i]);
    html += i === 0 ? conteudo : `<div style="page-break-before: always;">${conteudo}</div>`;
  }

  // o conversor (versão de browser) precisa destas variáveis globais do Node
  const w = window as unknown as Record<string, unknown>;
  if (typeof w.global === 'undefined') w.global = window;
  if (typeof w.process === 'undefined') w.process = { env: {} };
  const criouBuffer = typeof w.Buffer === 'undefined';
  if (criouBuffer) {
    w.Buffer = {
      from(data: unknown, enc?: string) {
        if (typeof data === 'string') {
          if (enc === 'base64') { const b = atob(data); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
          return new TextEncoder().encode(data);
        }
        return new Uint8Array(data as ArrayBuffer);
      },
      isBuffer: () => false,
    };
  }
  const mod = await import('@turbodocx/html-to-docx');
  const HTMLtoDOCX = (mod as unknown as { default: (h: string, hd: string | null, o: object, ft?: string) => Promise<Blob | ArrayBuffer> }).default;

  const autor = p.autor.nome || p.empresa.nome || '';
  let res: Blob | ArrayBuffer;
  try {
  res = await HTMLtoDOCX(
    html,
    `<p style="font-size:8pt;color:#5C5B55">${[p.empresa.nome, p.referencia || p.nome, `v${p.versao}`].filter(Boolean).map((x) => esc(x!)).join(' · ')}</p>`,
    {
      title: `${p.nome} — ${tituloFicheiro}`, creator: autor || 'SCIE/CALC', lang: 'pt-PT',
      orientation: 'portrait', pageSize: { width: 11906, height: 16838 },
      margins: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 567, footer: 567 },
      font: 'Calibri', fontSize: 20,
      header: true, footer: true, pageNumber: true, skipFirstHeaderFooter: true,
      table: { row: { cantSplit: true } },
      heading1: { font: 'Calibri', fontSize: 30, bold: true, spacing: { before: 240, after: 120 } },
      heading2: { font: 'Calibri', fontSize: 24, bold: true, spacing: { before: 200, after: 80 } },
    },
    `<p style="font-size:8pt;color:#8E8D86">Realizado por: ${esc(autor)} · ${esc(p.nome)}</p>`,
  );
  } finally {
    // o «Buffer» falso só pode existir durante a conversão: outras bibliotecas (ex.: JSZip) usá-lo-iam por engano
    if (criouBuffer) delete w.Buffer;
  }
  const bruto = res instanceof Blob ? res : new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const blob = await comGrelhaTabelas(bruto);
  const nome = `${(p.referencia || p.nome)} - ${tituloFicheiro} v${p.versao}.docx`;
  await entregarFicheiro(blob, nome, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

/**
 * Acrescenta a grelha (w:tblGrid) a cada tabela, a partir das larguras das células da primeira linha.
 * Sem ela, o LibreOffice e algumas versões do Word distribuem as colunas por igual.
 */
async function comGrelhaTabelas(docx: Blob): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(docx);
  const f = zip.file('word/document.xml');
  if (!f) return docx;
  let xml = await f.async('string');
  // substitui a grelha de colunas iguais pela grelha com as larguras das células da primeira linha
  xml = xml.replace(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>(\s*<w:tr[ >][\s\S]*?<\/w:tr>)/g, (todo, linha: string) => {
    const cel = [...linha.matchAll(/<w:tcPr>([\s\S]*?)<\/w:tcPr>/g)].map((m) => {
      const w = /<w:tcW w:w="([\d.]+)"/.exec(m[1]);
      const span = /<w:gridSpan w:val="(\d+)"/.exec(m[1]);
      return { w: w ? +w[1] : 0, span: span ? +span[1] : 1 };
    });
    if (!cel.length || cel.some((c) => !c.w)) return todo;
    const cols = cel.flatMap((c) => Array.from({ length: c.span }, () => Math.round(c.w / c.span)));
    return `<w:tblGrid>${cols.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${linha}`;
  });
  zip.file('word/document.xml', xml);
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

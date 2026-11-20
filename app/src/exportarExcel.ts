import type { Projeto } from './data/types';
import { ROMANO } from './data/rjscie';
import { contexto, gerarMedidas, secRotulo } from './engine/medidas';
import { desconformidades, verDe } from './engine/verificacao';
import { CAT_NOME } from './engine/calc';
import { nomeUT } from './nome';
import { entregarFicheiro } from './pdfDireto';

const ESTADO: Record<string, string> = { cumpre: 'Cumpre', nao_cumpre: 'Não cumpre', na: 'N.A.' };

/** Exporta para Excel: (1) plano de ação com as não conformidades; (2) verificação completa de todas as medidas */
export async function exportarExcel(p: Projeto) {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const cab = (t: string) => ({ value: t, fontWeight: 'bold' as const, backgroundColor: '#E9E7E0' });

  const plano: unknown[][] = [[
    cab('N.º'), cab('Edifício'), cab('UT'), cab('Categoria'), cab('Secção (anexo IV)'), cab('Medida'), cab('Base legal'),
    cab('Constatação'), cab('Medida corretiva'), cab('Prazo'), cab('Responsável'), cab('Estado'),
  ]];
  const todas: unknown[][] = [[
    cab('Edifício'), cab('UT'), cab('Categoria'), cab('Secção (anexo IV)'), cab('Medida'), cab('Exigência'), cab('Base legal'), cab('Aplicabilidade'), cab('Verificação'), cab('Observações'),
  ]];

  let n = 0;
  for (const ed of p.edificios) {
    for (const ut of ed.uts) {
      const ctx = contexto(ed, ut);
      const med = gerarMedidas(ctx);
      const nomeU = `UT ${ROMANO[ut.tipo]} — ${nomeUT(ut).nome}`;
      for (const d of desconformidades(ut, med)) {
        plano.push([++n, ed.nome, nomeU, CAT_NOME[ctx.cls.cat], secRotulo(d.sec), d.medida.titulo, d.medida.base, d.ver.obs ?? '', d.ver.corretiva ?? '', d.ver.prazo ?? '', '', 'Por corrigir']);
      }
      for (const m of med) {
        const v = verDe(ut, m);
        todas.push([ed.nome, nomeU, CAT_NOME[ctx.cls.cat], secRotulo(m.tema), m.titulo, m.exigencia, m.base,
          m.estado === 'aplica' ? 'Aplicável' : m.estado === 'verificar' ? 'A verificar' : 'Não aplicável',
          v.estado ? ESTADO[v.estado] : '', v.obs ?? '']);
      }
    }
  }

  const blob = await writeExcelFile([
    {
      data: plano as never, sheet: 'Plano de ação', stickyRowsCount: 1,
      columns: [{ width: 5 }, { width: 22 }, { width: 30 }, { width: 13 }, { width: 28 }, { width: 34 }, { width: 26 }, { width: 40 }, { width: 40 }, { width: 14 }, { width: 18 }, { width: 13 }],
    },
    {
      data: todas as never, sheet: 'Verificação', stickyRowsCount: 1,
      columns: [{ width: 22 }, { width: 30 }, { width: 13 }, { width: 28 }, { width: 34 }, { width: 70 }, { width: 28 }, { width: 14 }, { width: 13 }, { width: 40 }],
    },
  ]).toBlob();

  const nome = `${(p.referencia || p.nome).replace(/[^\w\-À-ú ]+/g, '_')} — Plano de ação SCIE.xlsx`;
  await entregarFicheiro(blob, nome, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

import type { Projeto } from './data/types';
import { TIPO_MANUT, dataPt, descExt, estadoExt, ordenar, rotuloPisoInv } from './engine/manutencao';
import { entregarFicheiro } from './pdfDireto';

/** Excel do plano de manutenção: (1) inventário com estado; (2) registo de todas as intervenções (RT-SCIE, art. 201.º n.º 1 c)) */
export async function exportarManutencaoExcel(p: Projeto) {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const pl = p.manutencao!;
  const cab = (t: string) => ({ value: t, fontWeight: 'bold' as const, backgroundColor: '#EFEDE4' });
  const nomeEd = (id: string) => p.edificios.find((e) => e.id === id)?.nome ?? '—';
  const lista = ordenar(pl.extintores, p.edificios.map((e) => e.id));
  const inv: unknown[][] = [[cab('N.º'), cab('Edifício'), cab('Piso'), cab('Local'), cab('Extintor'), cab('Eficácia'), cab('Fabricante'), cab('N.º de série'), cab('Ano'), cab('Última intervenção'), cab('Próxima manutenção'), cab('Estado')]];
  const reg: unknown[][] = [[cab('Data'), cab('Extintor'), cab('Edifício'), cab('Piso / local'), cab('Tipo'), cab('Resultado'), cab('Empresa'), cab('Registo ANEPC'), cab('Técnico'), cab('Motivo e observações')]];
  for (const e of lista) {
    const s = estadoExt(e, pl.periodoMeses);
    inv.push([e.num, nomeEd(e.edificio), rotuloPisoInv(e.piso), e.local, descExt(e), e.eficacia, e.fabricante, e.serie, e.ano ?? '', s.ultima ? dataPt(s.ultima.data) : '', s.proxima ? dataPt(s.proxima) : '', s.texto + (s.naoConforme ? ' · não conforme' : '')]);
    for (const r of [...e.registos].sort((a, b) => b.data.localeCompare(a.data))) {
      reg.push([dataPt(r.data), e.num, nomeEd(e.edificio), `${rotuloPisoInv(e.piso)} · ${e.local}`, TIPO_MANUT[r.tipo], r.resultado === 'conforme' ? 'Conforme' : r.resultado === 'nao_conforme' ? 'Não conforme' : '', r.empresa, r.registoAnepc, r.tecnico, r.obs]);
    }
  }
  const blob = await writeExcelFile([
    { data: inv as never, sheet: 'Extintores', stickyRowsCount: 1, columns: [{ width: 9 }, { width: 18 }, { width: 13 }, { width: 32 }, { width: 20 }, { width: 14 }, { width: 16 }, { width: 14 }, { width: 7 }, { width: 14 }, { width: 14 }, { width: 28 }] },
    { data: reg as never, sheet: 'Registo de manutenções', stickyRowsCount: 1, columns: [{ width: 11 }, { width: 9 }, { width: 18 }, { width: 30 }, { width: 22 }, { width: 13 }, { width: 24 }, { width: 13 }, { width: 20 }, { width: 50 }] },
  ]).toBlob();
  await entregarFicheiro(blob, `${(p.referencia || p.nome).replace(/[^\w\-À-ú ]+/g, '_')} — Plano de manutenção de extintores.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

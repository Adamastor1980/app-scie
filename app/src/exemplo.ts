import type { Projeto } from './data/types';
import { novaUT, novoProjeto, uid } from './store';
import { QUADRO_II } from './data/despacho';
import { RAI } from './engine/calc';

const atv = (nome: string) => QUADRO_II.find((a) => a.a === nome)!;

/** Projeto de demonstração: edifício industrial com UT XII e UT III integrada noutro corpo */
export function exemploProjeto(): Projeto {
  const p = novoProjeto();
  p.nome = 'Unidade de produção alimentar — exemplo';
  p.referencia = 'EX-SCIE-001';
  p.cliente = 'Exemplo, S.A.';
  p.morada = 'Rua da Indústria, 100';
  p.concelho = 'Matosinhos';
  p.distrito = 'Porto';
  p.tipoIntervencao = 'Trabalho académico';
  p.empresa.nome = 'Empresa de Engenharia de Segurança (exemplo)';
  p.empresa.apresentacao = 'Texto de exemplo. Substituir pela apresentação real da empresa: áreas de atuação, certificações, equipa técnica e referências.';
  p.autor.nome = 'Autor do exemplo';
  p.autor.qualificacao = 'Técnico Superior de Segurança no Trabalho';

  const ed = p.edificios[0];
  ed.nome = 'Edifício A — produção e armazém';
  ed.altura = 0;
  ed.pisosAcima = 1;
  ed.pisosAbaixo = 0;
  ed.descricao = 'Edifício de um piso, estrutura metálica, cobertura em painel sandwich, implantado isoladamente no lote.';

  const xii = novaUT(12);
  xii.designacao = 'UT XII — Produção e armazenagem de produtos lácteos';
  xii.casoXII = 4;
  xii.pisos = [{ id: uid(), nome: 'Piso 0', cota: 0, area: 4200 }];
  const leite = atv('Leite em pó');
  const emb = atv('Alimentação, embalagem');
  xii.compartimentos = [
    {
      id: uid(), nome: 'CCF1 — Produção', area: 2400, metodo: 'probabilistico', regraRai: true, itens: [], armazens: [],
      atividades: [
        { id: uid(), atividadeId: leite.id, nome: leite.a, qs: leite.qs!, area: 1800, ci: 1, rai: RAI[leite.rs!] },
        { id: uid(), atividadeId: emb.id, nome: emb.a, qs: emb.qs!, area: 600, ci: 1, rai: RAI[emb.rs!] },
      ],
    },
    {
      id: uid(), nome: 'CCF2 — Armazém de expedição', area: 1600, metodo: 'probabilistico', regraRai: true, itens: [], atividades: [],
      armazens: [
        { id: uid(), atividadeId: leite.id, nome: leite.a, qv: leite.qv!, altura: 4, area: 120, ci: 1.6, rai: RAI[leite.rv!] },
        { id: uid(), atividadeId: emb.id, nome: emb.a, qv: emb.qv!, altura: 6, area: 1000, ci: 1, rai: RAI[emb.rv!] },
      ],
    },
    {
      id: uid(), nome: 'CCF3 — Oficina de manutenção', area: 200, metodo: 'deterministico', regraRai: true, atividades: [], armazens: [],
      atividadeDetId: atv('Aparelhos, oficinas de reparação').id * 2, raiDet: RAI[atv('Aparelhos, oficinas de reparação').rs!],
      itens: [
        { id: uid(), produto: 'Gasóleo', hi: 42, massa: 150, ci: 1.3, rai: 1.5 },
        { id: uid(), produto: 'Madeira', hi: 16.7, massa: 800, ci: 1, rai: 1.5 },
        { id: uid(), produto: 'Borracha', hi: 42, massa: 120, ci: 1, rai: 1.5 },
      ],
    },
  ];
  xii.espacos = [
    { id: uid(), nome: 'Área de produção', piso: 'Piso 0', local: 'A', criterio: 'declarado', n: 45, area: 2400 },
    { id: uid(), nome: 'Armazém de expedição', piso: 'Piso 0', local: 'C', subtipoC: 'g', criterio: 'declarado', n: 8, area: 1600 },
    { id: uid(), nome: 'Oficina de manutenção', piso: 'Piso 0', local: 'C', subtipoC: 'a', criterio: 'declarado', n: 4, area: 200 },
  ];
  xii.liquidosInflamaveisL = 180;

  const iii = novaUT(3);
  iii.designacao = 'UT III — Serviços administrativos';
  iii.altura = 3.5;
  iii.pisos = [{ id: uid(), nome: 'Piso 0', cota: 0, area: 320 }, { id: uid(), nome: 'Piso 1', cota: 3.5, area: 320 }];
  iii.espacos = [
    { id: uid(), nome: 'Open space', piso: 'Piso 1', local: 'A', criterio: 'indice', indiceId: 'sala-escritorio', area: 210 },
    { id: uid(), nome: 'Gabinetes', piso: 'Piso 1', local: 'A', criterio: 'indice', indiceId: 'gab-escritorio', area: 60 },
    { id: uid(), nome: 'Sala de reuniões', piso: 'Piso 0', local: 'A', criterio: 'indice', indiceId: 'reuniao', area: 45 },
    { id: uid(), nome: 'Refeitório', piso: 'Piso 0', local: 'B', criterio: 'indice', indiceId: 'refeitorio', area: 140 },
    { id: uid(), nome: 'Arquivo', piso: 'Piso 0', local: 'C', subtipoC: 'g', criterio: 'declarado', n: 1, area: 40 },
  ];
  const edB = { ...JSON.parse(JSON.stringify(ed)), id: uid(), nome: 'Edifício B — serviços', altura: 3.5, pisosAcima: 2, descricao: 'Edifício de dois pisos, estrutura em betão armado, independente do edifício A.', uts: [iii] };
  ed.uts = [xii];
  p.edificios = [ed, edB];
  return p;
}

import type { Cat, UT } from '../data/types';
import { classificar, efetivoEspaco, efetivoUT, nPiso, pisosUT } from './calc';

/**
 * Rede de incêndio armada do tipo carretel — RT-SCIE (Portaria n.º 135/2020), arts. 164.º a 167.º,
 * e disposições específicas: art. 210.º n.º 6 e) (UT I), art. 257.º (UT VII rural), art. 273.º n.º 1 (UT VIII), art. 286.º n.º 1 b) (UT IX campismo).
 * O n.º de bocas é um MÍNIMO: a cobertura real (5 m de qualquer ponto) confirma-se na planta.
 */

export interface PisoRIA { n: number; nome: string; area: number; cobertura: number; escadas: number; locais200: number; minimo: number }
export interface ResultadoRIA {
  /** null = não se sabe (categoria por atribuir) */
  exigida: boolean | null;
  proibida: boolean;
  motivo: string; base: string;
  /** só os locais com mais de 200 pessoas (art. 164.º d)), não a UT inteira */
  soLocais: boolean;
  alcance: number; areaPorBoca: number;
  pisos: PisoRIA[]; total: number;
  simultaneas: number; caudalBoca: number; caudalTotal: number; K: number;
  alimentacao: string; regras: string[]; falta: string[]; notas: string[];
}

export const REGRAS_RIA = [
  'Carretéis devidamente distribuídos e sinalizados (art. 164.º).',
  'A mangueira permite atingir, por uma agulheta, todos os pontos do espaço a proteger a uma distância não superior a 5 m (art. 165.º a)).',
  'Distância entre bocas não superior ao dobro do comprimento das mangueiras (art. 165.º b)).',
  'Uma boca nos caminhos horizontais de evacuação junto à saída para cada caminho vertical, a menos de 3 m do vão de transição (art. 165.º c)).',
  'Uma boca junto à saída de cada local que possa receber mais de 200 pessoas (art. 165.º d)).',
  'Manípulo de manobra a uma altura não superior a 1,50 m; carretéis conformes com a EN 671-1 (art. 166.º n.º 1 a) e e)).',
  'Tambor fixo só à face da parede, com guia de roletes omnidirecional; encastrados de rodar ou pivotar; armário homologado com o carretel, porta a rodar 170° (art. 166.º n.º 1 b) a d)).',
  'Espaço livre a eixo do carretel com raio mínimo de 1 m em planta e 2 m de altura (art. 166.º n.º 2).',
  'Pressão da água indicada por manómetros (art. 167.º n.º 7).',
];

export function dimensionarRIA(ut: UT, cat?: Cat): ResultadoRIA {
  const t = ut.tipo;
  const cls = classificar(ut, efetivoUT(ut));
  const r = ut.ria ?? {};
  // sem dados para a calcular (projeto só de extintores): categoria indicada pelo técnico, se existir
  const catIndicada = cat === undefined && cls.falta.length > 0 && !!r.cat;
  const c = cat ?? (catIndicada ? r.cat! : cls.cat);
  const semCat = cat === undefined && cls.falta.length > 0 && !r.cat;
  const falta: string[] = [];
  const notas: string[] = [];
  const pisos0 = pisosUT(ut);
  const areaTotal = ut.areaBruta > 0 ? ut.areaBruta : pisos0.reduce((s, p) => s + (p.area || 0), 0);
  // locais > 200 pessoas: os espaços com esse efetivo (projeto completo) e os indicados à mão
  const doEspacos = (n: number) => ut.espacos.filter((e) => nPiso(e.piso) === n && efetivoEspaco(e).valor > 200).length;
  const locais = (n: number) => Math.max(doEspacos(n), Math.max(0, Math.round(r.locais200?.[String(n)] ?? 0)));
  const totalLocais200 = pisos0.reduce((s, p) => s + locais(p.n), 0);
  const gareEletrica = t === 8 && ut.extintores?.gare === 'eletrica';

  // art. 164.º — quando é exigida
  let exigida: boolean | null = false;
  let motivo = 'Rede de incêndio armada do tipo carretel não exigida para esta utilização-tipo e categoria (RT-SCIE, art. 164.º).';
  let base = 'RT-SCIE, art. 164.º';
  let soLocais = false;
  if (semCat && totalLocais200 > 0) { exigida = true; soLocais = true; motivo = 'Locais que podem receber mais de 200 pessoas: servidos por rede de incêndio armada do tipo carretel (RT-SCIE, art. 164.º d)). Sem a categoria de risco não se sabe se a UT inteira também a exige.'; base = 'RT-SCIE, art. 164.º d)'; }
  else if (semCat) { exigida = null; motivo = 'Categoria de risco por atribuir: não se sabe ainda se a rede de incêndio armada é exigida (RT-SCIE, art. 164.º).'; }
  else if ([2, 3, 4, 5, 6, 7, 8, 11, 12].includes(t) && c >= 2) { exigida = true; motivo = `UT da 2.ª categoria de risco ou superior: rede de incêndio armada do tipo carretel (RT-SCIE, art. 164.º a)).`; base = 'RT-SCIE, art. 164.º a)'; }
  else if (t === 2 && c === 1 && !ut.arLivre && areaTotal > 500) { exigida = true; motivo = `UT II da 1.ª categoria com espaços cobertos de ${areaTotal.toLocaleString('pt-PT')} m² (> 500 m²) (RT-SCIE, art. 164.º b)).`; base = 'RT-SCIE, art. 164.º b)'; }
  else if ([1, 9, 10].includes(t) && c >= 3) { exigida = true; motivo = 'UT I, IX ou X da 3.ª categoria de risco ou superior (RT-SCIE, art. 164.º c)).'; base = 'RT-SCIE, art. 164.º c)'; }
  else if (t === 9 && c >= 2 && (ut.extintores?.setores ?? 0) > 0) { exigida = true; motivo = 'Parque de campismo da 2.ª categoria ou superior: bocas a cobrir a totalidade das áreas dos setores (RT-SCIE, art. 286.º n.º 1 b)).'; base = 'RT-SCIE, art. 286.º n.º 1 b)'; }
  else if (totalLocais200 > 0) { exigida = true; soLocais = true; motivo = 'Locais que podem receber mais de 200 pessoas: servidos por rede de incêndio armada do tipo carretel (RT-SCIE, art. 164.º d)).'; base = 'RT-SCIE, art. 164.º d)'; }
  if (t === 7 && c === 2 && ut.turismoRural && exigida) { exigida = false; soLocais = false; motivo = 'UT VII da 2.ª categoria de turismo no espaço rural, de natureza ou de habitação: dispensada de rede de incêndio armada (RT-SCIE, art. 257.º).'; base = 'RT-SCIE, art. 257.º'; }
  if (t === 1 && r.salaCondominio200 && exigida === false) { exigida = true; soLocais = true; motivo = 'Sala de condomínio com área bruta superior a 200 m²: rede de incêndio armada do tipo carretel (RT-SCIE, art. 210.º n.º 6 e)).'; base = 'RT-SCIE, art. 210.º n.º 6 e)'; }
  if (t === 8 && c >= 2 && exigida) notas.push('UT VIII: o art. 164.º a) ressalva as disposições específicas do título VIII.');
  if (catIndicada) notas.push(`Categoria de risco ${c}.ª indicada pelo técnico (projeto de SCIE ou ficha de segurança), não calculada pela app.`);
  const proibida = gareEletrica;
  if (proibida) notas.push('Plataformas de embarque com tração elétrica: proibidos meios de primeira intervenção que usem água (RT-SCIE, art. 273.º n.º 1) — sem carretéis nessas plataformas.');

  // art. 165.º — n.º mínimo de bocas por piso
  const L = r.mangueira && r.mangueira > 0 ? r.mangueira : 0;
  const alcance = L ? L + 5 : 0;
  // critério técnico: cada boca cobre, no máximo, o quadrado inscrito no círculo de alcance (lado R√2 → área 2R²); a planta confirma
  const areaPorBoca = alcance ? 2 * alcance * alcance : 0;
  const escadas = Math.max(0, Math.round(r.escadas ?? 0));
  const pisos: PisoRIA[] = exigida ? pisos0.map((p) => {
    const l200 = locais(p.n);
    const cobertura = soLocais || !areaPorBoca || !(p.area > 0) ? 0 : Math.ceil(p.area / areaPorBoca);
    const pontos = (soLocais ? 0 : escadas) + l200;
    return { n: p.n, nome: p.nome, area: p.area, cobertura, escadas: soLocais ? 0 : escadas, locais200: l200, minimo: Math.max(cobertura, pontos, soLocais ? l200 : p.area > 0 ? 1 : 0) };
  }) : [];
  if (exigida && !proibida) {
    if (!L) falta.push('comprimento da mangueira dos carretéis — define o alcance (mangueira + 5 m) e a distância entre bocas (art. 165.º a) e b))');
    if (!soLocais && r.escadas === undefined) falta.push('n.º de escadas que servem os pisos — uma boca junto à saída para cada uma (art. 165.º c)); 0 se não houver');
    if (!soLocais) for (const p of pisos0) if (!(p.area > 0)) falta.push(`área do ${p.nome} — para a cobertura dos carretéis (art. 165.º a))`);
  }
  const total = pisos.reduce((s, p) => s + p.minimo, 0);

  // art. 167.º — caudal e alimentação
  const reduzido = !!r.publica && c <= 2;
  const caudalBoca = reduzido ? 1 : 1.5;
  const simultaneas = total ? Math.min(4, Math.max(1, Math.ceil(total / 2))) : 0;
  const caudalTotal = simultaneas * caudalBoca;
  const K = reduzido ? 64 : 42;
  const alimentacao = reduzido
    ? 'Rede pública com garantias de continuidade de pressão e caudal (art. 167.º n.º 5): caudal mínimo reduzido a 1 l/s por boca, com carretéis de K = 64 l/min·bar^0,5 obrigatórios (n.º 3).'
    : c <= 2
      ? 'Canalizações independentes a partir do ramal da rede pública, ramal exclusivo ou captação própria (art. 167.º n.º 4); com rede pública sem garantias ou captação própria: depósito privativo e grupo sobrepressor, com energia de emergência se elétrico (n.º 6).'
      : 'Depósito privativo associado a grupo sobrepressor; se acionado só a energia elétrica, apoiado por fontes de energia de emergência (art. 167.º n.º 6 e art. 72.º).';

  return { exigida, proibida, motivo, base, soLocais, alcance, areaPorBoca, pisos, total, simultaneas, caudalBoca, caudalTotal, K, alimentacao, regras: REGRAS_RIA, falta, notas };
}

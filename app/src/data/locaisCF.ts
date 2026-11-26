/** Locais de risco C e F — RJ-SCIE, art. 10.º n.º 1 c) e f), n.os 3 e 6 (lista exemplificativa da lei: «designadamente» / «nomeadamente»). */
export const DEF_C = 'Local com riscos particulares agravados de eclosão e desenvolvimento de incêndio, pelas atividades ou pelos produtos, materiais ou equipamentos que contém (carga de incêndio, potência, líquidos inflamáveis, volume).';
export const DEF_F = 'Local com meios e sistemas essenciais à continuidade de atividades sociais relevantes, nomeadamente centros nevrálgicos de comunicação, comando e controlo.';

export const LOCAIS_C: { a: string; t: string }[] = [
  { a: 'a', t: 'Oficina de manutenção ou reparação: carpintaria, ou com chama nua, faíscas ou elementos incandescentes junto a materiais facilmente inflamáveis' },
  { a: 'b', t: 'Farmácia, laboratório, oficina ou outro local com mais de 10 l de líquidos inflamáveis' },
  { a: 'c', t: 'Cozinha com aparelhos de confeção ou conservação com potência útil total superior a 20 kW (exceto no interior de habitações)' },
  { a: 'd', t: 'Local de confeção de alimentos com combustíveis sólidos' },
  { a: 'e', t: 'Lavandaria ou engomadoria com potência útil total superior a 20 kW' },
  { a: 'f', t: 'Instalação de frio para conservação com potência útil total superior a 70 kW' },
  { a: 'g', t: 'Arquivo, depósito, armazém ou arrecadação com volume do compartimento superior a 100 m³' },
  { a: 'h', t: 'Reprografia com área superior a 50 m²' },
  { a: 'i', t: 'Local de contentores ou compactadores de lixo com capacidade total superior a 10 m³' },
  { a: 'j', t: 'Serviços técnicos com equipamentos elétricos, eletromecânicos ou térmicos com potência útil total superior a 70 kW' },
  { a: 'k', t: 'Pintura ou aplicação de vernizes com produtos inflamáveis' },
  { a: 'l', t: 'Central de incineração' },
  { a: 'm', t: 'Estacionamento coberto com 50 a 200 m² de área bruta em edifício habitacional (exceto individuais)' },
  { a: 'n', t: 'Outro local com carga de incêndio modificada superior a 10 000 MJ e materiais facilmente inflamáveis, ou com risco de explosão' },
];
export const LOCAIS_F: { a: string; t: string }[] = [
  { a: 'a', t: 'Centro de controlo de tráfego rodoviário, ferroviário, marítimo ou aéreo' },
  { a: 'b', t: 'Centro de gestão ou despacho de emergência (112, operações de socorro, orientação de doentes urgentes)' },
  { a: 'c', t: 'Centro de comando e controlo da distribuição de água, gás ou energia elétrica' },
  { a: 'd', t: 'Central de comunicações das redes públicas' },
  { a: 'e', t: 'Centro de dados informáticos de serviços públicos com interesse social relevante' },
  { a: 'f', t: 'Posto de segurança' },
  { a: 'g', t: 'Central de bombagem para serviço de incêndio' },
];

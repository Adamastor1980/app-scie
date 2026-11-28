import type { TipoMedida } from './tipos';

/**
 * Biblioteca de perigos — SUGESTÕES para ajudar a preencher (perigo → risco → gravidade típica → medidas),
 * com as medidas ordenadas pela hierarquia dos princípios gerais de prevenção (Lei n.º 102/2009, art. 15.º n.º 2).
 * O ND e o NE não são sugeridos: dependem do que se observa no local. O técnico valida tudo antes de assinar.
 * As medidas são técnicas; a legislação específica de cada risco (equipamentos, ruído, cargas, EPI…) não faz parte da base legal da app e deve ser confirmada.
 */
export interface EntradaBiblioteca {
  id: string;
  grupo: string;
  perigo: string;
  risco: string;
  /** NC típico (Quadro 6) — confirmar caso a caso */
  nc: 10 | 25 | 60 | 100;
  medidas: [string, TipoMedida][];
}

export const GRUPOS = ['Equipamentos e máquinas', 'Trabalhos a quente', 'Eletricidade', 'Altura e quedas', 'Movimentação de cargas', 'Agentes físicos', 'Agentes químicos', 'Espaços e organização', 'Ergonomia e psicossociais'] as const;

export const BIBLIOTECA: EntradaBiblioteca[] = [
  { id: 'esmeril', grupo: 'Equipamentos e máquinas', perigo: 'Projeção de partículas e fragmentos durante a utilização do esmeril', risco: 'Lesões oculares por projeção de partículas', nc: 25, medidas: [
    ['Ajustar o resguardo e o apoio de peças (folga mínima ao disco); instalar ecrã de proteção fixo', 3], ['Inspecionar o disco antes do uso e substituir os danificados', 4], ['Uso obrigatório de óculos ou viseira de proteção', 5]] },
  { id: 'rebarbadora', grupo: 'Equipamentos e máquinas', perigo: 'Contacto com o disco e projeção de fragmentos na utilização da rebarbadora', risco: 'Cortes graves e lesões oculares', nc: 60, medidas: [
    ['Manter a proteção do disco; usar discos adequados ao material e à velocidade da máquina', 3], ['Fixar a peça a trabalhar; não retirar a proteção; formação no uso da ferramenta', 4], ['Viseira, luvas e vestuário justo ao corpo', 5]] },
  { id: 'partes-moveis', grupo: 'Equipamentos e máquinas', perigo: 'Partes móveis de máquinas acessíveis (transmissões, rolos, correias)', risco: 'Entalamento, esmagamento ou arrastamento', nc: 60, medidas: [
    ['Protetores fixos ou móveis com encravamento nas zonas perigosas', 3], ['Consignação da máquina antes de qualquer intervenção (paragem, bloqueio e etiquetagem)', 4], ['Proibir roupa larga, adornos e cabelo solto junto a partes móveis; formação', 4]] },
  { id: 'energias-residuais', grupo: 'Equipamentos e máquinas', perigo: 'Energias residuais (hidráulica, pneumática, molas, gravidade) durante a manutenção', risco: 'Movimento ou libertação inesperada — esmagamento, projeção', nc: 60, medidas: [
    ['Válvulas de descarga e pontos de purga identificados', 3], ['Procedimento de consignação com dissipação e verificação da ausência de energia', 4], ['Formação dos técnicos de manutenção no procedimento', 4]] },
  { id: 'ferramentas-manuais', grupo: 'Equipamentos e máquinas', perigo: 'Ferramentas manuais (chaves, martelos, x-atos)', risco: 'Cortes, golpes e entalamentos ligeiros', nc: 10, medidas: [
    ['Ferramentas adequadas à tarefa e em bom estado; retirar as danificadas', 4], ['Arrumação em painéis ou caixas próprias', 4], ['Luvas de proteção mecânica quando adequado', 5]] },
  { id: 'ar-comprimido', grupo: 'Equipamentos e máquinas', perigo: 'Ar comprimido (pistolas de sopro, mangueiras)', risco: 'Projeção de partículas; lesões por injeção de ar', nc: 25, medidas: [
    ['Pistolas de sopro de segurança com pressão reduzida', 2], ['Proibir a limpeza de roupa ou do corpo com ar comprimido', 4], ['Óculos de proteção', 5]] },
  { id: 'soldadura-eletrica', grupo: 'Trabalhos a quente', perigo: 'Soldadura elétrica — radiação ultravioleta/infravermelha e fumos metálicos', risco: 'Queimaduras oculares e da pele; inalação de fumos', nc: 25, medidas: [
    ['Aspiração localizada de fumos', 3], ['Biombos ou cortinas para proteger terceiros da radiação', 3], ['Formação; ventilação do local', 4], ['Máscara de soldar com filtro adequado, luvas e avental de soldador', 5]] },
  { id: 'oxicorte', grupo: 'Trabalhos a quente', perigo: 'Soldadura e oxicorte com gases (oxigénio, acetileno, propano)', risco: 'Incêndio ou explosão; queimaduras', nc: 60, medidas: [
    ['Válvulas anti-retorno de chama nos maçaricos e redutores', 3], ['Garrafas na vertical, amarradas e afastadas de fontes de calor; verificação de fugas', 4], ['Autorização de trabalho a quente, extintor junto ao posto e vigilância após o trabalho', 4], ['Óculos de soldador, luvas e vestuário não inflamável', 5]] },
  { id: 'incendio', grupo: 'Trabalhos a quente', perigo: 'Trabalhos a quente perto de materiais combustíveis ou inflamáveis', risco: 'Incêndio — queimaduras e inalação de fumos', nc: 60, medidas: [
    ['Retirar os materiais combustíveis da zona de trabalho', 1], ['Proteger com mantas ignífugas o que não puder ser retirado; extintor adequado no local', 3], ['Autorização de trabalho a quente e vigilância; trabalhadores formados no combate a incêndios (Lei n.º 102/2009, art. 20.º n.º 3)', 4]] },
  { id: 'eletrico', grupo: 'Eletricidade', perigo: 'Contacto com partes em tensão (quadros, máquinas, cabos)', risco: 'Eletrocussão ou queimaduras elétricas', nc: 100, medidas: [
    ['Trabalhar sem tensão: separar, consignar, verificar a ausência de tensão e ligar à terra', 1], ['Proteção diferencial; invólucros e quadros fechados', 3], ['Intervenções só por pessoal habilitado e formado; sinalização dos quadros', 4], ['Luvas e ferramentas isolantes quando a intervenção em tensão for inevitável', 5]] },
  { id: 'altura', grupo: 'Altura e quedas', perigo: 'Trabalhos em altura (escadas, coberturas, plataformas)', risco: 'Queda em altura', nc: 60, medidas: [
    ['Evitar o trabalho em altura sempre que possível (ex.: intervenção a partir do solo)', 1], ['Plataformas com guarda-corpos ou plataformas elevatórias em vez de escadas', 3], ['Escadas inspecionadas, bem apoiadas e usadas só para acesso ou tarefas curtas; formação', 4], ['Arnês anti-queda ligado a ponto de ancoragem quando não houver proteção coletiva', 5]] },
  { id: 'queda-nivel', grupo: 'Altura e quedas', perigo: 'Pavimentos com óleo, água ou objetos espalhados', risco: 'Queda ao mesmo nível (escorregamento, tropeçamento)', nc: 25, medidas: [
    ['Iluminação adequada das zonas de passagem', 3], ['Limpeza imediata de derrames com absorventes; arrumação das zonas de trabalho', 4], ['Calçado de segurança antiderrapante', 5]] },
  { id: 'queda-objetos', grupo: 'Altura e quedas', perigo: 'Queda de objetos de estantes ou de cargas suspensas', risco: 'Esmagamento ou traumatismos por queda de objetos', nc: 25, medidas: [
    ['Estantes fixadas, com carga máxima indicada', 3], ['Proibir a permanência sob cargas suspensas; arrumação dos materiais pesados em baixo', 4], ['Capacete e calçado de segurança', 5]] },
  { id: 'mmc', grupo: 'Movimentação de cargas', perigo: 'Movimentação manual de cargas (peças, motores, sacos)', risco: 'Lesões músculo-esqueléticas por sobre-esforço', nc: 25, medidas: [
    ['Meios mecânicos de elevação (carrinhos, gruas, porta-paletes)', 2], ['Limitar o peso por pessoa; tarefas a dois para cargas pesadas', 4], ['Formação em técnicas de movimentação manual', 4]] },
  { id: 'empilhador', grupo: 'Movimentação de cargas', perigo: 'Circulação de empilhadores e porta-paletes elétricos', risco: 'Atropelamento, colisão ou queda da carga', nc: 60, medidas: [
    ['Separar vias de peões e de veículos; espelhos nos cruzamentos', 3], ['Sinalização e limite de velocidade; condução só por operadores formados e autorizados', 4], ['Colete de alta visibilidade e calçado de segurança', 5]] },
  { id: 'ponte-rolante', grupo: 'Movimentação de cargas', perigo: 'Elevação de cargas com ponte rolante, diferencial ou grua', risco: 'Queda da carga — esmagamento', nc: 100, medidas: [
    ['Limitador de carga e fins de curso operacionais', 3], ['Acessórios de elevação inspecionados (cintas, correntes, ganchos com patilha)', 4], ['Operação só por pessoal formado; zona de manobra delimitada; ninguém sob a carga', 4], ['Capacete e calçado de segurança', 5]] },
  { id: 'ruido', grupo: 'Agentes físicos', perigo: 'Exposição a ruído (máquinas, compressores, ferramentas)', risco: 'Perda de audição (hipoacusia)', nc: 25, medidas: [
    ['Substituir equipamentos ruidosos por outros menos ruidosos', 2], ['Enclausurar ou isolar as fontes de ruído', 3], ['Avaliar a exposição; limitar o tempo de exposição; sinalizar as zonas; vigilância da saúde (Lei n.º 102/2009, art. 15.º n.º 8)', 4], ['Protetores auriculares adequados', 5]] },
  { id: 'vibracoes', grupo: 'Agentes físicos', perigo: 'Ferramentas vibratórias (martelos pneumáticos, rebarbadoras)', risco: 'Lesões nas mãos e braços por vibração', nc: 10, medidas: [
    ['Ferramentas de baixa vibração', 2], ['Limitar o tempo de utilização contínua; pausas', 4], ['Luvas antivibração', 5]] },
  { id: 'termico', grupo: 'Agentes físicos', perigo: 'Superfícies, tubagens ou fluidos quentes (vapor, óleo térmico)', risco: 'Queimaduras por contacto ou projeção', nc: 25, medidas: [
    ['Isolamento térmico das superfícies quentes acessíveis', 3], ['Arrefecer e despressurizar antes de intervir; sinalização', 4], ['Luvas e vestuário de proteção térmica', 5]] },
  { id: 'iluminacao', grupo: 'Agentes físicos', perigo: 'Iluminação insuficiente nos postos de trabalho', risco: 'Quedas, cortes e fadiga visual', nc: 10, medidas: [
    ['Reforçar a iluminação geral e localizada', 3], ['Iluminação portátil para intervenções em zonas escuras', 4]] },
  { id: 'quimicos', grupo: 'Agentes químicos', perigo: 'Óleos, solventes, desengordurantes e outros produtos químicos', risco: 'Dermatites, queimaduras químicas, intoxicação por inalação', nc: 25, medidas: [
    ['Substituir por produtos menos perigosos', 2], ['Ventilação ou aspiração localizada', 3], ['Fichas de dados de segurança disponíveis; rotulagem e armazenamento adequados; formação (Lei n.º 102/2009, art. 15.º n.º 2 d))', 4], ['Luvas resistentes ao produto e óculos de proteção', 5]] },
  { id: 'espaco-confinado', grupo: 'Espaços e organização', perigo: 'Entrada em espaços confinados (tanques, silos, fossas, condutas)', risco: 'Asfixia ou intoxicação por atmosfera perigosa', nc: 100, medidas: [
    ['Evitar a entrada: intervir pelo exterior sempre que possível', 1], ['Ventilação forçada e medição contínua da atmosfera', 3], ['Autorização de entrada, vigia no exterior e plano de resgate', 4], ['Arnês com linha de resgate e proteção respiratória adequada', 5]] },
  { id: 'trabalho-isolado', grupo: 'Espaços e organização', perigo: 'Trabalho isolado em tarefas de risco (turnos, fins de semana)', risco: 'Ausência de socorro em caso de acidente', nc: 60, medidas: [
    ['Evitar o trabalho isolado nas tarefas de maior risco', 1], ['Meios de comunicação ou alarme de homem caído', 3], ['Procedimento de contacto periódico e de emergência (Lei n.º 102/2009, art. 15.º n.º 9)', 4]] },
  { id: 'terceiros', grupo: 'Espaços e organização', perigo: 'Trabalhos de empresas externas na instalação', risco: 'Acidentes por falta de coordenação e de informação sobre os riscos', nc: 60, medidas: [
    ['Informação às empresas externas sobre os riscos e as medidas (Lei n.º 102/2009, art. 19.º n.º 5)', 4], ['Autorização de trabalho e acompanhamento dos trabalhos', 4]] },
  { id: 'posturas', grupo: 'Ergonomia e psicossociais', perigo: 'Posturas forçadas e trabalho repetitivo (intervenções em espaços apertados)', risco: 'Lesões músculo-esqueléticas', nc: 10, medidas: [
    ['Adaptar o posto, os acessos e as ferramentas (Lei n.º 102/2009, art. 15.º n.º 2 e))', 3], ['Pausas e rotação de tarefas', 4]] },
  { id: 'psicossociais', grupo: 'Ergonomia e psicossociais', perigo: 'Pressão para repor rapidamente a produção (avarias urgentes, turnos)', risco: 'Fadiga, stress e erro humano', nc: 10, medidas: [
    ['Planeamento da manutenção preventiva para reduzir intervenções urgentes', 4], ['Organização dos turnos e pausas; procedimentos claros (Lei n.º 102/2009, art. 15.º n.º 2 d) e e))', 4]] },
];

/** Tipos de local: perigos habituais a sugerir quando se indica o local avaliado (sugestões — confirmar no local) */
export const LOCAIS_TIPO: { nome: string; ids: string[] }[] = [
  { nome: 'Oficina de manutenção', ids: ['esmeril', 'rebarbadora', 'ferramentas-manuais', 'ar-comprimido', 'soldadura-eletrica', 'oxicorte', 'eletrico', 'queda-nivel', 'mmc', 'ruido', 'quimicos', 'incendio'] },
  { nome: 'Linha de produção / máquinas', ids: ['partes-moveis', 'energias-residuais', 'ruido', 'vibracoes', 'termico', 'queda-nivel', 'mmc', 'posturas', 'eletrico', 'psicossociais'] },
  { nome: 'Armazém / logística', ids: ['empilhador', 'queda-objetos', 'mmc', 'queda-nivel', 'altura', 'iluminacao', 'incendio', 'posturas'] },
  { nome: 'Trabalhos em altura / coberturas', ids: ['altura', 'queda-objetos', 'eletrico', 'termico', 'trabalho-isolado'] },
  { nome: 'Quadros e instalações elétricas', ids: ['eletrico', 'incendio', 'energias-residuais', 'trabalho-isolado'] },
  { nome: 'Espaços confinados (tanques, silos, fossas)', ids: ['espaco-confinado', 'quimicos', 'trabalho-isolado', 'iluminacao', 'eletrico'] },
  { nome: 'Laboratório / produtos químicos', ids: ['quimicos', 'incendio', 'termico', 'posturas'] },
  { nome: 'Escritório', ids: ['queda-nivel', 'posturas', 'iluminacao', 'eletrico', 'psicossociais', 'incendio'] },
  { nome: 'Empresas externas na instalação', ids: ['terceiros', 'altura', 'eletrico', 'oxicorte', 'soldadura-eletrica', 'espaco-confinado'] },
];

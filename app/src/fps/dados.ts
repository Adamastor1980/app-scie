import type { FPS, TrabalhoFPS } from './tipos';

export const fid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const p = () => ({ nome: '', funcao: '', contacto: '' });

/** Texto de partida dos procedimentos de emergência (sugestão — o técnico adapta ao estaleiro) */
export const EMERGENCIA_SUGERIDA = `1. Em caso de acidente: parar os trabalhos, proteger o local e não mover o sinistrado, salvo perigo iminente.
2. Ligar 112 e dar: o quê, onde (morada e acesso ao estaleiro), quantas vítimas e o seu estado.
3. Avisar o responsável da entidade executante e o dono da obra; prestar os primeiros socorros só quem tiver formação.
4. Em caso de incêndio: dar o alarme, usar o extintor só se for seguro e evacuar para o ponto de encontro.
5. Em caso de eletrização: cortar a corrente antes de tocar na vítima.
6. Esperar pelos meios de socorro no acesso ao estaleiro, para os encaminhar.`;

export const novoTrabalho = (): TrabalhoFPS => ({ id: fid(), descricao: '', riscosEspeciais: [], riscos: '', medidas: [], epi: '' });
export const novaFPS = (): FPS => ({
  id: fid(), titulo: 'Ficha de procedimentos de segurança', codigo: '', revisao: '00', data: new Date().toISOString().slice(0, 10),
  tipoTrabalho: [],
  obra: { designacao: '', localizacao: '', coordenadas: '', caracterizacao: '', inicio: '', fim: '' },
  donoObra: p(), executante: p(), diretorTecnico: p(), tecnicoSST: p(), coordenadorObra: p(),
  subempreiteiros: [], trabalhos: [],
  condicionantes: { terreno: '', redes: '', atividades: '', outras: '' },
  emergencia: { contactos: [{ id: fid(), nome: 'Emergência', telefone: '112' }], pontoEncontro: '', procedimentos: EMERGENCIA_SUGERIDA },
  analiseCSO: { nome: '', data: '', observacoes: '' },
  revisoes: [], criadoEm: Date.now(), atualizadoEm: Date.now(),
});

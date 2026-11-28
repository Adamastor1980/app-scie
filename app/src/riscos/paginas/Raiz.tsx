import { match } from '../../router';
import Lista from './Lista';
import Editor from './Editor';
import Relatorio from './Relatorio';

/** Rotas do módulo «Avaliação de riscos» (independente do SCIE) */
export default function RiscosRaiz({ path }: { path: string }) {
  const rel = match('/riscos/a/:id/relatorio', path);
  if (rel) return <Relatorio id={rel.id} />;
  const sec = match('/riscos/a/:id/:sec', path) ?? match('/riscos/a/:id', path);
  if (sec) return <Editor id={sec.id} sec={sec.sec ?? 'identificacao'} />;
  return <Lista />;
}

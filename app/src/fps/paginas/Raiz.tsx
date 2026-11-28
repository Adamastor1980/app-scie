import { match } from '../../router';
import Lista from './Lista';
import Editor from './Editor';
import Documento from './Documento';

/** Rotas do módulo FPS (independente) */
export default function FPSRaiz({ path }: { path: string }) {
  const d = match('/fps/f/:id/documento', path);
  if (d) return <Documento id={d.id} />;
  const e = match('/fps/f/:id/:sec', path) ?? match('/fps/f/:id', path);
  if (e) return <Editor id={e.id} sec={e.sec ?? 'enquadramento'} />;
  return <Lista />;
}

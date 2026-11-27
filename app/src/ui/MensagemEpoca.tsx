import { TreePine } from 'lucide-react';

/** Época de Natal: de 1 de dezembro a 6 de janeiro (Dia de Reis); fora disso não aparece */
export const epocaNatal = (d = new Date()) => (d.getMonth() === 11) || (d.getMonth() === 0 && d.getDate() <= 6);

/** Mensagem de Natal ligada à segurança — aparece só na época, sozinha */
export default function MensagemEpoca({ hoje = new Date() }: { hoje?: Date }) {
  if (!epocaNatal(hoje)) return null;
  return (
    <div className="flex items-start gap-3 border-l-[3px] border-ok bg-ok-soft px-4 py-3 text-[13px]">
      <TreePine size={22} className="mt-0.5 shrink-0 text-ok" />
      <div>
        <p className="font-semibold text-ok">Tenha um excelente Natal — sempre em segurança! :)</p>
        <p className="mt-0.5 text-[12.5px] text-ink-2">Não deixe velas acesas nem luzes de Natal ligadas sem ninguém por perto, e não sobrecarregue as tomadas e extensões.</p>
      </div>
    </div>
  );
}

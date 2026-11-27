import { Phone } from 'lucide-react';

/** «Detetou alguma anomalia?» — contacto do responsável de segurança (RJ-SCIE, art. 6.º), se indicado no projeto */
export default function ContactoAnomalia({ nome, telefone, empresa, carretel }: { nome?: string; telefone?: string; empresa?: string; carretel?: boolean }) {
  if (!nome?.trim() && !telefone?.trim()) return null;
  const tel = (telefone ?? '').replace(/[^\d+]/g, '');
  return (
    <div className="border-l-[3px] border-alerta bg-white px-4 py-3 text-[13px]">
      <p className="font-semibold">Detetou alguma anomalia neste {carretel ? 'carretel' : 'extintor'}?</p>
      <p className="mt-0.5 text-[12px] text-ink-3">{carretel ? 'Por exemplo: danificado, com fuga, mangueira solta ou acesso obstruído.' : 'Por exemplo: usado, danificado, sem selo, manómetro fora da zona verde ou fora do lugar.'} Contacte:</p>
      <p className="mt-2"><span className="font-semibold">{nome?.trim() || 'Responsável de segurança'}</span><span className="text-ink-3"> · responsável de segurança</span></p>
      {tel && <a href={`tel:${tel}`} className="mt-2 inline-flex h-11 items-center gap-2 border border-ink bg-white px-4 font-semibold hover:bg-paper"><Phone size={16} /> {telefone}</a>}
      {empresa && <p className="mt-2 text-[12px] text-ink-3">Manutenção: {empresa}</p>}
    </div>
  );
}

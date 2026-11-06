const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const sel = "w-full rounded-xl border border-input bg-card px-3 py-3 outline-none focus:border-primary";

export type Nasc = { dia: string; mes: string; ano: string };

/** Retorna "AAAA-MM-DD" se a data for válida, senão null. */
export function nascParaISO(n: Nasc): string | null {
  const d = +n.dia, m = +n.mes, a = +n.ano;
  if (!d || !m || !a) return null;
  const dt = new Date(a, m - 1, d);
  if (dt.getDate() !== d || dt.getMonth() !== m - 1 || dt > new Date()) return null;
  return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CampoNascimento({ valor, onChange }: { valor: Nasc; onChange: (n: Nasc) => void }) {
  const anoAtual = new Date().getFullYear();
  return (
    <div>
      <p className="mb-1 text-sm text-muted-foreground">Data de aniversário</p>
      <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
        <select aria-label="Dia" className={sel} value={valor.dia} onChange={(e) => onChange({ ...valor, dia: e.target.value })}>
          <option value="">Dia</option>
          {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
        </select>
        <select aria-label="Mês" className={sel} value={valor.mes} onChange={(e) => onChange({ ...valor, mes: e.target.value })}>
          <option value="">Mês</option>
          {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select aria-label="Ano" className={sel} value={valor.ano} onChange={(e) => onChange({ ...valor, ano: e.target.value })}>
          <option value="">Ano</option>
          {Array.from({ length: 100 }, (_, i) => anoAtual - i).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
    </div>
  );
}

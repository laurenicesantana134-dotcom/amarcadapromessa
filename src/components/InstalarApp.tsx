import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstalarApp({ className = "" }: { className?: string }) {
  const [ev, setEv] = useState<BIP | null>(null);
  const [instalado, setInstalado] = useState(false);
  const [ajuda, setAjuda] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalado(true);
    const h = (e: Event) => { e.preventDefault(); setEv(e as BIP); };
    const ok = () => setInstalado(true);
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", ok);
    return () => { window.removeEventListener("beforeinstallprompt", h); window.removeEventListener("appinstalled", ok); };
  }, []);

  if (instalado) return null;

  const clicar = async () => {
    if (ev) { await ev.prompt(); await ev.userChoice; setEv(null); return; }
    setAjuda((a) => !a);
  };

  return (
    <div className={className}>
      <button onClick={clicar} className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-7 py-4 font-semibold">
        <Download className="h-4 w-4 text-primary" /> Baixar o aplicativo
      </button>
      {ajuda && (
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          No Google Chrome, toque nos três pontinhos (⋮) no canto da tela e escolha <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>. No iPhone, toque em Compartilhar e depois em "Adicionar à Tela de Início".
        </p>
      )}
    </div>
  );
}

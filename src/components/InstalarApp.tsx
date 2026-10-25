import { useEffect, useState } from "react";
import { Download, Smartphone, Share, MoreVertical } from "lucide-react";

type BIP = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" | string }>;
};

type Plataforma = "ios" | "android" | "outra";

export function InstalarApp({ className = "" }: { className?: string }) {
  const [ev, setEv] = useState<BIP | null>(null);
  const [instalado, setInstalado] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const [plataforma, setPlataforma] = useState<Plataforma>("outra");

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const ios =
      /iPhone|iPad|iPod/i.test(nav.userAgent) ||
      (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);

    setPlataforma(ios ? "ios" : /Android/i.test(nav.userAgent) ? "android" : "outra");

    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true
    ) {
      setInstalado(true);
    }

    const h = (e: Event) => {
      e.preventDefault();
      setEv(e as BIP);
    };
    const ok = () => {
      setInstalado(true);
      setAjuda(false);
    };

    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", ok);
    return () => {
      window.removeEventListener("beforeinstallprompt", h);
      window.removeEventListener("appinstalled", ok);
    };
  }, []);

  if (instalado) return null;

  const clicar = async () => {
    if (ev) {
      try {
        await ev.prompt();
        const escolha = await ev.userChoice;
        setEv(null);
        if (escolha.outcome === "accepted") {
          setInstalado(true);
          return;
        }
      } catch {
        // Se o navegador não conseguir abrir a instalação, mostramos as instruções manuais.
        setEv(null);
      }
    }
    setAjuda((aberta) => !aberta);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={clicar}
        aria-expanded={ajuda}
        aria-controls="instrucoes-instalar-app"
        className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-7 py-4 font-semibold"
      >
        <Download className="h-4 w-4 text-primary" />
        Baixar o aplicativo
      </button>

      {ajuda && (
        <section
          id="instrucoes-instalar-app"
          className="mt-4 w-[min(90vw,28rem)] max-w-[90vw] rounded-2xl border border-primary/30 bg-card p-5 text-left text-sm text-foreground shadow-lg"
          aria-live="polite"
        >
          <div className="mb-3 flex items-center gap-2">
            <Smartphone className="h-5 w-5 shrink-0 text-primary" />
            <h3 className="font-semibold">Instale A Marca da Promessa no celular</h3>
          </div>

          {plataforma === "ios" ? (
            <>
              <p className="mb-3 text-muted-foreground">
                No iPhone ou iPad, a instalação é feita pelo Safari. Se abriu este site em outro aplicativo ou navegador, abra o endereço do site no Safari primeiro.
              </p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>Abra o site no <strong>Safari</strong>.</li>
                <li>
                  Toque em <strong>Compartilhar</strong>
                  <Share className="mx-1 inline h-4 w-4 align-text-bottom" />
                  .
                </li>
                <li>Role as opções e toque em <strong>Adicionar à Tela de Início</strong>. Se essa opção não aparecer, procure em “Editar Ações”.</li>
                <li>Se aparecer a opção <strong>Abrir como App da Web</strong>, ative-a e toque em <strong>Adicionar</strong>.</li>
              </ol>
            </>
          ) : plataforma === "android" ? (
            <>
              <p className="mb-3 text-muted-foreground">
                Primeiro, tente a instalação automática pelo botão. Se ela não aparecer, siga estes passos:
              </p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>Abra este site no <strong>Google Chrome</strong> ou no navegador principal do celular. Se estiver dentro do WhatsApp ou Instagram, abra o menu e escolha abrir no navegador.</li>
                <li>
                  Toque no menu de três pontinhos
                  <MoreVertical className="mx-1 inline h-4 w-4 align-text-bottom" />
                  do navegador.
                </li>
                <li>Escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>. O nome pode variar conforme o celular e o navegador.</li>
                <li>Confirme em <strong>Instalar</strong> ou <strong>Adicionar</strong>. Depois, procure o ícone da barbearia na tela inicial ou na lista de aplicativos.</li>
              </ol>
            </>
          ) : (
            <>
              <p className="mb-3 text-muted-foreground">
                A instalação depende do aparelho e do navegador. No celular, abra este site no navegador principal e procure a opção de instalar ou adicionar à tela inicial.
              </p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>No Android, tente o Google Chrome e abra o menu de três pontinhos.</li>
                <li>Escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>, se disponível.</li>
                <li>No iPhone ou iPad, abra o site no Safari, toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.</li>
              </ol>
            </>
          )}

          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            Se a opção de instalação não aparecer, isso pode ser uma limitação do navegador ou do aparelho. Você ainda pode acessar a plataforma normalmente pelo navegador.
          </p>
        </section>
      )}
    </div>
  );
}

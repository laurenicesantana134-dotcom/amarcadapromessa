import { Link } from "@tanstack/react-router";
import { Crown, CalendarCheck, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { waLink } from "@/lib/barbearia";

export function Header() {
  const { user, carregando } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-primary/40 bg-gold-soft text-primary"><Crown className="h-4 w-4" /></span>
          <span className="leading-tight">
            <span className="block text-[10px] tracking-[0.3em] text-muted-foreground">BARBEARIA</span>
            <span className="font-serif text-lg text-primary">A Marca da Promessa</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
        {!carregando && (
          <Link to={user ? "/conta" : "/entrar"} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold">
            <User className="h-4 w-4" /> {user ? "Minha conta" : "Criar cadastro"}
          </Link>
        )}
        <Link to="/agendar" search={{}} className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold">
          <CalendarCheck className="h-4 w-4" /> Agendar
        </Link>
        </div>
      </div>
    </header>
  );
}

export function WhatsFab() {
  return (
    <a href={waLink()} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg">
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}

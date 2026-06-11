import Link from "next/link";
import { Trophy, Shield, LogOut, CalendarDays, Star } from "lucide-react";
import { signOut } from "@/lib/actions";
import type { Profile } from "@/lib/types";

export function AppShell({
  profile,
  children
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-pitch/90 backdrop-blur">
        <div className="cup-stripe h-1" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-3 text-lg font-black">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-grass text-pitch shadow-cup">
              <Trophy size={20} />
            </span>
            <span className="leading-tight">
              <span className="block">BolãoApp</span>
              <span className="block text-[11px] font-black uppercase tracking-wide text-cupGold">
                Copa do Mundo 2026
              </span>
            </span>
          </Link>

          <nav className="scrollbar-none flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto overscroll-x-contain">
            {profile ? (
              <>
                <Link className="btn-secondary px-3" href="/">
                  <CalendarDays size={18} />
                  <span className="hidden sm:inline">Jogos</span>
                </Link>
                <Link className="btn-secondary px-3" href="/leaderboard">
                  <Trophy size={18} />
                  <span className="hidden sm:inline">Leaderboard</span>
                </Link>
                <Link
                  className="btn-premium"
                  href="/premium"
                >
                  <Star size={18} />
                  <span className="hidden sm:inline">Bolão Premium</span>
                </Link>
                {profile.role === "super_admin" ? (
                  <Link className="btn-secondary px-3" href="/admin">
                    <Shield size={18} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                ) : null}
                {profile.role !== "super_admin" ? (
                  <form action={signOut}>
                    <button className="btn-secondary px-3" title="Sair">
                      <LogOut size={18} />
                    </button>
                  </form>
                ) : null}
              </>
            ) : (
              <>
                <Link className="btn-secondary" href="/login">
                  Entrar
                </Link>
                <Link className="btn-primary" href="/signup">
                  Criar conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      {profile?.role === "super_admin" ? (
        <footer className="mx-auto max-w-6xl px-4 pb-6">
          <form action={signOut}>
            <button className="btn-secondary w-full border-red-400/30 text-red-100 hover:bg-red-500/10">
              <LogOut size={18} />
              Sair
            </button>
          </form>
        </footer>
      ) : null}
    </div>
  );
}

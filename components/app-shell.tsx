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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-black">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-grass text-pitch">
              <Trophy size={20} />
            </span>
            BolaoApp
          </Link>

          <nav className="flex items-center gap-1">
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
                  className="btn-secondary border-amber-300/30 bg-amber-300/10 px-3 text-amber-100 hover:border-amber-300/70 hover:bg-amber-300/20"
                  href="/premium"
                >
                  <Star size={18} />
                  <span className="hidden sm:inline">Bolao Premium</span>
                </Link>
                {profile.role === "super_admin" ? (
                  <Link className="btn-secondary px-3" href="/admin">
                    <Shield size={18} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                ) : null}
                <form action={signOut}>
                  <button className="btn-secondary px-3" title="Sair">
                    <LogOut size={18} />
                  </button>
                </form>
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
    </div>
  );
}

import Link from "next/link";
import { signIn } from "@/lib/actions";
import { AppShell } from "@/components/app-shell";

export default function LoginPage({
  searchParams
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <AppShell profile={null}>
      <section className="mx-auto max-w-md">
        <div className="surface p-5">
          <h1 className="text-2xl font-black">Entrar</h1>
          <form action={signIn} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Email
              <input className="field" name="email" required type="email" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Senha
              <input className="field" minLength={6} name="password" required type="password" />
            </label>
            {searchParams.error ? (
              <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
                {searchParams.error}
              </p>
            ) : null}
            {searchParams.message ? (
              <p className="rounded-md border border-mint/30 bg-mint/10 p-3 text-sm text-mint">
                {searchParams.message}
              </p>
            ) : null}
            <button className="btn-primary">Entrar</button>
          </form>
          <p className="mt-4 text-sm text-ink/70">
            Ainda nao tem conta?{" "}
            <Link className="font-bold text-mint" href="/signup">
              Criar conta
            </Link>
          </p>
        </div>
      </section>
    </AppShell>
  );
}

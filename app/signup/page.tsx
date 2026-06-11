import Link from "next/link";
import { signUp } from "@/lib/actions";
import { AppShell } from "@/components/app-shell";

export default function SignUpPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  return (
    <AppShell profile={null}>
      <section className="mx-auto max-w-md">
        <div className="surface p-5">
          <h1 className="text-2xl font-black">Criar conta</h1>
          <form action={signUp} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Nome
              <input className="field" name="name" required />
            </label>
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
            <button className="btn-primary">Cadastrar</button>
          </form>
          <p className="mt-4 text-sm text-ink/70">
            Ja tem conta?{" "}
            <Link className="font-bold text-mint" href="/login">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </AppShell>
  );
}

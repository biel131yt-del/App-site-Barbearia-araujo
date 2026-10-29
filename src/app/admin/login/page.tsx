"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!login.trim() || !senha) return setErro("Digite login e senha.");

    setCarregando(true);
    try {
      // redirect: true é o padrão do NextAuth e define o cookie de sessão automaticamente
      await signIn("credentials", {
        login: login.trim().toLowerCase(),
        senha,
        redirect: true,
        callbackUrl: params.get("callbackUrl") ?? "/admin",
      });
    } catch {
      setErro("Erro ao conectar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="bg-barber flex min-h-screen items-center justify-center bg-brand-950 p-5">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 text-white">
          <Scissors className="h-6 w-6" />
        </span>
        <h1 className="mt-3 text-xl font-extrabold text-white">Painel do dono</h1>
        <p className="text-sm text-slate-400">Entre para gerenciar a barbearia</p>

        <form onSubmit={entrar} className="mt-4 grid gap-3">
          <Input
            rotulo="Login"
            name="login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
          />
          <Input
            rotulo="Senha"
            name="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && entrar(e)}
            autoComplete="current-password"
          />
          {erro && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-accent">
              {erro}
            </p>
          )}
          <Button
            className="mt-4 w-full"
            size="lg"
            disabled={carregando}
            type="submit"
          >
            {carregando ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

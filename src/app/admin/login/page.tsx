"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Login do painel — mobile-first. Primeiro acesso: login "dono" / senha "araujo123" (troque!).
export default function AdminLogin() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro("");
    if (!login.trim() || !senha) return setErro("Digite login e senha.");
    setCarregando(true);
    const r = await signIn("credentials", { login: login.trim().toLowerCase(), senha, redirect: false });
    setCarregando(false);
    if (r?.error) return setErro("Login ou senha inválidos.");
    router.push(params.get("callbackUrl") ?? "/admin");
  }

  return (
    <div className="bg-barber flex min-h-screen items-center justify-center bg-brand-950 p-5">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 text-white">
          <Scissors className="h-6 w-6" />
        </span>
        <h1 className="mt-3 text-xl font-extrabold text-white">Painel do dono</h1>
        <p className="text-sm text-slate-400">Entre para gerenciar a barbearia</p>
        <div className="mt-4 grid gap-3">
          <Input rotulo="Login" name="login" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" />
          <Input
            rotulo="Senha"
            name="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && entrar()}
            autoComplete="current-password"
          />
        </div>
        {erro && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-accent">
            {erro}
          </p>
        )}
        <Button className="mt-4 w-full" size="lg" onClick={entrar} disabled={carregando}>
          {carregando ? "Entrando…" : "Entrar"}
        </Button>
      </div>
    </div>
  );
}

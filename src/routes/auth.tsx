import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "./_authenticated/app";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — VagaMatch" },
      { name: "description", content: "Entre no VagaMatch para gerar currículos ATS para suas vagas." },
      { property: "og:title", content: "Entrar — VagaMatch" },
      { property: "og:description", content: "Entre no VagaMatch para gerar currículos ATS para suas vagas." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/app" }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: "/app" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    setLoading(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("Conta criada! Confira seu e-mail para confirmar.");
      }
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(msg.includes("Invalid login") ? "E-mail ou senha incorretos." : msg);
    } finally { setLoading(false); }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Não foi possível entrar com Google.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-accent px-4">
      <Card className="w-full max-w-sm shadow-soft">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="pt-2 text-2xl">Vaga<span className="text-primary">Match</span></CardTitle>
          <CardDescription>{modo === "entrar" ? "Entre na sua conta" : "Crie sua conta grátis"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>
          <div className="text-center text-xs text-muted-foreground">ou</div>
          <form onSubmit={enviar} className="space-y-3">
            <Input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" required minLength={6} placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}</Button>
          </form>
          <button type="button" className="w-full text-sm text-primary" onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")}>
            {modo === "entrar" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

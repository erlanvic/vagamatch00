import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { analyzeAndGenerate, type Analysis, type Profile } from "@/lib/ai.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VagaMatch — Currículo ATS para cada vaga" },
      { name: "description", content: "Gere currículos ATS personalizados e veja seu match com cada vaga." },
      { property: "og:title", content: "VagaMatch — Currículo ATS para cada vaga" },
      { property: "og:description", content: "Gere currículos ATS personalizados e veja seu match com cada vaga." },
    ],
  }),
  component: App,
});

type Vaga = { id: string; empresa: string; cargo: string; descricao: string; analise: Analysis; criadaEm: number };

const emptyProfile: Profile = {
  nome: "", contato: "", links: "", resumo: "", experiencias: "", formacao: "", cursos: "", habilidades: "", idiomas: "",
};
const fields: { key: keyof Profile; label: string; long?: boolean; ph?: string }[] = [
  { key: "nome", label: "Nome completo" },
  { key: "contato", label: "Contato", ph: "E-mail, telefone, cidade" },
  { key: "links", label: "Links", ph: "LinkedIn, portfólio, GitHub" },
  { key: "resumo", label: "Resumo", long: true },
  { key: "experiencias", label: "Experiências", long: true, ph: "Cargo — Empresa (MM/AAAA – MM/AAAA)\n- Conquista ou responsabilidade" },
  { key: "formacao", label: "Formação", long: true },
  { key: "cursos", label: "Cursos", long: true },
  { key: "habilidades", label: "Habilidades", ph: "Separadas por vírgula" },
  { key: "idiomas", label: "Idiomas", ph: "Inglês avançado, Espanhol básico" },
];

function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setV(JSON.parse(s)); } catch { /* ignore */ }
    setReady(true);
  }, [key]);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(v)); }, [key, v, ready]);
  return [v, setV] as const;
}

function Logo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8 L14 25" className="stroke-primary" />
        <path d="M14 25 L27 5" className="stroke-success" />
      </svg>
    </div>
  );
}

function App() {
  const [perfil, setPerfil] = useLocal<Profile>("vm-perfil", emptyProfile);
  const [vagas, setVagas] = useLocal<Vaga[]>("vm-vagas", []);
  const [tab, setTab] = useState("perfil");
  const [atualId, setAtualId] = useState<string | null>(null);
  const [nova, setNova] = useState({ empresa: "", cargo: "", descricao: "" });
  const [importTxt, setImportTxt] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState<"import" | "analyze" | null>(null);
  const call = useServerFn(analyzeAndGenerate);

  const atual = vagas.find((v) => v.id === atualId) ?? null;

  async function importar() {
    if (importTxt.trim().length < 20) return toast.error("Cole o texto do seu currículo.");
    setLoading("import");
    try {
      const p = (await call({ data: { mode: "import", texto: importTxt } })) as Profile;
      setPerfil(p); setShowImport(false); setImportTxt("");
      toast.success("Perfil preenchido! Revise os campos.");
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(null); }
  }

  async function analisar() {
    if (!perfil.nome && !perfil.experiencias) return toast.error("Preencha seu perfil primeiro.");
    if (!nova.cargo || nova.descricao.trim().length < 20) return toast.error("Informe o cargo e cole a descrição da vaga.");
    setLoading("analyze");
    try {
      const a = (await call({ data: { mode: "analyze", perfil, vaga: nova } })) as Analysis;
      const v: Vaga = { id: crypto.randomUUID(), ...nova, analise: { ...a, score: Math.max(0, Math.min(100, Math.round(a.score))) }, criadaEm: Date.now() };
      setVagas((vs) => [v, ...vs]); setAtualId(v.id); setNova({ empresa: "", cargo: "", descricao: "" }); setTab("resultado");
      toast.success("Currículo gerado!");
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(null); }
  }

  const editCurriculo = (txt: string) =>
    setVagas((vs) => vs.map((v) => (v.id === atualId ? { ...v, analise: { ...v.analise, curriculo: txt } } : v)));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <Logo />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Vaga<span className="text-primary">Match</span></h1>
            <p className="text-xs text-muted-foreground">Currículo ATS sob medida para cada vaga</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="perfil">Meu perfil</TabsTrigger>
            <TabsTrigger value="nova">Nova vaga</TabsTrigger>
            <TabsTrigger value="resultado">Resultado</TabsTrigger>
            <TabsTrigger value="vagas">Minhas vagas ({vagas.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="mt-6">
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Meu perfil</CardTitle>
                  <CardDescription>Salvo automaticamente neste navegador.</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowImport((s) => !s)}>Importar texto do meu currículo atual</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showImport && (
                  <div className="space-y-2 rounded-lg bg-accent p-4">
                    <Textarea rows={8} placeholder="Cole aqui o texto do seu currículo…" value={importTxt} onChange={(e) => setImportTxt(e.target.value)} className="bg-background" />
                    <Button onClick={importar} disabled={loading === "import"}>{loading === "import" ? "Lendo currículo…" : "Preencher com IA"}</Button>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map((f) => (
                    <label key={f.key} className={f.long ? "space-y-1 sm:col-span-2" : "space-y-1"}>
                      <span className="text-sm font-semibold">{f.label}</span>
                      {f.long ? (
                        <Textarea rows={f.key === "experiencias" ? 8 : 4} placeholder={f.ph} value={perfil[f.key]} onChange={(e) => setPerfil({ ...perfil, [f.key]: e.target.value })} />
                      ) : (
                        <Input placeholder={f.ph} value={perfil[f.key]} onChange={(e) => setPerfil({ ...perfil, [f.key]: e.target.value })} />
                      )}
                    </label>
                  ))}
                </div>
                <Button onClick={() => setTab("nova")}>Continuar para a vaga</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nova" className="mt-6">
            <Card className="shadow-soft">
              <CardHeader><CardTitle>Nova vaga</CardTitle><CardDescription>Cole a descrição completa da vaga.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input placeholder="Empresa" value={nova.empresa} onChange={(e) => setNova({ ...nova, empresa: e.target.value })} />
                  <Input placeholder="Cargo" value={nova.cargo} onChange={(e) => setNova({ ...nova, cargo: e.target.value })} />
                </div>
                <Textarea rows={12} placeholder="Descrição da vaga…" value={nova.descricao} onChange={(e) => setNova({ ...nova, descricao: e.target.value })} />
                <Button size="lg" onClick={analisar} disabled={loading === "analyze"}>
                  {loading === "analyze" ? "Analisando… (pode levar até 1 min)" : "Analisar e gerar currículo"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultado" className="mt-6">
            {!atual ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">Analise uma vaga ou abra uma em “Minhas vagas”.</CardContent></Card>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="shadow-soft">
                    <CardHeader><CardDescription>{atual.empresa || "Empresa"} · {atual.cargo}</CardDescription><CardTitle className="text-4xl text-primary">{atual.analise.score}%</CardTitle></CardHeader>
                    <CardContent><Progress value={atual.analise.score} /><p className="mt-2 text-sm text-muted-foreground">Match com a vaga</p></CardContent>
                  </Card>
                  <Card className="shadow-soft md:col-span-2">
                    <CardContent className="space-y-3 pt-6">
                      <p className="text-sm font-semibold">✅ Palavras-chave presentes</p>
                      <div className="flex flex-wrap gap-2">{atual.analise.presentes.map((k) => <Badge key={k} className="bg-accent text-accent-foreground hover:bg-accent">{k}</Badge>)}</div>
                      <p className="text-sm font-semibold">⚠️ Palavras-chave ausentes</p>
                      <div className="flex flex-wrap gap-2">{atual.analise.ausentes.map((k) => <Badge key={k} variant="outline">{k}</Badge>)}</div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="shadow-soft">
                  <CardHeader><CardTitle>Sugestões</CardTitle></CardHeader>
                  <CardContent><ol className="list-decimal space-y-2 pl-5">{atual.analise.sugestoes.map((s, i) => <li key={i}>{s}</li>)}</ol></CardContent>
                </Card>
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="shadow-soft">
                    <CardHeader><CardTitle>Editar currículo</CardTitle></CardHeader>
                    <CardContent><Textarea rows={28} className="font-mono text-xs" value={atual.analise.curriculo} onChange={(e) => editCurriculo(e.target.value)} /></CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Preview</CardTitle>
                      <Button onClick={() => window.print()}>Baixar PDF</Button>
                    </CardHeader>
                    <CardContent>
                      <div id="print-area" className="ats-doc rounded-md border bg-background p-6">{atual.analise.curriculo}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="vagas" className="mt-6 space-y-3">
            {vagas.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhuma vaga salva ainda.</CardContent></Card>}
            {vagas.map((v) => (
              <Card key={v.id} className="shadow-soft">
                <CardContent className="flex flex-wrap items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{v.cargo}</p>
                    <p className="text-sm text-muted-foreground">{v.empresa || "—"} · {new Date(v.criadaEm).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge className="bg-accent text-accent-foreground hover:bg-accent">{v.analise.score}%</Badge>
                  <Button variant="outline" onClick={() => { setAtualId(v.id); setTab("resultado"); }}>Abrir / editar</Button>
                  <Button variant="ghost" className="text-destructive" onClick={() => { if (confirm("Excluir esta vaga?")) { setVagas((vs) => vs.filter((x) => x.id !== v.id)); if (atualId === v.id) setAtualId(null); } }}>Excluir</Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

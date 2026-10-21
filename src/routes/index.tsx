import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VagaMatch — Currículo ATS para cada vaga" },
      { name: "description", content: "Gere currículos ATS personalizados e veja seu match com cada vaga." },
      { property: "og:title", content: "VagaMatch — Currículo ATS para cada vaga" },
      { property: "og:description", content: "Gere currículos ATS personalizados e veja seu match com cada vaga." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});

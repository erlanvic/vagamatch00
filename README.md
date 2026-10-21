# VagaMatch

Gerador de currículo ATS com match de vagas, feito 100%

🔗 **Aplicação publicada:** https://vagamatch00.lovable.app

---

## 1. Qual problema a aplicação resolve

Quem procura emprego costuma enviar o mesmo currículo para todas as vagas. O problema é duplo:

- Muitas empresas usam **ATS** (sistemas que filtram currículos automaticamente por palavras-chave e formatação). Currículos com layout complexo ou sem as palavras certas são descartados antes de chegar a uma pessoa.
- Adaptar o currículo manualmente para cada vaga dá trabalho, e o candidato não sabe o quanto o seu perfil realmente combina com a vaga.

O **VagaMatch** resolve isso: o usuário cadastra seu perfil uma vez, cola a descrição de uma vaga e recebe o **score de compatibilidade**, as **palavras-chave que faltam** e uma **versão do currículo ATS friendly feita para aquela vaga**, sem inventar informações.

---

## 2. O mega prompt e o que mudou até a versão final

### Evolução

| Versão | O que mudou | Por quê |
|---|---|---|
| 1. Prompt completo, sem login | Stack (React, TypeScript, Tailwind, shadcn/ui), cores azul claro, branco e verde clarinho, fluxo de match e versões ATS por vaga | Definir a base do produto |
| 2. Com login | Cadastro e login por e-mail, confirmação de e-mail via Resend, Google, RLS por usuário | Cada pessoa ter seus próprios dados |
| 3. Ampliado | Exportar .docx, histórico de análises, dashboard de evolução, foco de nicho (tecnologia e primeiro emprego), SEO e GEO | Ideias de evolução do produto |
| 4. Sem login | Dados no navegador (localStorage), sem banco | Simplificar a primeira entrega |
| 5. **Enxuto (versão final enviada)** | Página única com abas, uma única edge function, PDF via impressão do navegador, sem dashboard e sem SEO extra | Caber nos **8 créditos** disponíveis no Lovable |
| 6. Prompt de login (segundo pedido) | Autenticação adicionada ao app já existente | Separar o login da primeira geração para economizar créditos |

### Prompt final usado na primeira geração (versão enxuta)

````markdown
# VagaMatch: gerador de currículo ATS com match de vagas

Crie um app web **sem login e sem banco de dados**, em React + TypeScript + Tailwind + **shadcn/ui**, em português do Brasil. Dados salvos no **localStorage**. IA via Lovable AI (uma única edge function).

## Visual
- Cores: azul claro `#60A5FA` (primária), branco `#FFFFFF` (fundo), verde bem clarinho `#E8F8EF` (acentos/sucesso, texto verde `#34A56F`).
- Estilo limpo, cantos arredondados, sombras suaves, responsivo.
- Logo: monograma "V" (perna esquerda azul, direita verde em formato de check) sobre fundo verde clarinho.
- Componentes shadcn: Button, Card, Input, Textarea, Tabs, Progress, Badge, Sonner.

## Telas (página única com Tabs)
1. **Meu perfil:** formulário com nome, contato, links, resumo, experiências, formação, cursos, habilidades e idiomas. Botão "Importar texto do meu currículo atual" (colar texto e a IA preenche os campos). Salvo no localStorage.
2. **Nova vaga:** campos empresa, cargo e descrição da vaga (colar texto). Botão **"Analisar e gerar currículo"**.
3. **Resultado:**
   - Score de match 0–100% (Progress)
   - Palavras-chave presentes ✅ e ausentes ⚠️
   - 3 sugestões práticas
   - **Currículo ATS personalizado para a vaga**, editável em Textarea, com preview
   - Botão **Baixar PDF** (via `window.print()` com CSS de impressão)
4. **Minhas vagas:** lista de vagas salvas (empresa, cargo, score) com uma versão de currículo por vaga; abrir, editar ou excluir.

## IA
Uma edge function `analyze-and-generate` que recebe perfil + vaga e retorna JSON: `{ score, presentes[], ausentes[], sugestoes[], curriculo }`. O currículo reescreve resumo e bullets com as palavras-chave da vaga, **sem inventar dados**. Tratar erros com toast e mostrar loading.

## Regras ATS do currículo gerado
Coluna única, sem tabelas, imagens ou ícones, fonte Arial 11pt, seções: Resumo Profissional, Experiência Profissional, Formação, Habilidades, Cursos e Idiomas, datas MM/AAAA, bullets simples com verbos de ação.

## Restrições
- Sem login, sem cadastro, sem Supabase, sem SEO extra, sem dashboard.
- Código simples, poucos arquivos, tudo funcionando em uma única entrega.
````

---

## 3. Como a análise funciona (da vaga colada ao currículo ajustado)

1. **Perfil:** o usuário preenche (ou cola o texto do currículo atual e a IA organiza) seus dados: resumo, experiências, formação, cursos, habilidades e idiomas.
2. **Vaga:** o usuário informa empresa, cargo e cola a descrição da vaga.
3. **Envio:** ao clicar em **Analisar e gerar currículo**, o app envia perfil e vaga para a edge function `analyze-and-generate`.
4. **Análise pela IA:** a IA extrai as palavras-chave e requisitos da vaga e compara com o perfil.
5. **Retorno estruturado (JSON):**
   - `score`: compatibilidade de 0 a 100%
   - `presentes`: palavras-chave da vaga que o perfil já cobre
   - `ausentes`: palavras-chave que faltam
   - `sugestoes`: 3 ações práticas para melhorar o match
   - `curriculo`: texto do currículo ajustado para a vaga
6. **Currículo ATS:** a IA reescreve o resumo e os bullets usando as palavras-chave da vaga, em coluna única, sem tabelas ou imagens, com seções padronizadas. Ela só reorganiza e reformula o que o usuário informou, **sem inventar experiências**.
7. **Edição e saída:** o usuário revisa e edita o texto, vê o preview e baixa em **PDF**.
8. **Salvamento:** cada vaga fica salva em **Minhas vagas**, com sua própria versão de currículo.

---

## 4. Ajustes pedidos depois da primeira geração

| Ajuste | Por quê |
|---|---|
| **Login** (cadastro, login, confirmação de e-mail) | A primeira versão guardava tudo só no navegador. Com login, perfil, vagas e currículos ficam ligados à conta de cada pessoa e não se perdem ao trocar de dispositivo ou limpar o navegador |
| **Ícone do app** (monograma "V", perna esquerda azul, direita verde em formato de check, fundo verde clarinho) | Dar identidade visual ao VagaMatch e combinar com a paleta azul, branco e verde |

### Ideias fora da versão enxuta (para próximas versões)

Estavam no prompt completo e foram cortadas por falta de créditos: exportar em .docx editável, histórico de análises, dashboard de evolução do match, foco de nicho (tecnologia e primeiro emprego) e SEO/GEO.

---

## 5. Endereço da aplicação publicada

https://vagamatch00.lovable.app

Assistente de Prompt @Claude.

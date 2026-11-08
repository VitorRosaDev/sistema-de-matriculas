# ENTREGA — Etapas do Desafio fora do desenvolvimento de código

> A implementação da aplicação está em [PLAN.md](PLAN.md). Este arquivo cobre tudo o que o Desafio exige além do código: protótipo e planejamento, a sessão de explicação com o Marredson, o vídeo, o ZIP e a postagem.

## Status (01/11/2026)

| Etapa | Situação |
|---|---|
| Código da aplicação | ✅ Pronto: UC01–UC06 mais cadastro/perfil do aluno e autorização de alterações. `npm test` passa (15 casos). |
| `README.md` | ✅ Atualizado com o estado do código. |
| 2.1 `docs/casos-de-uso.md` | ✅ Escrito (UC01–UC08, regras, rotas, modelo e diagrama Mermaid). |
| 2.2 Wireframes no FigCraft | ✅ 12 telas em `docs/prototipo/` (`.figcraft`, PNG de cada tela e `wireframes.pdf`). |
| 3. Sessão com o Marredson | ⏳ A fazer. |
| 4. Roteiro e vídeo | ⏳ A fazer (`docs/roteiro-video.md` não existe). |
| 5. `scripts/empacotar.ps1` e ZIP | ⏳ A fazer (`scripts/` só tem `check-firebase.js` e `testar-regras.js`). |
| 6. Postagem | ⏳ Depois do ZIP, protótipo e vídeo. |
| 7. Registro no Marredson | ⏳ A fazer (a pasta do projeto ainda não existe no vault). |

**Ordem sugerida:** `docs/casos-de-uso.md` → wireframes → `empacotar.ps1` → sessão com o Marredson → vídeo → ZIP final → postagem.

---

## 1. Requisitos de entrega do Desafio

- **Prazo:** fim da Semana 5. Confirme a data exata no Moodle.
- **Formato:** individual (Vitor Rodrigues da Rosa).
- **O que entregar:**
  1. **Código-fonte** num arquivo **ZIP**. Links para GitHub, GitLab ou similares **não são aceitos**.
  2. **Protótipo e planejamento**, em arquivos ou link.
  3. **Vídeo MP4 de 3 a 5 min**, com a execução e as partes importantes do código. **O código precisa estar legível no vídeo.**
- **Sem o vídeo ou sem os arquivos, a nota é zero.**
- **Critérios de avaliação:**

| Critério | Peso |
|---|---|
| Complexidade dos requisitos | 30% |
| Funcionalidade | 40% |
| Uso correto das tecnologias | 10% |
| Qualidade geral (código, apresentação) | 20% |

---

## 2. Protótipo e planejamento

Pode ser feito em paralelo com as Fases 1–2 do PLAN.

### 2.1 `docs/casos-de-uso.md`

- Atores: Secretaria e Aluno.
- UC01–UC06 no formato ator / pré-condição / fluxo principal / fluxos alternativos. Cada fluxo alternativo fica ligado a uma regra R1–R8 do PLAN.
- Além dos seis, documentar os dois fluxos extras já implementados: **Cadastro/Perfil do aluno** (primeiro acesso com matrícula gerada, edição de endereço, e-mail e celular, troca de senha) e **Autorizações** (a secretaria aprova ou recusa a troca de nome e data de nascimento).
- Regras de negócio e validações (copiadas da seção 4 do PLAN).
- Mapa de rotas (hash do front e endpoints da API, como no `README.md`) e modelo de dados (coleções `disciplinas`, `professores`, `alunos`, `turmas`, `matriculas`, `solicitacoes`).
- Diagrama de arquitetura em Mermaid: navegador (React) → fetch → Express → firebase-admin → Firestore.

### 2.2 Wireframes no FigCraft (skill `figcraft`)

Frames de desktop com 1280 px de largura, e frames de 375 px para as telas do aluno.

| Tela | Conteúdo principal |
|---|---|
| Login | Abas Aluno/Secretaria, matrícula ou e-mail e senha, link para Primeiro acesso, botão “i” com os dados de teste (preenche o formulário ao clicar) |
| Cadastro (primeiro acesso) | Nome completo, endereço, nascimento, e-mail, celular e senha |
| Perfil do aluno | Dados editáveis, troca de senha e pedido de alteração de nome/nascimento |
| Autorizações | Lista de pedidos pendentes com aprovar/recusar |
| Disciplinas | Tabela, formulário e checkboxes de pré-requisitos |
| Professores | Tabela com barra de carga e formulário |
| Turmas | Grade dia × turno, formulário com o código de horário ao vivo e avisos |
| Alocação | Barras de carga, média e alunos por turma |
| Ofertas do aluno (desktop + celular) | Filtros, cards com motivos de bloqueio, "Minhas matrículas" |
| Minha grade (desktop + celular) | Grade e total de carga horária |

Exportar PNG e PDF para `docs/prototipo/`, junto com o arquivo `.figcraft`.

---

## 3. Sessão de explicação com o Marredson (depois do projeto pronto)

**Objetivo:** você dominar as decisões, as tecnologias e o código antes de escrever o roteiro final do vídeo.

**Pauta sugerida:**

1. **Arquitetura geral:** cliente-servidor, o caminho de uma requisição e o porquê de Express + Firestore com firebase-admin.
2. **Decisões e trade-offs** (seção 2 do PLAN): CDN + JSX compilado no servidor, classes × função, regras em UMD, roteador por hash, sessão no servidor com permissões por perfil. Mencionar que a compilação no servidor (esbuild) e o endurecimento do back-end foram validados com o professor.
3. **Conceitos da AA no código**, semana a semana:

| Conceito (semana) | Onde aparece |
|---|---|
| JSX, renderização, componentes (S2) | todas as páginas; `Logo`, `Navbar`, `CardTurma`, `Campo` como função |
| Props, `props.children` (S3) | `ErrorBoundary`, `GradeHorario` |
| State, `setState`, ciclo de vida (S3) | páginas de classe; `componentDidMount`, `componentDidUpdate`, `componentWillUnmount` no `Roteador` |
| Eventos, `bind`, `preventDefault`, `stopPropagation` (S3) | formulários; `CardTurma` |
| Renderização condicional, listas com `key` (S4) | `Roteador`, cards bloqueados ou lotados, tabelas |
| Formulários controlados (S4) | CRUDs, filtros, `Cadastro`, `AlunoPerfil` (componente `Campo`) |
| Error Boundary (S4) | `ErrorBoundary` envolvendo o `Roteador` |
| Context (S5) | `SessaoContext` (Provider, `contextType`, Consumer) |
| Promises, fetch, Node, Express (S5) | `services/api.js`, `server.js`, `server/rotas/` |
| Firebase (S6) | `server/firebase.js`, transação em `matriculas.js`; senhas com hash scrypt em `server/senha.js` |
| Regex (competência da AA) | `shared/validacao.js` (e-mail, celular, matrícula, datas) |
| Bootstrap (sugerido no Desafio) | layout, navbar, tabelas, alertas, tema |

4. **Leitura guiada do código:** `index.html` → `App.jsx` → `router.jsx` → `AlunoOfertas.jsx` → `api.js` → `rotas/matriculas.js` → `regras.js`. Se sobrar tempo: `Cadastro.jsx` → `rotas/alunos.js` → `senha.js`.
5. **Simulação de perguntas do professor:** por que existe a transação? Onde os dados ficam salvos? Por que validar nos dois lados? Por que a senha tem hash e sal? Por que nome e nascimento passam por aprovação?
6. **Escrever juntos o roteiro final do vídeo** a partir da base abaixo.

---

## 4. Vídeo (3 a 5 min, MP4)

### 4.1 Base do roteiro (≈4:30), a refinar na sessão com o Marredson

1. **0:00–0:30:** apresentação, tema e diagrama da arquitetura com as tecnologias da AA.
2. **0:30–2:30, demonstração:**
   - a secretaria cria uma turma e o sistema barra um conflito de professor (R5);
   - o aluno (`100000001`) é bloqueado por pré-requisito (R1); um aluno intermediário (`100000002`) se matricula numa turma válida e vê a grade;
   - (opcional, se couber no tempo) primeiro acesso de um aluno novo e aprovação de pedido de alteração pela secretaria;
   - reiniciar o servidor e mostrar que os dados continuam lá.
3. **2:30–4:15, código:**
   - `index.html` (CDNs e ordem dos scripts);
   - uma página de classe (state, ciclo de vida, eventos);
   - `SessaoContext` e `Roteador`;
   - `regras.js` (UMD compartilhado);
   - a rota de matrícula (transação no Firestore);
   - `validacao.js` (regex).
4. **4:15–4:30:** limitações (sessão só em memória, conta única da secretaria, uma etapa de compilação no servidor, R5/R6/R8 sem transação) e próximos passos.

O roteiro final fica em `docs/roteiro-video.md`.

### 4.2 Preparação da gravação

- Rodar `npm run seed -- --reset` antes de gravar, para começar com os dados da demonstração limpos (contas de teste na tabela do `README.md`). Alunos criados pelo Primeiro acesso somem no reset.
- VS Code com fonte de 18 a 20, zoom alto, tema de alto contraste e minimap desligado. **O código precisa estar legível.**
- Navegador em janela limpa, zoom de 110% a 125% e sem extensões visíveis.
- Fechar notificações. **A chave do Firebase não pode aparecer na tela**: não abra o `serviceAccountKey.json` e feche essa aba no VS Code.

### 4.3 Gravação e edição

- Gravar com OBS Studio (1080p, 30 fps) ou com a Ferramenta de Captura do Windows.
- Fazer os cortes, os títulos de seção e o export **MP4 (H.264)** com a skill `filmcraft`.
- Conferir a duração (entre 3:00 e 5:00), o áudio e se o código está legível em tela cheia.

---

## 5. Empacotamento (ZIP)

### 5.1 `scripts/empacotar.ps1`

1. Copiar o projeto para uma pasta temporária, **excluindo**:
   - `node_modules/`;
   - `serviceAccountKey.json`;
   - `entrega/`.
2. Rodar `Compress-Archive` e gerar `entrega/matriculas-unisinos-VitorRodriguesDaRosa.zip`.
3. Listar o conteúdo do ZIP e **falhar se encontrar `serviceAccountKey.json`**.

### 5.2 Conteúdo esperado do ZIP

- Código-fonte completo: `server.js`, `seed.js`, `server/` (incluindo `senha.js` e `rotas/solicitacoes.js`), `public/`, `scripts/` (`check-firebase.js`, `testar-regras.js`, `empacotar.ps1`), `package.json` e `package-lock.json`.
- `.gitignore`, que também fica no ZIP.
- `README.md`, `PLAN.md`, `ENTREGA.md` e `serviceAccountKey.example.json`.
- `docs/`: casos de uso, protótipo e roteiro.

### 5.3 Teste do ZIP

Extrair numa pasta limpa, rodar `npm install`, copiar a chave, rodar `npm test`, `npm run seed` e `npm start` e conferir que funciona (login da secretaria e de um aluno, matrícula e grade).

---

## 6. Postagem

- [ ] ZIP do código-fonte anexado.
- [ ] Protótipo anexado (PDF/PNG em `docs/prototipo/`, também dentro do ZIP).
- [ ] Vídeo MP4 anexado, ou link conforme as instruções do Moodle.
- [ ] **Nome completo escrito no texto da postagem.**
- [ ] Revisar se a chave do Firebase não foi para nenhum arquivo entregue.
- [ ] Se o professor pedir para executar: mandar a chave por outro canal e **revogá-la** depois da correção (Google Cloud → IAM → Contas de serviço → Chaves).

---

## 7. Registro no Marredson

Criar `C:\Brain\C01-Marredson\08-projects\ProjetoFrontEndUnisinos\` com `README.md`, `backlog.md`, `scaffolding.md` e `testing-log.md`, no mesmo padrão dos outros projetos.

O código fica em `C:\dev`, fora do vault. Nada é escrito em `B01-Vitor`, que é Espaço Humano.

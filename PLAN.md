# PLAN — Implementação: Sistema de Atendimento e Matrículas

> **Escopo deste arquivo:** só o desenvolvimento da aplicação (código, testes e documentação técnica). O protótipo, o vídeo, o empacotamento e a postagem estão em [ENTREGA.md](ENTREGA.md).
>
> **Modo Marredson:** software-engineering + ui-ux-especialista + qa-engineering + security-engineering. A explicação didática das decisões e do código fica para uma sessão com o Marredson depois que o projeto estiver pronto.

---

## 1. Contexto

O Desafio pede o front-end de um sistema de matrículas, com **visão institucional** (montar ofertas de turmas) e **visão do aluno** (matricular-se). São **no mínimo 3 casos de uso**, usando **apenas as tecnologias estudadas na AA**.

| Critério de avaliação | Peso |
|---|---|
| Complexidade dos requisitos | 30% |
| Funcionalidade | 40% |
| Uso correto das tecnologias | 10% |
| Qualidade geral | 20% |

Este plano implementa **todos os 6 casos de uso**.

### Status (01/11/2026)

- ✅ Projeto Firebase **`matriculas-unisinos-191cb`** (nome exibido `matriculas-unisinos`), plano Spark.
- ✅ Firestore `(default)`, Standard, em modo de produção (`allow read, write: if false`).
- ✅ `serviceAccountKey.json` na raiz do projeto, validado sem exibir o segredo.
- ✅ Node v26.7.0 e npm 12.0.2.
- ✅ Fases 1–5 implementadas: API completa, regras compartilhadas, as 7 telas de UC01–UC06 mais Cadastro, Perfil do aluno e Autorizações. `npm test` passa (15 casos).
- ✅ `README.md` escrito (parte da Fase 7).
- ✅ Fase 7 iniciada: code-review medium rodado (01/11/2026). Corrigidos: matrícula contada em dobro na vaga (R3), pré-requisito circular (R7), valores não-texto passando nas regex (400 em vez de 500), IDs reservados do Firestore e corpo grande demais (404/413 em vez de 500). `npm run check` e `npm test` (16 casos) passam; T1, T7-parcial (ciclo) e T10 conferidos pela API.
- 📌 Aceitos como limitação (documentados no README): sessão só em memória (uma instância), conta única da secretaria (senha padrão só fora de produção), R5/R6/R8 e e-mail único sem transação, leitura de coleções inteiras.
- ✅ Fase 6 revisada por leitura de código (acessibilidade, 4 ajustes) e `seed --reset` executado.
- ⏳ **Falta confirmar no navegador:** 375 px, teclado e tema escuro e os testes T2–T6, T8–T9, T11–T14 pela interface.
- ▶️ **Próximo:** fechar a Fase 7 e seguir para [ENTREGA.md](ENTREGA.md) (casos de uso, wireframes, ZIP e vídeo).

---

## 2. Decisões arquiteturais

> **Estrutura confirmada com o professor.** O enunciado pede só tecnologias estudadas na AA; as duas decisões que se afastam dos exemplos — compilar o JSX no servidor com `esbuild` (em vez do Babel no navegador) e endurecer o back-end com `helmet`, `compression`, `express-rate-limit` e sessão por cookie — foram apresentadas ao professor, que respondeu: *"Pode fazer assim como está desenvolvendo."*

| Decisão | Por quê | Custo / trade-off |
|---|---|---|
| **React 18.3.1 UMD via CDN + JSX compilado no servidor (esbuild)** | Começou com Babel standalone no navegador (padrão dos exemplos da AA), mas o Babel pesava 659 KB e compilava 25 arquivos a cada abertura: Lighthouse de celular 45 → 94, FCP 6,1 s → 1,8 s, TBT 650 → 0 ms ao trocar por um bundle único gerado pelo servidor (`server/bundle.js`). Também permitiu uma CSP sem `unsafe-eval`. | Há uma etapa de compilação (automática ao iniciar o servidor, sem `npm run build`) e uma dependência de runtime (`esbuild`). Arquivo novo em `public/js` precisa entrar na lista `ORDEM`. O React 19 não publica mais build UMD. |
| **Componentes de classe** nas páginas com estado; **de função** só para apresentação | Espelha o material (`setState`, `componentDidMount`, `contextType`, `Logo` como função). | Mais verboso que hooks, mas os hooks não foram estudados. |
| **Express 5 como API REST + estáticos** (mesma origem) | `fetch('/api/...')` como na Semana 5, sem CORS porque front e API saem da mesma porta 3000. Express 5 repassa erros de handlers `async` ao middleware de erro. | O material usa Express 4 + body-parser. O `express.json()` cumpre a mesma função. |
| **Firestore via `firebase-admin`** (só o servidor acessa) | Persistência real em nuvem (Semana 6) e menor privilégio: as regras negam todo acesso de cliente e o admin SDK ignora essas regras. | Chave de service account secreta. Firestore não tem JOIN, então o servidor monta as respostas. |
| **Regras de negócio e regex em `public/js/shared/` (formato UMD)** | Um único arquivo roda no navegador (feedback imediato) e no Node (o servidor nunca confia no cliente). Fonte única de verdade. | Exige o padrão UMD. |
| **Roteador por hash próprio** | "Rotas" sem react-router (não estudado). Exercita ciclo de vida (`hashchange`). | Sem rotas com parâmetro; não fazem falta aqui. |
| **Login simulado** (aluno pela matrícula ou e-mail; secretaria com usuário e senha conferidos **no servidor**) | Autenticação não foi estudada. Conferir a senha no servidor evita deixá-la exposta no JS. | Evolução: sessão no servidor (cookie HttpOnly) com permissões por rota; ver README, "Autenticação e permissões". |
| **IDs naturais no Firestore** (`disciplinas/{codigo}`, `alunos/{matricula}`) | As consultas e os pré-requisitos ficam diretos. | O código da disciplina não pode ser editado depois de criado. |

---

## 3. Skills de implementação (por fase)

| Fase | Skill | Uso |
|---|---|---|
| todas | Marredson **software-engineering** (MVC, State), **qa-engineering** (validation gates) | Separação Model/View; validar cada fase antes de avançar |
| 1 | **api-and-interface-design** | Conferir o contrato REST (seção 7) ao implementar as rotas |
| 1 | Marredson **security-engineering**, **security-and-hardening** | Chave fora do código versionado, validação no servidor, erros sem stack trace |
| 1–5 | **incremental-implementation** | Uma interação por vez, testada antes da próxima |
| 2–6 | **frontend-ui-engineering**, **ux-feedback** | Bootstrap, estados de carregando/vazio/erro |
| 6 | **fixing-accessibility** / **ui-a11y**, Marredson **ui-ux-especialista** | Labels, foco, contraste, alvos de toque, responsividade |
| 2–7 | **run** + **browser-testing-with-devtools** (ou **anthropic-skills:chrome-browser**) | Subir o app e percorrer as rotas com o console limpo |
| 7 | **code-review** (nível medium) | Revisão final do código |

---

## 4. Casos de uso e regras de negócio

| UC | Ator | Descrição | Regras |
|---|---|---|---|
| **UC01** | Secretaria | Manter disciplinas e pré-requisitos (CRUD) | V1, R7 |
| **UC02** | Secretaria | Manter professores (CRUD, carga máxima) | V1 |
| **UC03** | Secretaria | Montar oferta de turmas e ver a grade de ofertas (dia × turno) | V1, R5, R6, R8 |
| **UC04** | Secretaria | Painel de alocação: carga por professor, equilíbrio e alunos por turma | R6 |
| **UC05** | Aluno | Realizar e cancelar matrícula, com filtros e o motivo de cada bloqueio | R1–R4 |
| **UC06** | Aluno | Consultar a minha grade horária, com total de carga horária e impressão | — |

**Ordem de implementação:**
1. Primeiro o núcleo **UC01 → UC03 → UC05**, que já cobre as duas visões.
2. Depois **UC06 → UC02 → UC04**.

**Regras** (implementadas em `shared/regras.js` e aplicadas na tela **e** no servidor):

- **R1 Pré-requisitos:** o aluno só se matricula se `disciplina.preRequisitos ⊆ aluno.cursadas`. A mensagem lista os faltantes.
- **R2 Conflito de horário do aluno:** não pode ter duas turmas com o mesmo código de horário no semestre.
- **R3 Vagas:** `ocupadas < vagas`, e a turma precisa estar `aberta`. Garantido no servidor por **transação** do Firestore, contra matrículas simultâneas.
- **R4 Duplicidade:** o aluno não pode cursar a mesma disciplina duas vezes no semestre nem repetir uma disciplina já cursada.
- **R5 Conflito do professor:** um professor não pode ter duas turmas no mesmo horário e semestre.
- **R6 Carga balanceada:** o número de turmas do professor no semestre fica abaixo de `cargaMaxima`. O select de professores vem ordenado pela menor carga, com a carga ao lado (`Ana — 1/4`), e quem está lotado aparece desabilitado.
- **R7 Pré-requisito válido:** uma disciplina não pode ser pré-requisito de si mesma, todo pré-requisito precisa existir e os pré-requisitos não podem formar um ciclo.
- **R8 Oferta única:** não pode haver duas turmas da mesma disciplina no mesmo horário e semestre.
- **V1 Formatos (regex, `shared/validacao.js`):**

| Campo | Expressão |
|---|---|
| Matrícula | `^\d{9}$` |
| Código da disciplina | `^[A-Z]{3}\d{4}$` (ex.: `INF0101`) |
| E-mail | `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` |
| Horário | `^[2-7][1-3]$` |
| Semestre | `^\d{4}\/[12]$` |
| Nome | `^[A-Za-zÀ-ÿ' ]{3,80}$` |

- **Integridade referencial (servidor, resposta 409):**
  - não excluir uma disciplina que tenha turmas ou seja pré-requisito de outra;
  - não excluir um professor que tenha turmas;
  - não excluir uma turma que tenha alunos.

**Código de horário:** `DT`. D é o dia da semana, de 2 (segunda) a 7 (sábado); T é o turno: 1 manhã, 2 tarde, 3 noite. Exemplos: `21` é segunda de manhã, `33` é terça à noite. São 18 combinações.

---

## 5. Modelo de dados (Firestore)

| Coleção / ID | Campos |
|---|---|
| `disciplinas/{codigo}` | `codigo`, `nome`, `cargaHoraria` (30/60/90), `preRequisitos: string[]` |
| `professores/{auto}` | `nome`, `email` (único), `cargaMaxima` (1–8) |
| `alunos/{matricula}` | `matricula`, `nome`, `email`, `cursadas: string[]` |
| `turmas/{auto}` | `codigo` (`INF0101-21`), `disciplinaId`, `professorId`, `horario`, `vagas` (1–80), `semestre`, `status` (`aberta` \| `fechada`), `criadaEm` |
| `matriculas/{auto}` | `alunoId`, `turmaId`, `semestre`, `criadaEm` (serverTimestamp) |

**Como as consultas funcionam:**
- Só são usados filtros de igualdade num único campo, para não exigir índices compostos. A ordenação é feita em JavaScript.
- O volume de dados é pequeno, então o servidor lê as coleções e faz a junção em memória. Isso fica muito abaixo do limite de 50 mil leituras por dia do plano Spark.

---

## 6. Estrutura do código

```
C:\dev\ProjetoFrontEndUnisinos\
├── PLAN.md                        este arquivo
├── ENTREGA.md                     protótipo, vídeo, ZIP e postagem
├── README.md                      como configurar o Firebase, rodar, popular, contas de teste
├── package.json
├── .gitignore                     node_modules/, serviceAccountKey.json, entrega/
├── serviceAccountKey.json         🔒 segredo, nunca distribuído
├── serviceAccountKey.example.json formato com valores fictícios
├── server.js                      monta o app Express e sobe na porta 3000
├── seed.js                        popula o Firestore (--reset limpa antes)
├── server/
│   ├── firebase.js                inicializa o admin SDK e exporta { db, FieldValue }
│   ├── repositorio.js             listar/obter/criar/atualizar/remover + docParaObjeto
│   ├── erros.js                   class ErroHttp + middleware de erro + 404 da API
│   ├── montar.js                  monta os objetos devolvidos pela API
│   ├── senha.js                   hash scrypt com sal por aluno
│   └── rotas/
│       ├── sessao.js              POST /api/login
│       ├── disciplinas.js
│       ├── professores.js
│       ├── alunos.js
│       ├── turmas.js
│       ├── matriculas.js
│       └── solicitacoes.js        aprovar/recusar troca de nome e nascimento
├── scripts/
│   ├── check-firebase.js          grava, lê e apaga _healthcheck/ping
│   └── testar-regras.js           testes das regras R1–R8 com node:assert
└── public/
    ├── index.html
    ├── css/app.css
    └── js/
        ├── shared/                (UMD: browser + Node)
        │   ├── horario.js         DIAS, TURNOS, SEMESTRE_ATUAL, decodificar, todosCodigos
        │   ├── formatos.js        formatação de datas, telefone e horários
        │   ├── validacao.js       REGEX + validarDisciplina/Professor/Turma/Login → {campo: msg}
        │   └── regras.js          avaliarMatricula, avaliarOferta, cargaPorProfessor…
        ├── services/api.js        objeto global Api (fetch + Promises)
        ├── context/SessaoContext.jsx
        ├── components/            Logo, Navbar, ErrorBoundary, Alerta, Carregando, EstadoVazio,
        │                          GradeHorario, CardTurma, BarraCarga
        ├── pages/                 Login, AdminDisciplinas, AdminProfessores, AdminTurmas,
        │                          AdminAlocacao, AdminSolicitacoes, AlunoOfertas, AlunoGrade,
        │                          AlunoPerfil, Cadastro, NaoEncontrada
        ├── router.jsx             Roteador (hash) + rotas por perfil
        └── App.jsx                estado da sessão e tema, Provider, createRoot
```

---

## 7. Contrato da API REST

Todas as respostas são JSON. Os erros seguem o formato `{ "erro": "mensagem para o usuário" }` com os status **400** (formato inválido), **401** (login), **404** (não encontrado), **409** (regra de negócio violada) e **500** (erro interno, sem detalhes para o cliente).

| Método e rota | Validações no servidor | Resposta |
|---|---|---|
| `POST /api/login` `{perfil, identificador}` (matrícula ou e-mail) ou `{perfil, usuario, senha}` | V1; o aluno precisa existir; a secretaria confere com `ADMIN_USUARIO`/`ADMIN_SENHA` (variáveis de ambiente, padrão `secretaria`/`unisinos`) | 200 `{perfil, usuario:{id,nome}}` · 401 |
| `GET /api/disciplinas` | — | 200 `[disciplina]` ordenadas por código |
| `POST /api/disciplinas` | V1, R7, código único | 201 `disciplina` · 400 · 409 |
| `PUT /api/disciplinas/:id` | V1, R7 (o código não muda) | 200 · 404 |
| `DELETE /api/disciplinas/:id` | não pode ter turmas nem ser pré-requisito de outra | 204 · 409 |
| `GET /api/professores` | — | 200 `[professor + carga]` (carga = turmas no semestre atual) |
| `POST`/`PUT /api/professores[/:id]` | V1, e-mail único | 201/200 · 400 · 409 |
| `DELETE /api/professores/:id` | não pode ter turmas | 204 · 409 |
| `GET /api/turmas?semestre=2026/2` | — | 200 `[turmaDetalhada]` |
| `POST /api/turmas` | V1, a disciplina e o professor existem, R5, R6, R8 | 201 · 400 · 409 |
| `PATCH /api/turmas/:id` `{status}` | `aberta` ou `fechada` | 200 |
| `DELETE /api/turmas/:id` | não pode ter matrículas | 204 · 409 |
| `GET /api/turmas/:id/alunos` | — | 200 `[{matricula, nome, email}]` |
| `GET /api/alunos/:matricula/matriculas` | — | 200 `[{id, turma: turmaDetalhada}]` |
| `POST /api/matriculas` `{alunoId, turmaId}` | R1, R2 e R4 por `Regras.avaliarMatricula`; R3 e a duplicidade **dentro de `db.runTransaction`** | 201 · 409 com os motivos |
| `DELETE /api/matriculas/:id` | — | 204 |

O formato `turmaDetalhada` é:
```js
{ id, codigo, horario, horarioTexto, vagas, ocupadas, status, semestre,
  disciplina: { id, codigo, nome, cargaHoraria, preRequisitos },
  professor:  { id, nome } }
```

---

## 8. Desenho do front-end

### 8.1 `index.html`: ordem dos scripts

**Atualização:** hoje o `index.html` só carrega as bibliotecas de CDN (React, ReactDOM e Bootstrap, com SRI e `defer`) e `js/app.js`, um bundle que o servidor gera juntando os arquivos abaixo, já com o JSX compilado (`server/bundle.js`, lista `ORDEM`). O texto a seguir é o plano original: a ordem continua valendo, mas dentro do bundle, e não existe mais Babel no navegador.

Esta ordem importa: os scripts compartilham o escopo global e eram executados na ordem em que aparecem.

1. **CSS:** Bootstrap 5.3.3 e Bootstrap Icons 1.11.3 (jsDelivr), depois `css/app.css`.
2. **Bibliotecas:**
   - `react@18.3.1/umd/react.development.js`;
   - `react-dom@18.3.1/umd/react-dom.development.js`;
   - `@babel/standalone` em **versão exata** (confirmar a mais recente da linha 7 no unpkg na Fase 2);
   - `bootstrap.bundle.min.js`.
3. **JS puro, sem Babel:** `shared/horario.js` → `shared/validacao.js` → `shared/regras.js` → `services/api.js`.
4. **`type="text/babel" data-presets="react"`:**
   - `context/SessaoContext.jsx`;
   - `components/*.jsx`;
   - `pages/*.jsx`;
   - `router.jsx`;
   - `App.jsx`.

`data-presets="react"` transforma só o JSX e preserva `class` e arrow functions, o que deixa o código legível no DevTools. O Babel busca os arquivos `src` por HTTP, então é **obrigatório abrir pelo `http://localhost:3000`**.

### 8.2 Padrão UMD dos arquivos `shared/` (exemplo de `regras.js`)

```js
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrica(require('./horario.js'));      // Node (servidor)
  } else {
    raiz.Regras = fabrica(raiz.Horario);                    // Navegador (window.Regras)
  }
})(typeof self !== 'undefined' ? self : this, function (Horario) {
  function verificarPreRequisitos(disciplina, cursadas) { /* → { ok, faltantes } */ }
  function verificarConflitoHorario(turma, outrasTurmas) { /* → { ok, conflitoCom } */ }
  function avaliarMatricula({ turma, aluno, turmasDoAluno }) {
    // junta R1–R4 → { podeMatricular: boolean, motivos: string[] }
  }
  function avaliarOferta({ turma, professor, turmasDoSemestre }) {
    // junta R5, R6, R8 → { podeOfertar, motivos }
  }
  function cargaPorProfessor(professores, turmas) { /* → [{...p, carga, percentual}] ordenado */ }
  function mediaDeCarga(professoresComCarga) { /* para o painel UC04 */ }
  return { verificarPreRequisitos, verificarConflitoHorario, avaliarMatricula,
           avaliarOferta, cargaPorProfessor, mediaDeCarga };
});
```

Todas as funções são **puras**: recebem dados, devolvem decisões, sem `fetch` e sem acesso ao DOM. Elas são o **Model**. As páginas só renderizam a decisão.

### 8.3 `services/api.js`

```js
const Api = (function () {
  function requisitar(caminho, opcoes = {}) {
    return fetch('/api' + caminho, {
      ...opcoes,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
    }).then((resposta) => {
      if (resposta.status === 204) return null;
      return resposta.json().then((dados) => {
        if (!resposta.ok) throw new Error(dados.erro || 'Erro ' + resposta.status);
        return dados;
      });
    });
  }
  return {
    entrar: (credenciais) => requisitar('/login', { method: 'POST', corpo: credenciais }),
    listarDisciplinas: () => requisitar('/disciplinas'),
    criarDisciplina: (d) => requisitar('/disciplinas', { method: 'POST', corpo: d }),
    // … um método por endpoint da seção 7
  };
})();
```

### 8.4 Context, App e Router

- **`SessaoContext`** é criado com `React.createContext({ usuario: null, perfil: null, tema: 'light', entrar() {}, sair() {}, alternarTema() {} })`.
- **`App`** (classe) guarda no `state` os dados `{ usuario, perfil, tema }`:
  - `entrar` e `sair` atualizam o estado e o `sessionStorage`, para a sessão sobreviver ao F5;
  - `componentDidUpdate` aplica `document.documentElement.dataset.bsTheme = tema`, a mesma ideia do `ThemeContext` do exemplo do professor, agora com Bootstrap;
  - o `render` monta `<SessaoContext.Provider value={...}>`, dentro dele a `<Navbar/>` e o `<ErrorBoundary><Roteador/></ErrorBoundary>`;
  - a montagem usa `ReactDOM.createRoot(document.getElementById('root')).render(<App/>)`.
- **`Roteador`** (classe, `static contextType = SessaoContext`):
  - o `state` guarda `{ caminho }`, lido de `location.hash`;
  - `componentDidMount` registra `window.addEventListener('hashchange', this.aoMudarHash)`;
  - `componentWillUnmount` remove o listener;
  - a tabela de rotas é `{ '#/admin/disciplinas': { pagina: AdminDisciplinas, perfil: 'secretaria' }, … }`.
  - O `render` usa renderização condicional: sem usuário mostra o `Login`; com perfil errado redireciona para a página inicial do perfil; rota desconhecida mostra `NaoEncontrada`.
  - Cada página recebe `key={caminho}`, o que força remontar ao trocar de rota.

**Rotas:**

| Perfil | Rota | Página |
|---|---|---|
| — | `#/login` | Login |
| secretaria | `#/admin/disciplinas` | AdminDisciplinas |
| secretaria | `#/admin/professores` | AdminProfessores |
| secretaria | `#/admin/turmas` | AdminTurmas |
| secretaria | `#/admin/alocacao` | AdminAlocacao |
| aluno | `#/aluno/ofertas` | AlunoOfertas |
| aluno | `#/aluno/grade` | AlunoGrade |

### 8.5 Componentes de apresentação (função, só `props`)

- **`Logo`**: logotipo e título da página no cabeçalho, como nos exemplos da AA.
- **`Navbar`**:
  - usa `<SessaoContext.Consumer>`;
  - mostra os links do perfil logado, com destaque na rota ativa;
  - tem nome do usuário, botão de tema (ícone sol/lua) e botão Sair;
  - vira `navbar-expand-lg` com hambúrguer no celular.
- **`ErrorBoundary`** (a única classe deste grupo, porque precisa disso):
  - `static getDerivedStateFromError` ativa o fallback;
  - `componentDidCatch` registra o erro com `console.error`;
  - o fallback é um card com o botão "Tentar novamente", que reseta o estado.
- **`Alerta`**: `{tipo, mensagem, onFechar}` → `alert alert-{tipo} alert-dismissible`, com `role="alert"` e `aria-live`.
- **`Carregando`** e **`EstadoVazio`**: spinner com texto acessível; mensagem com ícone e chamada para ação.
- **`GradeHorario`**:
  - recebe `{turmas, renderizarTurma}`;
  - no desktop é uma tabela de 3 turnos × 6 dias (`d-none d-md-table`);
  - no celular é uma lista agrupada por dia (`d-md-none`);
  - percorre `Horario.todosCodigos()` com `map` e `key`.
- **`CardTurma`**:
  - recebe `{turma, avaliacao, onMatricular, aberto, onAlternar}`;
  - mostra badges de vagas (verde, amarelo ou vermelho), horário e professor;
  - quando há bloqueio, lista `avaliacao.motivos`;
  - o clique no card expande os detalhes, e o botão "Matricular" chama `event.stopPropagation()` para não expandir junto.
- **`BarraCarga`**: `{carga, maxima}` → `progress` do Bootstrap, com cor conforme o percentual e `aria-valuenow`.

### 8.6 Páginas (classes com `state`, ciclo de vida e eventos)

Padrão comum a todas as páginas:
- o `state` sempre inclui `{ carregando, erro, sucesso, ... }`;
- `componentDidMount` chama `this.carregar()`, que faz `Promise.all([...]).then(setState).catch(erro).finally(carregando:false)`;
- os handlers fazem `bind` no constructor, como no material;
- os formulários são **controlados**, com um handler genérico `aoAlterar(event)` que usa `event.target.name`;
- o `aoEnviar(event)` chama `event.preventDefault()`, valida com `Validacao`, mostra os erros por campo (`is-invalid` + `invalid-feedback`), chama `Api`, mostra um `Alerta` e recarrega a lista.

| Página | Estado principal | Destaques |
|---|---|---|
| **Login** | `perfil`, `identificador`, `usuario`, `senha`, `erros`, `infoAberta` | Abas por perfil (renderização condicional); regex da matrícula ou do e-mail; botão “i” que abre o card com as contas de teste e preenche o formulário |
| **AdminDisciplinas** (UC01) | `disciplinas`, `form`, `editandoId` | Tabela com `map`; pré-requisitos como lista de checkboxes (sem a própria disciplina, R7); código desabilitado na edição; excluir com `window.confirm` |
| **AdminProfessores** (UC02) | `professores`, `form`, `editandoId` | Mesmo padrão do UC01; carga atual com `BarraCarga`; e-mail validado por regex |
| **AdminTurmas** (UC03) | `turmas`, `disciplinas`, `professores`, `form{disciplinaId, professorId, dia, turno, vagas}`, `visao: 'grade'\|'tabela'` | O horário é escolhido em dois selects (dia e turno) e o código **`21`** aparece ao vivo. `Regras.avaliarOferta` é calculada no `render` e mostra avisos antes de enviar. Professores ordenados por carga, com os lotados desabilitados. Alterna entre grade e tabela. Ações de fechar/reabrir e excluir. |
| **AdminAlocacao** (UC04) | `professores`, `turmas`, `turmaSelecionada`, `alunosDaTurma` | Média de carga e desvio de cada professor. Ao clicar numa turma, `componentDidUpdate(prevProps, prevState)` busca `GET /turmas/:id/alunos` **só se** `turmaSelecionada` mudou, o que evita loop infinito. |
| **AlunoOfertas** (UC05) | `turmas`, `minhas`, `filtros{busca, dia, turno, soDisponiveis}`, `expandida` | Filtros controlados aplicados no `render` com `filter` e `map`; `Regras.avaliarMatricula` para cada turma; botão desabilitado quando há bloqueio; painel lateral "Minhas matrículas" com Cancelar; o 409 do servidor aparece no `Alerta` |
| **AlunoGrade** (UC06) | `minhas` | `GradeHorario` com as turmas do aluno; soma da carga horária; `window.print()` com CSS `@media print` |
| **NaoEncontrada** | — | Mensagem e link para a página inicial do perfil |

---

## 9. Fases de implementação

### Fase 1 — Back-end e Firebase

1. Criar a base do projeto:
   - `npm init -y`, depois ajustar o `package.json`: `"private": true`, scripts `start` (`node server.js`), `dev` (`node --watch server.js`), `seed` (`node seed.js`), `check` (`node scripts/check-firebase.js`) e `test` (`node scripts/testar-regras.js`);
   - `npm install express firebase-admin`, e registrar as versões resolvidas;
   - criar o `.gitignore`;
   - criar o `serviceAccountKey.example.json` com valores fictícios.
2. **`server/firebase.js`:**
   - `require('../serviceAccountKey.json')` dentro de `try/catch`, com uma mensagem amigável que aponta para o README se o arquivo faltar;
   - `admin.initializeApp({ credential: admin.credential.cert(chave) })`;
   - exportar `db = admin.firestore()` e `FieldValue`.
3. **`scripts/check-firebase.js`:**
   - gravar `_healthcheck/ping` com `FieldValue.serverTimestamp()`;
   - ler e imprimir `OK — projeto matriculas-unisinos-191cb`;
   - apagar o documento.

   Rodar **`npm run check`**.
4. **`server/erros.js`:**
   - `class ErroHttp extends Error { constructor(status, mensagem) }`;
   - um middleware `(err, req, res, next)` que devolve `{erro}` com o status certo e esconde detalhes no caso 500;
   - um handler de 404 para `/api/*`.
5. **`server/repositorio.js`:**
   - `docParaObjeto(doc)`, que converte `Timestamp` para ISO;
   - `listar(colecao)`, `obter(colecao, id)`, `criar(colecao, dados, id?)`, `atualizar`, `remover` e `buscarPor(colecao, campo, valor)`.
6. **Antecipar o essencial de `shared/`:**
   - `horario.js` completo;
   - `validacao.js` com todas as regex (V1).

   As regras R1–R8 entram na Fase 3; até lá as rotas validam só formato e existência.
7. **Rotas** em `server/rotas/*.js` (um `express.Router()` cada), na ordem sessão → disciplinas → professores → alunos → turmas → matrículas. Cada handler segue o mesmo esquema: `Validacao` → existência → `Regras` → gravação → resposta (seção 7).
   - Turmas e professores calculam a carga a partir das turmas do semestre.
   - `POST /api/matriculas` usa `db.runTransaction(async t => { ... })`: dentro da transação, lê a turma e as matrículas da turma (`t.get(query)`), confere `ocupadas < vagas` e a duplicidade, e grava com `t.create(ref, ...)`.
8. **`server.js`:** `express.json()`, `express.static('public')`, `app.use('/api/...', router)` para cada recurso, 404 da API, middleware de erro e `listen(process.env.PORT || 3000)` com o log `http://localhost:3000`.
9. **`seed.js`** (idempotente; `--reset` apaga as coleções em lotes com `db.batch()`):
   - **10 disciplinas em cadeia:** ALG0101 → ALG0102 → EDD0201; BDD0101 → BDD0102; WEB0101 → FRT0201 (Front-end, pré-requisitos WEB0101 + ALG0101); ESW0101; RED0101; e mais.
   - **5 professores** com `cargaMaxima` entre 2 e 5, sendo **um já na carga máxima** (para R6).
   - **4 alunos:**
     - `100000001`, calouro sem disciplinas cursadas;
     - `100000002`, intermediário;
     - `100000003`, avançado;
     - `100000004`, com uma matrícula que deixa uma turma **lotada** (vagas = 1), para R3.
   - **8 a 10 turmas** em 2026/2, incluindo **duas no mesmo horário**, para R2.
10. Smoke test de todos os endpoints com `Invoke-RestMethod`, nos caminhos felizes **e** nos erros: 400 por regex, 401 no login, 409 ao excluir algo em uso.

- **Pronto quando:** `npm run check` e `npm run seed` passam e todos os endpoints respondem como na seção 7.

### Fase 2 — Esqueleto do front

1. Escrever o `index.html` (seção 8.1) e o `css/app.css`: variáveis de marca, foco visível e `@media print`.
2. Escrever `api.js` (seção 8.3), já com todos os métodos da seção 7.
3. Escrever `SessaoContext.jsx`, `Logo`, `ErrorBoundary`, `Alerta`, `Carregando`, `EstadoVazio` e `Navbar`.
4. Escrever o `Login`, ligado a `Api.entrar`, com validação por regex.
5. Escrever o `Roteador` com a tabela de rotas da seção 8.4 e páginas provisórias, e o `App` com `createRoot`.

- **Pronto quando:** dá para logar como aluno e como secretaria, navegar pelas rotas do próprio perfil, ser redirecionado nas rotas do outro, alternar o tema, sair, e o F5 mantém a sessão. Console sem erros.

### Fase 3 — Regras compartilhadas

1. Completar `shared/regras.js` (seção 8.2).
2. No servidor, aplicar as regras com `require('../../public/js/shared/regras.js')`:
   - R5, R6 e R8 em `POST /api/turmas`;
   - R7 em disciplinas;
   - R1, R2 e R4 em `POST /api/matriculas`, junto da transação já existente.
3. Escrever o `scripts/testar-regras.js`: um teste com `node:assert`, sem dependências, com um caso feliz e um bloqueado para cada R1–R8. Rodar com `npm test`.

- **Pronto quando:** `npm test` passa e a API devolve 409 com os motivos corretos para cada regra.

### Fase 4 — Núcleo: UC01 → UC03 → UC05 (uma interação por vez)

1. **AdminDisciplinas:** listar → criar → editar → excluir, testando cada ação no navegador antes da próxima.
2. **Componentes de grade:** `GradeHorario` e `BarraCarga`.
3. **AdminTurmas:**
   - formulário com o código de horário ao vivo e os avisos de `avaliarOferta`;
   - criar → `GradeHorario` → alternância para tabela → fechar/reabrir → excluir.
4. **CardTurma** e **AlunoOfertas:**
   - lista de cards → filtros → avaliação de cada turma → matricular → painel "Minhas matrículas" → cancelar.

- **Pronto quando:** os testes T1–T10 da seção 10 passam pela interface.

### Fase 5 — UC06 → UC02 → UC04

1. **AlunoGrade:** reutiliza o `GradeHorario`, mostra o total de carga horária e tem o botão de impressão.
2. **AdminProfessores:** CRUD no mesmo padrão do AdminDisciplinas, com `BarraCarga`.
3. **AdminAlocacao:** média e desvio de carga, e a lista de turmas por professor. Os alunos por turma vêm via `componentDidUpdate`, com a condição da seção 8.6.

- **Pronto quando:** os 6 UCs funcionam de ponta a ponta.

### Fase 6 — Acabamento (UI/UX e acessibilidade)

1. **Responsividade:** testar a 375 px. A grade vira lista, as tabelas ficam com `table-responsive` e os alvos de toque têm pelo menos 44 px.
2. **Estados:** cada página precisa tratar carregando, vazio, erro e sucesso.
3. **Acessibilidade:**
   - `label htmlFor` em todos os campos;
   - `aria-live` nos alertas;
   - foco visível;
   - contraste AA nos dois temas;
   - navegação completa por teclado.
4. **Consistência visual:** mesmos espaçamentos, ícones e cabeçalho com `Logo` em todas as páginas.

- **Pronto quando:** a passagem com `fixing-accessibility` e a navegação com `run` terminam sem pendências, e os testes T11–T14 passam.

### Fase 7 — Documentação técnica e revisão

1. Escrever o `README.md`:
   - pré-requisitos;
   - como criar o próprio Firebase e a chave;
   - `npm install` → `npm run check` → `npm run seed` → `npm start`;
   - contas de teste;
   - mapa de rotas e endpoints.
2. Comentários no código só onde explicam **por quê**: o padrão UMD, a transação, a condição do `componentDidUpdate` e a ordem dos scripts.
3. Rodar o **code-review** (nível medium) e corrigir o que for encontrado.
4. Rodada final de regressão: `npm run check`, `npm test`, `npm run seed -- --reset` e os testes T1–T14 completos.

- **Pronto quando:** a revisão termina sem achados abertos e a regressão passa. O projeto está pronto para a sessão de explicação com o Marredson (ver [ENTREGA.md](ENTREGA.md)).

---

## 10. Verificação (roteiro de testes)

| # | Cenário | Esperado |
|---|---|---|
| T1 | Calouro (`100000001`) tenta FRT0201 | Bloqueado por R1: "Faltam: WEB0101, ALG0101" (na tela e 409 na API) |
| T2 | Aluno se matricula em duas turmas no mesmo horário | A segunda é bloqueada por R2, citando a turma em conflito |
| T3 | Matrícula na turma lotada | Card vermelho e botão desabilitado. Um POST forçado devolve 409 (R3) |
| T4 | Repetir a mesma disciplina ou uma já cursada | R4 |
| T5 | Secretaria oferta um professor em horário já ocupado | Aviso no formulário e 409 (R5) |
| T6 | Professor na carga máxima | Desabilitado no select, e um POST forçado devolve 409 (R6) |
| T7 | Disciplina como pré-requisito de si mesma | Ela não aparece na lista, e um POST forçado devolve 409 (R7) |
| T8 | Mesma disciplina, mesmo horário e semestre | 409 (R8) |
| T9 | Matrícula `12ab` e e-mail `x@y` | Regex: campo marcado como inválido e 400 na API |
| T10 | Excluir disciplina, professor ou turma em uso | 409 com mensagem clara |
| T11 | Reiniciar o servidor | Os dados continuam lá (também visíveis no console do Firestore) |
| T12 | Forçar um `throw` temporário num render | O `ErrorBoundary` mostra o fallback, sem tela branca |
| T13 | Aluno acessa `#/admin/turmas` | Redirecionado para a página inicial do aluno |
| T14 | Largura de 375 px, navegação por teclado, tema escuro | Usável, sem rolagem horizontal, foco visível |

Os comandos automatizados são `npm run check`, `npm test` e um smoke test `Invoke-RestMethod` por endpoint. Os resultados ficam registrados no `testing-log.md` do Marredson.

---

## 11. Riscos técnicos

- **Chave do Firebase:** nunca no código nem em pastas distribuídas. Fica no `.gitignore`, e o README explica como gerar a própria.
- **Versões de CDN:** fixar versões exatas, nunca `@latest`. Sem internet, os CDNs não carregam.
- **Loop de `setState`:** todo `componentDidUpdate` precisa comparar com `prevState`/`prevProps` antes de chamar `fetch`.
- **Abrir por HTTP:** o `index.html` direto do disco (`file://`) não funciona, porque o app depende de `/js/app.js` e da API do servidor.
- **Cota do Firestore:** buscar dados só no `componentDidMount` e em `componentDidUpdate` com condição, nunca no `render`.

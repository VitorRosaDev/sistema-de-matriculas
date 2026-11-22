# Sistema de Atendimento e Matrículas

Front-end em **React 18 (UMD) + Bootstrap 5**, com o JSX compilado pelo servidor (esbuild), servido por uma API **Express 5** que persiste no **Firebase Firestore**. Tem a visão da **secretaria** (montar a oferta de turmas) e a do **aluno** (matricular-se). Implementa os 6 casos de uso do desafio e mais 2 (UC07 e UC08):

| UC | Ator | O que faz |
|---|---|---|
| UC01 | Secretaria | CRUD de disciplinas e pré-requisitos |
| UC02 | Secretaria | CRUD de professores (carga máxima) |
| UC03 | Secretaria | Oferta de turmas e grade dia × turno |
| UC04 | Secretaria | Painel de alocação (carga, equilíbrio, alunos por turma) |
| UC05 | Aluno | Matricular e cancelar, com filtros e o motivo de cada bloqueio |
| UC06 | Aluno | Minha grade, total de horas e impressão |
| UC07 | Aluno | Primeiro acesso (matrícula gerada), edição do cadastro e troca de senha |
| UC08 | Secretaria | Aprova ou recusa a troca de nome e data de nascimento pedida pelo aluno |

## Documentação

| Material | Onde |
|---|---|
| Casos de uso: fluxos principais e alternativos, regras, rotas, modelo de dados e arquitetura | [docs/casos-de-uso.pdf](docs/casos-de-uso.pdf) |
| Protótipo: wireframes das 12 telas (desktop e celular), em PDF e em PNG por tela | [docs/prototipo/](docs/prototipo/) ([wireframes.pdf](docs/prototipo/wireframes.pdf)) |
| Slides da apresentação (PowerPoint, com o roteiro nas notas do apresentador) | [docs/apresentacao/](docs/apresentacao/slides-apresentacao-desafio.pptx) |
| Vídeo de apresentação | link do Clipchamp, enviado junto com a entrega |

## Pré-requisitos

- Node.js 20 ou mais novo (testado com v26) e npm
- Um projeto Firebase com o Firestore ativado (plano Spark serve)
- Internet (React e Bootstrap vêm de CDN)

## Firebase

1. No [console do Firebase](https://console.firebase.google.com), crie um projeto e ative o **Firestore** (modo de produção; as regras podem negar todo acesso, pois só o servidor acessa o banco).
2. Em **Configurações do projeto → Contas de serviço → Gerar nova chave privada**, baixe o JSON.
3. Salve-o na raiz do projeto como `serviceAccountKey.json` (o formato está em `serviceAccountKey.example.json`).

> 🔒 `serviceAccountKey.json` é um segredo: está no `.gitignore` e nunca deve ser enviado nem distribuído.

## Rodando

```
npm install
npm run check     # grava, lê e apaga um documento de teste no Firestore
npm run seed      # popula dados de exemplo (idempotente)
npm start         # http://localhost:3000
```

Abra **sempre por `http://localhost:3000`**. O JSX é compilado pelo próprio servidor ([server/bundle.js](server/bundle.js)): todos os scripts do front viram um único `/js/app.js` (cerca de 18 KB comprimido), sem Babel no navegador. Fora de produção ele recompila sozinho quando um arquivo em `public/js` muda; basta recarregar a página. **Ao criar um arquivo novo em `public/js`, acrescente-o à lista `ORDEM` de `server/bundle.js`** (a ordem importa: os scripts compartilham o escopo global).

Outros comandos: `npm test` (16 casos da **lógica** compartilhada: regras R1–R8, regex e horário no código que o navegador também carrega, mais o hash de senha do servidor; roda sem Firebase e não renderiza nenhuma tela), `npm run test:seguranca` (68 verificações de autenticação e autorização por rota e perfil; sobe o servidor na porta 3057, usa o Firestore só para leitura e não grava nada), `npm run test:ui` (7 testes de interface no navegador, ver [Testes](#testes)), `npm run dev` (reinicia ao salvar) e `npm run seed -- --reset` (apaga as coleções antes de popular).

Variáveis opcionais: `PORT` (padrão 3000), `ADMIN_USUARIO` e `ADMIN_SENHA` (padrão `secretaria` / `unisinos`).

## Contas de teste

| Perfil | Acesso | Situação |
|---|---|---|
| Secretaria | usuário `secretaria`, senha `unisinos` | — |
| Aluno | matrícula `100000001` (ou e-mail `lucas.pereira@aluno.example`), senha `senha123` | calouro, sem disciplinas cursadas (testa R1) |
| Aluno | `100000002`, senha `senha123` | intermediário |
| Aluno | `100000003`, senha `senha123` | avançado |
| Aluno | `100000004`, senha `senha123` | já ocupa a única vaga de RED0101-52 (testa R3) |

O aluno entra com a **matrícula ou o e-mail** cadastrado (os e-mails do seed seguem `nome.sobrenome@aluno.example`). Um aluno novo se cadastra em **Primeiro acesso** (tela de login, aba Aluno).

Na tela de login, o botão flutuante **“i”** (canto inferior direito) abre um card que explica os dados do seed e lista os usuários de teste; clicar em um deles preenche o formulário, e basta clicar em *Entrar*.

Cenários prontos nos dados: ALG0101-21 e ESW0101-21 no mesmo horário (R2); Carla Mendes já está na carga máxima 2/2 (R6).

## Estrutura

```
server.js            sobe o Express (API em /api + arquivos estáticos de public/)
seed.js              popula o Firestore (--reset limpa antes)
serviceAccountKey.example.json   formato da chave do Firebase (a chave de verdade não vai na entrega)
playwright.config.js configuração dos testes de interface
server/              firebase.js, repositorio.js, erros.js, senha.js (scrypt), autenticacao.js (sessões e permissões), bundle.js (JSX → /js/app.js), montar.js, normalizar.js e rotas/ (uma por recurso)
scripts/             check-firebase.js, testar-regras.js e testar-seguranca.js
tests/ui/            testes de interface (Playwright): login, secretaria (R5) e matrícula do aluno
docs/                casos-de-uso.pdf, prototipo/ (wireframes) e apresentacao/ (slides)
public/              index.html, css/ e js/
  shared/            horario, validacao, regras, formatos (UMD: navegador e Node)
  services/api.js    fetch + Promises
  context/           SessaoContext
  components/        Logo, Navbar, ErrorBoundary, Alerta, Avisos (+ executarAcao), StatusSolicitacao, Estados, Campo, CardTurma, GradeHorario, BarraCarga
  pages/             uma página por rota
  router.jsx, App.jsx
```

## Regras de negócio

| Regra | Onde é aplicada |
|---|---|
| R1 pré-requisitos, R2 conflito do aluno, R4 duplicidade | `Regras.avaliarMatricula` (tela e servidor) |
| R3 vagas | transação do Firestore em `POST /api/matriculas` |
| R5 conflito do professor, R6 carga máxima, R8 oferta única | `Regras.avaliarOferta` (tela e servidor) |
| R7 pré-requisito válido | `Regras.verificarPreRequisitosValidos` |
| V1 formatos | regex em `public/js/shared/validacao.js` |

Os arquivos de `public/js/shared/` são UMD: o mesmo código roda no navegador (feedback imediato) e no Node (o servidor nunca confia no cliente).

## Rotas do front (hash)

`#/login`, `#/cadastro` · secretaria: `#/admin/disciplinas`, `#/admin/professores`, `#/admin/turmas`, `#/admin/alocacao`, `#/admin/solicitacoes` · aluno: `#/aluno/ofertas`, `#/aluno/grade`, `#/aluno/perfil` (o nome na barra superior leva para ele).

## API REST

Erros: `{ "erro": "mensagem" }` com 400 (formato), 401 (sem sessão ou login recusado), 403 (sem permissão, ou senha atual que não confere), 404, 409 (regra de negócio) ou 500. Com sessão aberta, a API nunca responde 401 por credencial errada: o front trata todo 401 fora do login como sessão expirada.

| Método e rota | Resposta |
|---|---|
| `POST /api/login` `{perfil:'aluno', identificador, senha}` (identificador = matrícula ou e-mail) ou `{perfil:'secretaria', usuario, senha}` | 200 · 400 · 401 · 429 (muitas tentativas) |
| `GET /api/sessao` (quem está logado; sem sessão devolve `{perfil:null, usuario:null}`), `POST /api/logout` | 200 · 204 |
| `GET/POST /api/disciplinas`, `PUT/DELETE /api/disciplinas/:id` | 200/201/204 · 400 · 404 · 409 |
| `GET/POST /api/professores`, `PUT/DELETE /api/professores/:id` | idem (`carga` = turmas no semestre atual) |
| `GET /api/turmas?semestre=2026/2`, `POST /api/turmas`, `PATCH /api/turmas/:id`, `DELETE /api/turmas/:id` | 200/201/204 · 400 · 409 |
| `GET /api/turmas/:id/alunos` | 200 |
| `POST /api/alunos` (primeiro acesso: nome completo, endereço, nascimento, e-mail, celular, senha) | 201 `{matricula}` · 400 · 409 (e-mail repetido) |
| `GET /api/alunos/:matricula`, `GET /api/alunos/:matricula/matriculas` | 200 · 404 (nunca devolve o hash da senha) |
| `PUT /api/alunos/:matricula` (endereço, e-mail, celular) | 200 · 400 · 409 |
| `PUT /api/alunos/:matricula/senha` `{senhaAtual, senhaNova}` | 204 · 400 · 403 (senha atual não confere) |
| `POST/GET /api/alunos/:matricula/solicitacoes` (nome ou dataNascimento) | 201/200 · 400 · 409 |
| `GET /api/solicitacoes`, `PATCH /api/solicitacoes/:id` `{status: aprovada|recusada}` | 200 · 409 (já decidida) |
| `POST /api/matriculas`, `DELETE /api/matriculas/:id` | 201/204 · 409 com os motivos |

## Autenticação e permissões

Toda rota da API (exceto `POST /api/login`, `POST /api/alunos` e `GET /api/sessao`) exige login. O servidor confere o perfil e, nas rotas do aluno, quem é o dono do dado:

| Rota | Quem acessa |
|---|---|
| `GET` disciplinas, professores, turmas | qualquer usuário logado |
| `POST`/`PUT`/`PATCH`/`DELETE` de disciplinas, professores, turmas | secretaria |
| `GET /turmas/:id/alunos`, `/solicitacoes` (listar e decidir) | secretaria |
| `GET /alunos/:matrícula` | o próprio aluno (cadastro completo); a secretaria vê só nome e e-mail |
| `PUT /alunos/:matrícula`, `/senha`, `POST /solicitacoes` | só o próprio aluno |
| `GET /alunos/:matrícula/matriculas` e `/solicitacoes` | o próprio aluno ou a secretaria |
| `POST /matriculas`, `DELETE /matriculas/:id` | aluno; o aluno da matrícula vem da sessão (não do corpo) e só se cancela a própria |

Respostas: **401** sem sessão (o front volta ao login) e **403** com sessão sem permissão. Requisições que alteram dados com `Origin` de outro site recebem 403 (CSRF, além do `SameSite=Strict`). Trocar a senha encerra as outras sessões do aluno.

## Testes

| Comando | O que cobre | Precisa de |
|---|---|---|
| `npm test` | Lógica de negócio e formatos (R1–R8, regex, horário), em `public/js/shared/` | só Node |
| `npm run test:seguranca` | API: 401 x 403 x 200 por rota e perfil (só leitura) | Firestore |
| `npm run test:ui` | Interface no Chromium, 7 testes: login e rota protegida (4), R5 na tela da secretaria (1), R1 e matrícula do aluno até a grade (2) | Firestore, internet (CDN) e Chromium |

**Rodar os testes de interface:** `npm install`, `npx playwright install chromium` (uma vez), `npm run seed` e `npm run test:ui`. O comando sobe o servidor na porta 3058 e usa as contas do seed. Os testes que gravam (turma `MAT0101-51` e as matrículas da Mariana em ALG0102 e FRT0201) apagam o que criaram, mesmo quando falham; se algo ficar para trás, `npm run seed -- --reset` devolve o banco ao estado inicial. Rodam um por vez (`workers: 1`) porque dividem o mesmo banco.

### O que ficou de fora (dívida técnica)

A lógica de negócio é a parte mais barata de testar e a que mais importa, por isso tem cobertura própria e roda em milissegundos. A interface cobre só o caminho crítico. Não há:

- **Testes de componente isolado** (um `CardTurma` ou um `Campo` sozinho). Os arquivos de `public/js` são concatenados num único script e compartilham o escopo global (sem `import`), então um teste em jsdom exigiria antes migrar para módulos ES. Foi uma escolha consciente para o escopo da disciplina, e é o primeiro item a pagar.
- **Banco de testes.** Os testes de interface gravam no Firestore real e limpam depois. O ideal é o emulador do Firestore (ou um projeto Firebase só para testes), que também dispensaria o `seed` antes de cada rodada.
- **Independência da internet.** React e Bootstrap vêm de CDN; sem rede os testes não rodam. Dá para interceptar essas requisições e servir os arquivos de `node_modules`.
- **Acessibilidade automatizada** (axe), **regressão visual** e **outros navegadores**: os testes usam só o Chromium, e nada confere acessibilidade ou aparência de forma automática (os rótulos e `aria-*` existem nos componentes, mas não há teste que os cobre além do que os seletores já exigem).
- **Fluxos fora do caminho crítico:** cadastro de aluno, solicitações, alocação e CRUD de disciplinas e professores não têm teste de interface (a API deles é coberta por `test:seguranca` e as regras por `npm test`).

## Limitações conhecidas

- **Senhas** são guardadas com hash scrypt e sal por aluno, nunca em texto.
- **Sessão em memória, uma instância:** o login cria uma sessão no servidor (cookie `HttpOnly`, `SameSite=Strict`, 4 h; novo identificador a cada login; o logout a invalida). Reiniciar o servidor encerra todas as sessões, e mais de uma instância exigiria um repositório compartilhado (ex.: Redis ou Firestore). Não há perfis além de aluno e secretaria, e a secretaria é uma só conta (`ADMIN_USUARIO`/`ADMIN_SENHA`).
- Login: no máximo 10 tentativas erradas a cada 15 min por IP (429 depois disso; atrás de proxy, configure `trust proxy`). Com `NODE_ENV=production` o servidor **não sobe** sem `ADMIN_SENHA`; fora disso a senha padrão `unisinos` vale (com aviso no console).
- Endurecimento aplicado: cabeçalhos de segurança e CSP sem `unsafe-eval`/`unsafe-inline` nos scripts (`helmet`), `X-Robots-Tag: noindex`, compressão gzip, scripts/estilos de CDN com SRI e `defer`, React em versão de produção, JSX pré-compilado (sem Babel no navegador), `noindex` + `robots.txt` (sistema com login não deve ser indexado), limite de cadastros por IP (5 criados e 30 tentativas por hora; o 409 "e-mail já cadastrado" continua, porque o aluno precisa saber que deve entrar, mas o limite freia a varredura de e-mails), scrypt assíncrono com custo igual para contas inexistentes e `npm audit` sem vulnerabilidades.
- A API monta as respostas lendo coleções inteiras; serve para o volume de uma turma, não para produção.
- Unicidade de e-mail e as exclusões com dependência também são conferidas sem transação.
- R5, R6 e R8 são conferidas no servidor, mas sem transação (duas ofertas simultâneas poderiam passar). R3 e a duplicidade de matrícula usam transação.
- O código de uma disciplina não pode ser editado depois de criada (é o ID do documento).

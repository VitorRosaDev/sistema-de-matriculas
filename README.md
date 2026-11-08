# Sistema de Atendimento e Matrículas

Front-end em **React 18 (UMD) + Bootstrap 5**, com o JSX compilado pelo servidor (esbuild), servido por uma API **Express 5** que persiste no **Firebase Firestore**. Tem a visão da **secretaria** (montar a oferta de turmas) e a do **aluno** (matricular-se). Implementa 6 casos de uso:

| UC | Ator | O que faz |
|---|---|---|
| UC01 | Secretaria | CRUD de disciplinas e pré-requisitos |
| UC02 | Secretaria | CRUD de professores (carga máxima) |
| UC03 | Secretaria | Oferta de turmas e grade dia × turno |
| UC04 | Secretaria | Painel de alocação (carga, equilíbrio, alunos por turma) |
| UC05 | Aluno | Matricular e cancelar, com filtros e o motivo de cada bloqueio |
| UC06 | Aluno | Minha grade, total de horas e impressão |
| Cadastro | Aluno | Primeiro acesso (matrícula gerada), edição do cadastro e troca de senha |
| Autorizações | Secretaria | Aprova ou recusa a troca de nome e data de nascimento pedida pelo aluno |

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

Outros comandos: `npm test` (16 casos: regras R1–R8, regex, senha e horário; roda sem Firebase), `npm run test:seguranca` (68 verificações de autenticação e autorização por rota e perfil; sobe o servidor na porta 3057, usa o Firestore só para leitura e não grava nada), `npm run dev` (reinicia ao salvar) e `npm run seed -- --reset` (apaga as coleções antes de popular).

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
server/              firebase.js, repositorio.js, erros.js, senha.js (scrypt), autenticacao.js (sessões e permissões), bundle.js (JSX → /js/app.js) e rotas/ (uma por recurso)
scripts/             check-firebase.js, testar-regras.js e testar-seguranca.js
public/              index.html, css/ e js/
  shared/            horario, validacao, regras, formatos (UMD: navegador e Node)
  services/api.js    fetch + Promises
  context/           SessaoContext
  components/        Logo, Navbar, ErrorBoundary, Alerta, Campo, CardTurma, GradeHorario, BarraCarga...
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

Erros: `{ "erro": "mensagem" }` com 400 (formato), 401 (login), 404, 409 (regra de negócio) ou 500.

| Método e rota | Resposta |
|---|---|
| `POST /api/login` `{perfil:'aluno', identificador, senha}` (identificador = matrícula ou e-mail) ou `{perfil:'secretaria', usuario, senha}` | 200 · 400 · 401 |
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

## Limitações conhecidas

- **Senhas** são guardadas com hash scrypt e sal por aluno, nunca em texto.
- **Sessão em memória, uma instância:** o login cria uma sessão no servidor (cookie `HttpOnly`, `SameSite=Strict`, 4 h; novo identificador a cada login; o logout a invalida). Reiniciar o servidor encerra todas as sessões, e mais de uma instância exigiria um repositório compartilhado (ex.: Redis ou Firestore). Não há perfis além de aluno e secretaria, e a secretaria é uma só conta (`ADMIN_USUARIO`/`ADMIN_SENHA`).
- Login: no máximo 10 tentativas erradas a cada 15 min por IP (429 depois disso; atrás de proxy, configure `trust proxy`). Com `NODE_ENV=production` o servidor **não sobe** sem `ADMIN_SENHA`; fora disso a senha padrão `unisinos` vale (com aviso no console).
- Endurecimento aplicado: cabeçalhos de segurança e CSP sem `unsafe-eval`/`unsafe-inline` nos scripts (`helmet`), `X-Robots-Tag: noindex`, compressão gzip, scripts/estilos de CDN com SRI e `defer`, React em versão de produção, JSX pré-compilado (sem Babel no navegador), `noindex` + `robots.txt` (sistema com login não deve ser indexado), limite de cadastros por IP (5 criados e 30 tentativas por hora; o 409 "e-mail já cadastrado" continua, porque o aluno precisa saber que deve entrar, mas o limite freia a varredura de e-mails), scrypt assíncrono com custo igual para contas inexistentes e `npm audit` sem vulnerabilidades.
- A API monta as respostas lendo coleções inteiras; serve para o volume de uma turma, não para produção.
- Unicidade de e-mail e as exclusões com dependência também são conferidas sem transação.
- R5, R6 e R8 são conferidas no servidor, mas sem transação (duas ofertas simultâneas poderiam passar). R3 e a duplicidade de matrícula usam transação.
- O código de uma disciplina não pode ser editado depois de criada (é o ID do documento).

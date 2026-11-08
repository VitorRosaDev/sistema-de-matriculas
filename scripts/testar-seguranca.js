// Teste de autorização da API: sobe o servidor numa porta própria e confere 401/403/200 por rota e perfil.
// Só faz leituras e tentativas que o servidor recusa; não grava nada no Firestore. Precisa de serviceAccountKey.json.
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORTA = 3057;
const BASE = 'http://localhost:' + PORTA;
let total = 0;

async function req(metodo, caminho, { cookie, corpo, origem } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  if (origem) headers.Origin = origem;
  const r = await fetch(BASE + '/api' + caminho, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
  const setCookie = r.headers.get('set-cookie');
  return { status: r.status, cookie: setCookie ? setCookie.split(';')[0] : null, setCookie, corpo: await r.json().catch(() => null) };
}

async function esperar(nome, metodo, caminho, status, opcoes) {
  const r = await req(metodo, caminho, opcoes);
  assert.strictEqual(r.status, status, `${nome}: esperava ${status}, veio ${r.status} (${metodo} ${caminho})`);
  total++;
  console.log('ok  ' + nome);
  return r;
}

async function principal() {
  // 1. Sem login, tudo que não é público é recusado.
  const protegidas = [
    ['GET', '/disciplinas'], ['GET', '/professores'], ['GET', '/turmas'], ['GET', '/turmas/x/alunos'], ['GET', '/solicitacoes'],
    ['GET', '/alunos/100000001'], ['GET', '/alunos/100000001/matriculas'], ['GET', '/alunos/100000001/solicitacoes'],
    ['PUT', '/alunos/100000001'], ['PUT', '/alunos/100000001/senha'], ['POST', '/alunos/100000001/solicitacoes'],
    ['POST', '/disciplinas'], ['PUT', '/disciplinas/x'], ['DELETE', '/disciplinas/x'],
    ['POST', '/professores'], ['PUT', '/professores/x'], ['DELETE', '/professores/x'],
    ['POST', '/turmas'], ['PATCH', '/turmas/x'], ['DELETE', '/turmas/x'],
    ['PATCH', '/solicitacoes/x'], ['POST', '/matriculas'], ['DELETE', '/matriculas/x'],
  ];
  for (const [m, c] of protegidas) await esperar('sem login: ' + m + ' ' + c + ' → 401', m, c, 401, { corpo: m === 'GET' ? undefined : {} });

  const anonima = await esperar('sem login: GET /sessao → 200 com nulos (não é erro)', 'GET', '/sessao', 200);
  assert.deepStrictEqual(anonima.corpo, { perfil: null, usuario: null });
  total++; console.log('ok  /sessao anônima devolve {perfil:null, usuario:null}');

  // 2. Cookie falso ou adulterado não vale.
  await esperar('cookie inventado → 401', 'GET', '/disciplinas', 401, { cookie: 'sessao=abc' });

  // 3. Login do aluno: cookie HttpOnly + SameSite=Strict.
  const a = await esperar('login do aluno → 200', 'POST', '/login', 200, { corpo: { perfil: 'aluno', identificador: '100000002', senha: 'senha123' } });
  assert.ok(/HttpOnly/i.test(a.setCookie) && /SameSite=Strict/i.test(a.setCookie), 'cookie precisa de HttpOnly e SameSite=Strict');
  total++; console.log('ok  cookie da sessão é HttpOnly e SameSite=Strict');
  const aluno = a.cookie;
  const outraSessao = (await req('POST', '/login', { corpo: { perfil: 'aluno', identificador: '100000002', senha: 'senha123' } })).cookie;
  assert.notStrictEqual(outraSessao, aluno);
  total++; console.log('ok  cada login gera um identificador de sessão novo');

  await esperar('aluno: GET /sessao → 200', 'GET', '/sessao', 200, { cookie: aluno });
  await esperar('aluno: lê o próprio cadastro → 200', 'GET', '/alunos/100000002', 200, { cookie: aluno });
  const proprio = await req('GET', '/alunos/100000002', { cookie: aluno });
  assert.ok(!('senhaHash' in proprio.corpo) && !('senhaSal' in proprio.corpo));
  total++; console.log('ok  resposta do aluno não traz hash nem sal');
  await esperar('aluno: lê dados de OUTRO aluno → 403', 'GET', '/alunos/100000001', 403, { cookie: aluno });
  await esperar('aluno: altera contato de OUTRO aluno → 403', 'PUT', '/alunos/100000001', 403, { cookie: aluno, corpo: {} });
  await esperar('aluno: troca a senha de OUTRO aluno → 403', 'PUT', '/alunos/100000001/senha', 403, { cookie: aluno, corpo: {} });
  await esperar('aluno: matrículas de OUTRO aluno → 403', 'GET', '/alunos/100000001/matriculas', 403, { cookie: aluno });
  await esperar('aluno: lê as próprias matrículas → 200', 'GET', '/alunos/100000002/matriculas', 200, { cookie: aluno });
  await esperar('aluno: lista turmas → 200', 'GET', '/turmas', 200, { cookie: aluno });
  for (const [m, c] of [['POST', '/disciplinas'], ['DELETE', '/disciplinas/x'], ['POST', '/professores'], ['DELETE', '/professores/x'],
    ['POST', '/turmas'], ['PATCH', '/turmas/x'], ['DELETE', '/turmas/x'], ['GET', '/turmas/x/alunos'], ['GET', '/solicitacoes'], ['PATCH', '/solicitacoes/x']]) {
    await esperar('aluno: ' + m + ' ' + c + ' → 403', m, c, 403, { cookie: aluno, corpo: m === 'GET' ? undefined : {} });
  }
  await esperar('aluno: apagar matrícula inexistente/alheia → 404', 'DELETE', '/matriculas/inexistente', 404, { cookie: aluno });

  // 4. Secretaria.
  const s = await esperar('login da secretaria → 200', 'POST', '/login', 200, { corpo: { perfil: 'secretaria', usuario: 'secretaria', senha: process.env.ADMIN_SENHA || 'unisinos' } });
  const sec = s.cookie;
  await esperar('secretaria: GET /solicitacoes → 200', 'GET', '/solicitacoes', 200, { cookie: sec });
  await esperar('secretaria: GET /disciplinas → 200', 'GET', '/disciplinas', 200, { cookie: sec });
  const visao = await req('GET', '/alunos/100000002', { cookie: sec });
  assert.strictEqual(visao.status, 200);
  assert.ok(!('endereco' in visao.corpo) && !('telefone' in visao.corpo) && !('dataNascimento' in visao.corpo), 'secretaria não recebe endereço/telefone/nascimento');
  total++; console.log('ok  secretaria vê só nome e e-mail do aluno');
  await esperar('secretaria: PUT em cadastro de aluno → 403', 'PUT', '/alunos/100000002', 403, { cookie: sec, corpo: {} });
  await esperar('secretaria: matricular → 403', 'POST', '/matriculas', 403, { cookie: sec, corpo: {} });
  await esperar('secretaria: cancelar matrícula → 403', 'DELETE', '/matriculas/x', 403, { cookie: sec });

  // 5. CSRF: origem diferente é recusada, mesmo com cookie válido.
  await esperar('origem de outro site → 403', 'POST', '/logout', 403, { cookie: aluno, origem: 'http://site-malicioso.example' });

  // 6. Logout invalida a sessão no servidor (o cookie antigo deixa de valer).
  await esperar('logout → 204', 'POST', '/logout', 204, { cookie: aluno });
  const depois = await esperar('depois do logout o cookie antigo não vale (/sessao vem vazia)', 'GET', '/sessao', 200, { cookie: aluno });
  assert.strictEqual(depois.corpo.perfil, null);
  await esperar('depois do logout o cookie antigo → 401 nas rotas protegidas', 'GET', '/disciplinas', 401, { cookie: aluno });
  await esperar('outra sessão do mesmo aluno continua válida → 200', 'GET', '/sessao', 200, { cookie: outraSessao });

  // 7. Login errado não cria sessão.
  const ruim = await esperar('senha errada → 401', 'POST', '/login', 401, { corpo: { perfil: 'aluno', identificador: '100000002', senha: 'errada' } });
  assert.strictEqual(ruim.cookie, null);
  total++; console.log('ok  login recusado não envia cookie');

  // 8. Cabeçalhos e páginas estáticas.
  const raiz = await fetch(BASE + '/');
  const h = (n) => raiz.headers.get(n) || '';
  assert.ok(!h('x-powered-by'), 'não anuncia o Express');
  assert.ok(/noindex/.test(h('x-robots-tag')), 'X-Robots-Tag noindex');
  assert.ok(/no-cache/.test(h('cache-control')), 'index.html revalida');
  assert.ok(!/unsafe-eval|unsafe-inline/.test((h('content-security-policy').match(/script-src[^;]*/) || [''])[0]), 'CSP de script sem unsafe-*');
  assert.ok(/nosniff/.test(h('x-content-type-options')) && /frame-ancestors 'none'/.test(h('content-security-policy')));
  total++; console.log('ok  cabeçalhos: sem X-Powered-By, noindex, no-cache no HTML, CSP de script sem unsafe-*');
  const html = await raiz.text();
  assert.ok(!/babel/i.test(html) && /name="description"/.test(html), 'sem Babel e com meta description');
  total++; console.log('ok  index.html sem Babel e com meta description');
  const app = await fetch(BASE + '/js/app.js');
  assert.strictEqual(app.status, 200);
  assert.ok(/javascript/.test(app.headers.get('content-type')));
  total++; console.log('ok  /js/app.js (JSX compilado) é servido como JavaScript');
  const nf = await fetch(BASE + '/pagina-que-nao-existe');
  assert.strictEqual(nf.status, 404);
  assert.strictEqual(await nf.text(), 'Página não encontrada.');
  total++; console.log('ok  404 de página em português, sem "Cannot GET"');

  // 9. Cadastro público: só valida (corpo inválido, nada é criado), mas o limite de tentativas vale.
  const statusCadastro = [];
  for (let i = 0; i < 32; i++) statusCadastro.push((await req('POST', '/alunos', { corpo: { nome: 'a' } })).status);
  assert.ok(statusCadastro.slice(0, 30).every((c) => c === 400), 'as 30 primeiras tentativas são validadas (400)');
  assert.ok(statusCadastro.slice(30).every((c) => c === 429), 'a partir da 31ª o IP é freado (429)');
  total++; console.log('ok  cadastro: 30 tentativas por hora por IP, depois 429');
}

const servidor = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
  env: { ...process.env, PORT: String(PORTA) }, stdio: ['ignore', 'pipe', 'pipe'],
});
let pronto;
const subiu = new Promise((resolve, reject) => {
  pronto = resolve;
  servidor.stderr.on('data', (d) => { if (!/Aviso: ADMIN_SENHA/.test(String(d))) process.stderr.write(d); });
  servidor.on('exit', (c) => reject(new Error('servidor saiu (código ' + c + ')')));
});
servidor.stdout.on('data', (d) => { if (String(d).includes('localhost:' + PORTA)) pronto(); });

subiu
  .then(principal)
  .then(() => console.log('\n' + total + ' verificações de segurança passaram.'))
  .catch((e) => { console.error('\nFALHOU:', e.message); process.exitCode = 1; })
  .finally(() => servidor.kill());

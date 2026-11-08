// Sessão no servidor: o login cria um identificador aleatório guardado em memória e enviado em um cookie
// HttpOnly (o JavaScript da página não lê), SameSite=Strict (o navegador não o envia em requisições de outros sites).
// Em memória: reiniciar o servidor encerra todas as sessões, e só há uma instância.
const crypto = require('crypto');
const { ErroHttp } = require('./erros');

const COOKIE = 'sessao';
const DURACAO_MS = 4 * 60 * 60 * 1000;
const producao = process.env.NODE_ENV === 'production';

const sessoes = new Map(); // sid -> { perfil, id, nome, expira }

// Remove as expiradas de tempos em tempos (unref: não segura o processo aberto).
setInterval(() => {
  const agora = Date.now();
  for (const [sid, s] of sessoes) if (s.expira <= agora) sessoes.delete(sid);
}, 10 * 60 * 1000).unref();

function criar(res, { perfil, id, nome }) {
  const sid = crypto.randomBytes(32).toString('base64url'); // novo a cada login (evita fixação de sessão)
  sessoes.set(sid, { perfil, id, nome, expira: Date.now() + DURACAO_MS });
  res.cookie(COOKIE, sid, { httpOnly: true, sameSite: 'strict', secure: producao, path: '/', maxAge: DURACAO_MS });
}

function lerCookie(req, nome) {
  for (const par of (req.headers.cookie || '').split(';')) {
    const i = par.indexOf('=');
    if (i > 0 && par.slice(0, i).trim() === nome) return decodeURIComponent(par.slice(i + 1).trim());
  }
  return null;
}

function sidDaRequisicao(req) {
  return lerCookie(req, COOKIE);
}

function encerrar(req, res) {
  const sid = sidDaRequisicao(req);
  if (sid) sessoes.delete(sid);
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict', secure: producao, path: '/' });
}

// Encerra as sessões de um aluno, exceto a atual (usado quando a senha muda).
function encerrarOutras(id, sidAtual) {
  for (const [sid, s] of sessoes) if (s.perfil === 'aluno' && s.id === id && sid !== sidAtual) sessoes.delete(sid);
}

// Preenche req.sessao ({ perfil, id, nome }) quando há uma sessão válida.
function carregarSessao(req, res, next) {
  const sid = sidDaRequisicao(req);
  const s = sid && sessoes.get(sid);
  if (s && s.expira > Date.now()) req.sessao = { perfil: s.perfil, id: s.id, nome: s.nome };
  else if (s) sessoes.delete(sid);
  next();
}

function exigirLogin(req, res, next) {
  if (!req.sessao) throw new ErroHttp(401, 'Faça login para continuar.');
  next();
}

const exigirPerfil = (perfil) => (req, res, next) => {
  if (!req.sessao) throw new ErroHttp(401, 'Faça login para continuar.');
  if (req.sessao.perfil !== perfil) throw new ErroHttp(403, 'Você não tem permissão para esta ação.');
  next();
};

// O aluno só acessa o que é dele; `tambemSecretaria` libera a secretaria (leitura).
const exigirDono = (param, { tambemSecretaria = false } = {}) => (req, res, next) => {
  if (!req.sessao) throw new ErroHttp(401, 'Faça login para continuar.');
  if (tambemSecretaria && req.sessao.perfil === 'secretaria') return next();
  if (req.sessao.perfil !== 'aluno' || req.sessao.id !== req.params[param]) {
    throw new ErroHttp(403, 'Você não tem permissão para acessar estes dados.');
  }
  next();
};

// Proteção extra contra CSRF: requisições que alteram dados precisam vir da mesma origem.
function mesmaOrigem(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origem = req.headers.origin;
  if (origem) {
    let host = null;
    try { host = new URL(origem).host; } catch (e) { /* origem inválida */ }
    if (host !== req.headers.host) throw new ErroHttp(403, 'Origem não permitida.');
  }
  next();
}

// Comparação em tempo constante (compara os hashes, que têm sempre o mesmo tamanho).
function iguais(a, b) {
  const h = (v) => crypto.createHash('sha256').update(String(v)).digest();
  return crypto.timingSafeEqual(h(a), h(b));
}

// Credencial da secretaria: em produção, a senha precisa vir do ambiente (sem padrão conhecido).
function credencialSecretaria() {
  const senha = process.env.ADMIN_SENHA;
  if (!senha && producao) throw new Error('Defina ADMIN_SENHA: em produção a senha padrão da secretaria é recusada.');
  if (!senha) console.warn('Aviso: ADMIN_SENHA não definida; usando a senha padrão de teste da secretaria.');
  return { usuario: process.env.ADMIN_USUARIO || 'secretaria', senha: senha || 'unisinos' };
}

module.exports = {
  criar, encerrar, encerrarOutras, sidDaRequisicao, carregarSessao, exigirLogin, exigirPerfil, exigirDono,
  mesmaOrigem, iguais, credencialSecretaria,
};

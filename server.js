const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const Auth = require('./server/autenticacao');
const Bundle = require('./server/bundle');
const { naoEncontradoApi, tratarErros } = require('./server/erros');

const app = express();
app.disable('x-powered-by');

// CSP: o app carrega React e Bootstrap dos CDNs (com SRI no index.html) e o próprio código já compilado em /js/app.js;
// não há eval nem script inline.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null, // o app roda em http://localhost
    },
  },
  strictTransportSecurity: false, // HSTS só faz sentido atrás de HTTPS
}));
// Sistema com login: nada daqui deve ser indexado (reforça o <meta robots> e o robots.txt).
app.use((req, res, next) => { res.set('X-Robots-Tag', 'noindex, nofollow'); next(); });
app.use(compression());
app.use(express.json());
// As respostas da API dependem de quem está logado: nunca ficam em cache.
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, Auth.mesmaOrigem, Auth.carregarSessao);
// Todo o JS do app (JSX já compilado) num arquivo só. Fora de produção, recompila quando um fonte muda;
// `no-cache` + ETag: o navegador revalida e recebe 304 enquanto nada mudou.
app.get('/js/app.js', (req, res) => {
  res.type('js').set('Cache-Control', 'no-cache').send(Bundle.obter({ recompilar: process.env.NODE_ENV !== 'production' }));
});
// HTML, CSS e JS revalidam a cada abertura (ETag → 304), para um deploy nunca deixar a página velha; o resto fica 1 h em cache.
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  setHeaders: (res, arquivo) => { if (/\.(html|css|js|jsx)$/.test(arquivo)) res.set('Cache-Control', 'no-cache'); },
}));

// Limita tentativas erradas de login por IP (as bem-sucedidas não contam). Atrás de proxy, configure 'trust proxy'.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' },
});
app.use('/api/login', limiteLogin);

// Cadastro público (primeiro acesso): limita quantos cadastros um IP cria e quantas tentativas faz. O segundo limite
// também freia a descoberta de e-mails já cadastrados pelo 409 (a mensagem fica, porque o aluno precisa saber que deve entrar).
const limiteCadastroCriados = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  skipFailedRequests: true, // só conta cadastros que deram certo
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { erro: 'Muitos cadastros deste endereço. Tente novamente mais tarde.' },
});
const limiteCadastroTentativas = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' },
});
app.post('/api/alunos', limiteCadastroTentativas, limiteCadastroCriados);

app.use('/api', require('./server/rotas/sessao'));
app.use('/api/disciplinas', require('./server/rotas/disciplinas'));
app.use('/api/professores', require('./server/rotas/professores'));
app.use('/api/alunos', require('./server/rotas/alunos'));
app.use('/api/turmas', require('./server/rotas/turmas'));
app.use('/api/matriculas', require('./server/rotas/matriculas'));
app.use('/api/solicitacoes', require('./server/rotas/solicitacoes'));

app.use('/api', naoEncontradoApi);
app.use(tratarErros);
app.use((req, res) => res.status(404).type('text/plain; charset=utf-8').send('Página não encontrada.'));

const porta = process.env.PORT || 3000;
app.listen(porta, () => console.log('http://localhost:' + porta));

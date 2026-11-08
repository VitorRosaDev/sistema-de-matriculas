// Junta e compila (JSX → JS) todos os scripts do front-end em um único arquivo, servido em /js/app.js.
// O navegador não precisa do Babel: recebe JS puro. A ordem importa, porque os scripts compartilham o escopo global
// (compartilhados → serviço → contexto → componentes → páginas → router → App).
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const RAIZ = path.join(__dirname, '..', 'public', 'js');
const ORDEM = [
  'shared/horario.js', 'shared/validacao.js', 'shared/regras.js', 'shared/formatos.js', 'services/api.js',
  'context/SessaoContext.jsx',
  'components/Logo.jsx', 'components/Alerta.jsx', 'components/Avisos.jsx', 'components/StatusSolicitacao.jsx', 'components/Estados.jsx', 'components/Campo.jsx', 'components/ErrorBoundary.jsx',
  'components/Navbar.jsx', 'components/BarraCarga.jsx', 'components/GradeHorario.jsx', 'components/CardTurma.jsx',
  'pages/Login.jsx', 'pages/Cadastro.jsx', 'pages/AlunoPerfil.jsx', 'pages/AdminSolicitacoes.jsx', 'pages/AdminDisciplinas.jsx',
  'pages/AdminProfessores.jsx', 'pages/AdminTurmas.jsx', 'pages/AdminAlocacao.jsx', 'pages/AlunoOfertas.jsx', 'pages/AlunoGrade.jsx',
  'pages/NaoEncontrada.jsx', 'router.jsx', 'App.jsx',
];

let cache = null; // { codigo, versao }

// Maior data de modificação dos fontes: em desenvolvimento, recompila quando algum muda.
function versaoDosFontes() {
  return Math.max(...ORDEM.map((f) => fs.statSync(path.join(RAIZ, f)).mtimeMs));
}

function compilar() {
  const fontes = ORDEM.map((f) => '/* ' + f + ' */\n' + fs.readFileSync(path.join(RAIZ, f), 'utf8'));
  // Sem `format`: nomes de topo (classes, constantes) continuam globais, como nos scripts separados.
  return esbuild.transformSync(fontes.join('\n'), { loader: 'jsx', minify: true, target: 'es2020', legalComments: 'none' }).code;
}

function obter({ recompilar = false } = {}) {
  const versao = recompilar || !cache ? versaoDosFontes() : cache.versao;
  if (!cache || (recompilar && versao !== cache.versao)) cache = { codigo: compilar(), versao };
  return cache.codigo;
}

module.exports = { obter, ORDEM };

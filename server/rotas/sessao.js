const express = require('express');
const repo = require('../repositorio');
const Validacao = require('../../public/js/shared/validacao.js');
const Senha = require('../senha');
const Auth = require('../autenticacao');
const { ErroHttp } = require('../erros');

const router = express.Router();

// Falha na inicialização se, em produção, ADMIN_SENHA não estiver definida.
const CREDENCIAL_SECRETARIA = Auth.credencialSecretaria();

// Login simulado (autenticação não faz parte da AA). A senha é conferida aqui, nunca no JS do navegador.
router.post('/login', async (req, res) => {
  const { perfil, identificador, usuario, senha } = req.body || {};
  if (Validacao.temErros(Validacao.validarLogin({ perfil, identificador, usuario, senha }))) {
    throw new ErroHttp(400, 'Dados de login inválidos.');
  }
  if (perfil === 'aluno') {
    const id = identificador.trim();
    // Matrícula é o id do documento; o e-mail é guardado em minúsculas (ver rotas/alunos.js).
    const aluno = Validacao.REGEX.matricula.test(id)
      ? await repo.obter('alunos', id)
      : (await repo.buscarPor('alunos', 'email', id.toLowerCase()))[0];
    // Mesma mensagem para identificador inexistente e senha errada: não revela quem tem cadastro.
    const confere = aluno ? await Senha.conferir(senha, aluno) : await Senha.conferirFalso(senha);
    if (!confere) throw new ErroHttp(401, 'Matrícula/e-mail ou senha incorretos.');
    Auth.criar(res, { perfil, id: aluno.id, nome: aluno.nome });
    return res.json({ perfil, usuario: { id: aluno.id, nome: aluno.nome } });
  }
  // Os dois campos são conferidos (sem curto-circuito) em tempo constante.
  const usuarioOk = Auth.iguais(usuario, CREDENCIAL_SECRETARIA.usuario);
  const senhaOk = Auth.iguais(senha, CREDENCIAL_SECRETARIA.senha);
  if (!(usuarioOk && senhaOk)) throw new ErroHttp(401, 'Usuário ou senha incorretos.');
  Auth.criar(res, { perfil, id: 'secretaria', nome: 'Secretaria' });
  res.json({ perfil, usuario: { id: 'secretaria', nome: 'Secretaria' } });
});

// Quem sou eu: o front usa ao abrir a página (a sessão vive no cookie, não no JavaScript).
// Sem sessão responde 200 com nulos (e não 401): não é erro, e evita ruído vermelho no console do navegador.
router.get('/sessao', (req, res) => {
  if (!req.sessao) return res.json({ perfil: null, usuario: null });
  res.json({ perfil: req.sessao.perfil, usuario: { id: req.sessao.id, nome: req.sessao.nome } });
});

router.post('/logout', (req, res) => {
  Auth.encerrar(req, res);
  res.status(204).end();
});

module.exports = router;

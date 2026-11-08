const crypto = require('crypto');
const express = require('express');
const { db, FieldValue } = require('../firebase');
const repo = require('../repositorio');
const Senha = require('../senha');
const Validacao = require('../../public/js/shared/validacao.js');
const Horario = require('../../public/js/shared/horario.js');
const montar = require('../montar');
const Auth = require('../autenticacao');
const Normalizar = require('../normalizar');
const { ErroHttp, exigirValido } = require('../erros');

const router = express.Router();

async function carregarAluno(matricula) {
  if (!Validacao.REGEX.matricula.test(matricula)) throw new ErroHttp(400, 'Matrícula inválida.');
  const aluno = await repo.obter('alunos', matricula);
  if (!aluno) throw new ErroHttp(404, 'Aluno não encontrado.');
  return aluno;
}

async function emailEmUso(email, ignorarId) {
  const mesmos = await repo.buscarPor('alunos', 'email', email);
  return mesmos.some((a) => a.id !== ignorarId);
}

// Primeiro acesso: cria o aluno e devolve a matrícula gerada (usada no login).
router.post('/', async (req, res) => {
  const c = req.body || {};
  const dados = {
    nome: Normalizar.nome(c.nome),
    endereco: Normalizar.aparar(c.endereco),
    dataNascimento: c.dataNascimento,
    email: Normalizar.email(c.email),
    telefone: Validacao.soDigitos(c.telefone),
    senha: c.senha,
  };
  exigirValido(Validacao.validarCadastro(dados));
  if (await emailEmUso(dados.email)) throw new ErroHttp(409, 'Já existe um cadastro com este e-mail.');

  const { senha, ...semSenha } = dados;
  // `create` falha se a matrícula já existir; sorteia outra (colisão é rara em 800 milhões de números).
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const matricula = String(crypto.randomInt(200000000, 1000000000));
    try {
      await db.collection('alunos').doc(matricula).create({
        ...semSenha, matricula, cursadas: [], ...Senha.gerar(senha), criadoEm: FieldValue.serverTimestamp(),
      });
      return res.status(201).json({ matricula, nome: dados.nome });
    } catch (e) {
      if (e.code !== 6) throw e; // 6 = ALREADY_EXISTS
    }
  }
  throw new ErroHttp(500, 'Não foi possível gerar a matrícula. Tente novamente.');
});

// Dados do aluno (inclui `cursadas`, necessário para a tela avaliar R1 e R4).
router.get('/:matricula', Auth.exigirDono('matricula', { tambemSecretaria: true }), async (req, res) => {
  const aluno = await carregarAluno(req.params.matricula);
  // A secretaria vê só o necessário para o atendimento; endereço, telefone e nascimento são do próprio aluno.
  if (req.sessao.perfil === 'secretaria') return res.json({ id: aluno.id, matricula: aluno.matricula, nome: aluno.nome, email: aluno.email });
  res.json(Senha.publico(aluno));
});

// Endereço, e-mail e telefone: livres. Nome e data de nascimento NÃO passam por aqui.
router.put('/:matricula', Auth.exigirDono('matricula'), async (req, res) => {
  const aluno = await carregarAluno(req.params.matricula);
  const c = req.body || {};
  const dados = {
    endereco: Normalizar.aparar(c.endereco),
    email: Normalizar.email(c.email),
    telefone: Validacao.soDigitos(c.telefone),
  };
  exigirValido(Validacao.validarContato(dados));
  if (await emailEmUso(dados.email, aluno.id)) throw new ErroHttp(409, 'Já existe um cadastro com este e-mail.');
  res.json(Senha.publico(await repo.atualizar('alunos', aluno.id, dados)));
});

router.put('/:matricula/senha', Auth.exigirDono('matricula'), async (req, res) => {
  const aluno = await carregarAluno(req.params.matricula);
  const { senhaAtual, senhaNova } = req.body || {};
  // 403, e não 401: o aluno ESTÁ autenticado. 401 significa "sem sessão", e o front encerra a sessão ao recebê-lo.
  if (!(await Senha.conferir(senhaAtual, aluno))) throw new ErroHttp(403, 'A senha atual não confere.');
  const erro = Validacao.validarSenhaNova(senhaNova);
  if (erro) throw new ErroHttp(400, erro);
  if (senhaNova === senhaAtual) throw new ErroHttp(400, 'A nova senha deve ser diferente da atual.');
  await repo.atualizar('alunos', aluno.id, Senha.gerar(senhaNova));
  Auth.encerrarOutras(aluno.id, Auth.sidDaRequisicao(req)); // quem tinha a senha antiga perde o acesso
  res.status(204).end();
});

// Nome e data de nascimento: o aluno só pede; quem decide é a secretaria (ver rotas/solicitacoes.js).
router.post('/:matricula/solicitacoes', Auth.exigirDono('matricula'), async (req, res) => {
  const aluno = await carregarAluno(req.params.matricula);
  const { campo, valorNovo } = req.body || {};
  if (!['nome', 'dataNascimento'].includes(campo)) throw new ErroHttp(400, 'Só nome e data de nascimento dependem de autorização.');
  const valor = Normalizar.nome(valorNovo);
  if (campo === 'nome' && !Validacao.nomeCompleto(valor)) throw new ErroHttp(400, 'Informe o nome completo (nome e sobrenome, só letras).');
  if (campo === 'dataNascimento' && !Validacao.dataValida(valor)) throw new ErroHttp(400, 'Data de nascimento inválida.');
  if (valor === aluno[campo]) throw new ErroHttp(400, 'O valor informado é igual ao atual.');

  const minhas = await repo.buscarPor('solicitacoes', 'alunoId', aluno.id);
  if (minhas.some((s) => s.campo === campo && s.status === 'pendente')) {
    throw new ErroHttp(409, 'Já existe uma solicitação pendente para este campo.');
  }
  const criada = await repo.criar('solicitacoes', {
    alunoId: aluno.id, alunoNome: aluno.nome, campo, valorAtual: aluno[campo], valorNovo: valor,
    status: 'pendente', criadaEm: FieldValue.serverTimestamp(),
  });
  res.status(201).json(criada);
});

router.get('/:matricula/solicitacoes', Auth.exigirDono('matricula', { tambemSecretaria: true }), async (req, res) => {
  const aluno = await carregarAluno(req.params.matricula);
  const lista = await repo.buscarPor('solicitacoes', 'alunoId', aluno.id);
  res.json(lista.sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)));
});

router.get('/:matricula/matriculas', Auth.exigirDono('matricula', { tambemSecretaria: true }), async (req, res) => {
  const aluno = await carregarAluno(req.params.matricula);
  const [minhas, turmas] = await Promise.all([
    repo.buscarPor('matriculas', 'alunoId', aluno.id),
    montar.turmasDetalhadas(Horario.SEMESTRE_ATUAL),
  ]);
  const lista = minhas
    .map((m) => ({ id: m.id, turma: turmas.find((t) => t.id === m.turmaId) }))
    .filter((m) => m.turma);
  res.json(lista);
});

module.exports = router;

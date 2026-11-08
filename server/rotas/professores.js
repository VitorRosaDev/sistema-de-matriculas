const express = require('express');
const repo = require('../repositorio');
const Validacao = require('../../public/js/shared/validacao.js');
const Horario = require('../../public/js/shared/horario.js');
const Auth = require('../autenticacao');
const { ErroHttp } = require('../erros');

const router = express.Router();

function limpar(corpo) {
  return {
    nome: typeof corpo.nome === 'string' ? corpo.nome.trim() : corpo.nome,
    email: typeof corpo.email === 'string' ? corpo.email.trim().toLowerCase() : corpo.email,
    cargaMaxima: corpo.cargaMaxima,
  };
}

async function validar(dados, idAtual) {
  const erros = Validacao.validarProfessor(dados);
  if (Validacao.temErros(erros)) throw new ErroHttp(400, Object.values(erros).join(' '));
  const mesmos = await repo.buscarPor('professores', 'email', dados.email);
  if (mesmos.some((p) => p.id !== idAtual)) throw new ErroHttp(409, 'Já existe um professor com este e-mail.');
}

router.get('/', Auth.exigirLogin, async (req, res) => {
  const [professores, turmas] = await Promise.all([repo.listar('professores'), repo.buscarPor('turmas', 'semestre', Horario.SEMESTRE_ATUAL)]);
  const lista = professores.map((p) => ({ ...p, carga: turmas.filter((t) => t.professorId === p.id).length }));
  res.json(lista.sort((a, b) => a.nome.localeCompare(b.nome)));
});

router.post('/', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const dados = limpar(req.body || {});
  await validar(dados);
  res.status(201).json(await repo.criar('professores', dados));
});

router.put('/:id', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const atual = await repo.obter('professores', req.params.id);
  if (!atual) throw new ErroHttp(404, 'Professor não encontrado.');
  const dados = limpar(req.body || {});
  await validar(dados, atual.id);
  res.json(await repo.atualizar('professores', atual.id, dados));
});

router.delete('/:id', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const atual = await repo.obter('professores', req.params.id);
  if (!atual) throw new ErroHttp(404, 'Professor não encontrado.');
  const turmas = await repo.buscarPor('turmas', 'professorId', atual.id);
  if (turmas.length) throw new ErroHttp(409, 'Não é possível excluir: o professor tem turmas.');
  await repo.remover('professores', atual.id);
  res.status(204).end();
});

module.exports = router;

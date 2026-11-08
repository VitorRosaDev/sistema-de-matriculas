const express = require('express');
const repo = require('../repositorio');
const Validacao = require('../../public/js/shared/validacao.js');
const Regras = require('../../public/js/shared/regras.js');
const Auth = require('../autenticacao');
const { ErroHttp } = require('../erros');

const router = express.Router();

// Só os campos conhecidos são gravados (evita injetar campos arbitrários no documento).
function limpar(corpo) {
  return {
    codigo: corpo.codigo,
    nome: typeof corpo.nome === 'string' ? corpo.nome.trim() : corpo.nome,
    cargaHoraria: corpo.cargaHoraria,
    preRequisitos: Array.isArray(corpo.preRequisitos) ? [...new Set(corpo.preRequisitos)] : corpo.preRequisitos,
  };
}

async function validar(dados) {
  const erros = Validacao.validarDisciplina(dados);
  if (Validacao.temErros(erros)) throw new ErroHttp(400, Object.values(erros).join(' '));
  const todas = await repo.listar('disciplinas');
  const r7 = Regras.verificarPreRequisitosValidos(dados.codigo, dados.preRequisitos, todas.map((d) => d.codigo), todas);
  if (!r7.ok) throw new ErroHttp(409, r7.motivos.join(' '));
}

router.get('/', Auth.exigirLogin, async (req, res) => {
  const lista = await repo.listar('disciplinas');
  res.json(lista.sort((a, b) => a.codigo.localeCompare(b.codigo)));
});

router.post('/', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const dados = limpar(req.body || {});
  await validar(dados);
  if (await repo.obter('disciplinas', dados.codigo)) throw new ErroHttp(409, 'Já existe uma disciplina com este código.');
  res.status(201).json(await repo.criar('disciplinas', dados, dados.codigo));
});

router.put('/:id', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const atual = await repo.obter('disciplinas', req.params.id);
  if (!atual) throw new ErroHttp(404, 'Disciplina não encontrada.');
  const dados = limpar({ ...(req.body || {}), codigo: atual.codigo }); // o código não muda
  await validar(dados);
  res.json(await repo.atualizar('disciplinas', atual.id, dados));
});

router.delete('/:id', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const atual = await repo.obter('disciplinas', req.params.id);
  if (!atual) throw new ErroHttp(404, 'Disciplina não encontrada.');
  const turmas = await repo.buscarPor('turmas', 'disciplinaId', atual.id);
  if (turmas.length) throw new ErroHttp(409, 'Não é possível excluir: a disciplina tem turmas ofertadas.');
  const todas = await repo.listar('disciplinas');
  const dependentes = todas.filter((d) => (d.preRequisitos || []).includes(atual.codigo));
  if (dependentes.length) {
    throw new ErroHttp(409, 'Não é possível excluir: é pré-requisito de ' + dependentes.map((d) => d.codigo).join(', ') + '.');
  }
  await repo.remover('disciplinas', atual.id);
  res.status(204).end();
});

module.exports = router;

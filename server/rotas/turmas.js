const express = require('express');
const repo = require('../repositorio');
const { FieldValue } = require('../firebase');
const Validacao = require('../../public/js/shared/validacao.js');
const Regras = require('../../public/js/shared/regras.js');
const Horario = require('../../public/js/shared/horario.js');
const montar = require('../montar');
const Auth = require('../autenticacao');
const { ErroHttp, exigirValido } = require('../erros');

const router = express.Router();

router.get('/', Auth.exigirLogin, async (req, res) => {
  const semestre = req.query.semestre;
  if (semestre && !Validacao.REGEX.semestre.test(semestre)) throw new ErroHttp(400, 'Semestre inválido.');
  res.json(await montar.turmasDetalhadas(semestre));
});

router.post('/', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const c = req.body || {};
  const dados = {
    disciplinaId: c.disciplinaId,
    professorId: c.professorId,
    horario: c.horario,
    vagas: c.vagas,
    semestre: c.semestre || Horario.SEMESTRE_ATUAL,
  };
  exigirValido(Validacao.validarTurma(dados));

  const [disciplina, professor] = await Promise.all([
    repo.obter('disciplinas', dados.disciplinaId),
    repo.obter('professores', dados.professorId),
  ]);
  if (!disciplina) throw new ErroHttp(400, 'Disciplina inexistente.');
  if (!professor) throw new ErroHttp(400, 'Professor inexistente.');

  const turmasDoSemestre = await repo.buscarPor('turmas', 'semestre', dados.semestre);
  const avaliacao = Regras.avaliarOferta({ turma: dados, professor, turmasDoSemestre });
  if (!avaliacao.podeOfertar) throw new ErroHttp(409, avaliacao.motivos.join(' '));

  const criada = await repo.criar('turmas', {
    ...dados,
    codigo: disciplina.codigo + '-' + dados.horario,
    status: 'aberta',
    criadaEm: FieldValue.serverTimestamp(),
  });
  const [detalhada] = (await montar.turmasDetalhadas(dados.semestre)).filter((t) => t.id === criada.id);
  res.status(201).json(detalhada);
});

router.patch('/:id', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const status = (req.body || {}).status;
  if (!['aberta', 'fechada'].includes(status)) throw new ErroHttp(400, 'Status deve ser "aberta" ou "fechada".');
  const atual = await repo.obter('turmas', req.params.id);
  if (!atual) throw new ErroHttp(404, 'Turma não encontrada.');
  await repo.atualizar('turmas', atual.id, { status });
  const [detalhada] = (await montar.turmasDetalhadas(atual.semestre)).filter((t) => t.id === atual.id);
  res.json(detalhada);
});

router.delete('/:id', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const atual = await repo.obter('turmas', req.params.id);
  if (!atual) throw new ErroHttp(404, 'Turma não encontrada.');
  const matriculas = await repo.buscarPor('matriculas', 'turmaId', atual.id);
  if (matriculas.length) throw new ErroHttp(409, 'Não é possível excluir: a turma tem alunos matriculados.');
  await repo.remover('turmas', atual.id);
  res.status(204).end();
});

router.get('/:id/alunos', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const atual = await repo.obter('turmas', req.params.id);
  if (!atual) throw new ErroHttp(404, 'Turma não encontrada.');
  const matriculas = await repo.buscarPor('matriculas', 'turmaId', atual.id);
  const alunos = await Promise.all(matriculas.map((m) => repo.obter('alunos', m.alunoId)));
  res.json(
    alunos
      .filter(Boolean)
      .map((a) => ({ matricula: a.matricula, nome: a.nome, email: a.email }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  );
});

module.exports = router;

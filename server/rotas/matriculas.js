const express = require('express');
const { db, FieldValue } = require('../firebase');
const repo = require('../repositorio');
const Validacao = require('../../public/js/shared/validacao.js');
const Regras = require('../../public/js/shared/regras.js');
const montar = require('../montar');
const Auth = require('../autenticacao');
const { ErroHttp } = require('../erros');

const router = express.Router();

router.post('/', Auth.exigirPerfil('aluno'), async (req, res) => {
  const { turmaId } = req.body || {};
  const alunoId = req.sessao.id; // quem se matricula é quem está logado; o corpo da requisição não decide isso
  if (typeof turmaId !== 'string' || !turmaId || turmaId.includes('/')) throw new ErroHttp(400, 'Turma inválida.');

  // R3 e a duplicidade precisam ser decididas dentro da transação: duas matrículas simultâneas
  // na última vaga leem a mesma contagem, e o Firestore refaz a transação que perdeu a corrida.
  // No Firestore todas as leituras vêm antes de qualquer escrita.
  const criada = await db.runTransaction(async (t) => {
    const turmaDoc = await t.get(db.collection('turmas').doc(turmaId));
    if (!turmaDoc.exists) throw new ErroHttp(404, 'Turma não encontrada.');
    const turmaBruta = { id: turmaDoc.id, ...turmaDoc.data() };

    const [alunoDoc, doSemestre, disciplinas, daTurma, doAluno] = await Promise.all([
      t.get(db.collection('alunos').doc(alunoId)),
      t.get(db.collection('turmas').where('semestre', '==', turmaBruta.semestre)),
      t.get(db.collection('disciplinas')),
      t.get(db.collection('matriculas').where('turmaId', '==', turmaId)),
      t.get(db.collection('matriculas').where('alunoId', '==', alunoId)),
    ]);
    if (!alunoDoc.exists) throw new ErroHttp(404, 'Aluno não encontrado.');

    const listaDisc = disciplinas.docs.map(repo.docParaObjeto);
    const turmasSemestre = doSemestre.docs.map(repo.docParaObjeto);
    // A matrícula do aluno nesta turma aparece nas duas consultas; sem deduplicar, ela contaria duas vezes nas vagas.
    const todasMatriculas = [...new Map([...daTurma.docs, ...doAluno.docs].map((d) => [d.id, repo.docParaObjeto(d)])).values()];

    const turma = montar.detalhar(turmaBruta, listaDisc, [], todasMatriculas);
    const idsDoAluno = doAluno.docs.map((d) => d.data().turmaId);
    const turmasDoAluno = turmasSemestre
      .filter((x) => idsDoAluno.includes(x.id))
      .map((x) => montar.detalhar(x, listaDisc, [], todasMatriculas));

    const avaliacao = Regras.avaliarMatricula({ turma, aluno: alunoDoc.data(), turmasDoAluno });
    if (!avaliacao.podeMatricular) throw new ErroHttp(409, avaliacao.motivos.join(' '));

    const ref = db.collection('matriculas').doc();
    t.create(ref, { alunoId, turmaId, semestre: turmaBruta.semestre, criadaEm: FieldValue.serverTimestamp() });
    return { id: ref.id, alunoId, turmaId, semestre: turmaBruta.semestre };
  });
  res.status(201).json(criada);
});

router.delete('/:id', Auth.exigirPerfil('aluno'), async (req, res) => {
  const atual = await repo.obter('matriculas', req.params.id);
  // Mesma resposta para inexistente e de outro aluno: não revela ids alheios.
  if (!atual || atual.alunoId !== req.sessao.id) throw new ErroHttp(404, 'Matrícula não encontrada.');
  await repo.remover('matriculas', atual.id);
  res.status(204).end();
});

module.exports = router;

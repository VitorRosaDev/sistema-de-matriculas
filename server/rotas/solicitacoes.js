const express = require('express');
const { db, FieldValue } = require('../firebase');
const repo = require('../repositorio');
const Auth = require('../autenticacao');
const { ErroHttp } = require('../erros');

const router = express.Router();

router.get('/', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const lista = await repo.listar('solicitacoes');
  // Pendentes primeiro; dentro de cada grupo, as mais recentes antes.
  lista.sort((a, b) => (a.status === 'pendente' ? 0 : 1) - (b.status === 'pendente' ? 0 : 1) || b.criadaEm.localeCompare(a.criadaEm));
  res.json(lista);
});

// A decisão e a alteração do aluno acontecem na mesma transação.
router.patch('/:id', Auth.exigirPerfil('secretaria'), async (req, res) => {
  const status = (req.body || {}).status;
  if (!['aprovada', 'recusada'].includes(status)) throw new ErroHttp(400, 'Status deve ser "aprovada" ou "recusada".');
  if (req.params.id.includes('/')) throw new ErroHttp(404, 'Solicitação não encontrada.');

  await db.runTransaction(async (t) => {
    const ref = db.collection('solicitacoes').doc(req.params.id);
    const doc = await t.get(ref);
    if (!doc.exists) throw new ErroHttp(404, 'Solicitação não encontrada.');
    const s = doc.data();
    if (s.status !== 'pendente') throw new ErroHttp(409, 'Esta solicitação já foi decidida.');
    const alunoRef = db.collection('alunos').doc(s.alunoId);
    if (status === 'aprovada') {
      const aluno = await t.get(alunoRef);
      if (!aluno.exists) throw new ErroHttp(404, 'Aluno não encontrado.');
      t.update(alunoRef, { [s.campo]: s.valorNovo });
    }
    t.update(ref, { status, decididaEm: FieldValue.serverTimestamp() });
  });
  res.json(await repo.obter('solicitacoes', req.params.id));
});

module.exports = router;

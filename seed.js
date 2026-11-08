// Popula o Firestore. Idempotente (IDs fixos). `npm run seed -- --reset` apaga as coleções antes.
const { db, FieldValue, projectId } = require('./server/firebase');
const Senha = require('./server/senha');

const SEM = '2026/2';
const COLECOES = ['solicitacoes', 'matriculas', 'turmas', 'alunos', 'professores', 'disciplinas'];

const disciplinas = [
  ['ALG0101', 'Algoritmos I', 60, []],
  ['ALG0102', 'Algoritmos II', 60, ['ALG0101']],
  ['EDD0201', 'Estruturas de Dados', 90, ['ALG0102']],
  ['BDD0101', 'Banco de Dados I', 60, []],
  ['BDD0102', 'Banco de Dados II', 60, ['BDD0101']],
  ['WEB0101', 'Desenvolvimento Web', 60, []],
  ['FRT0201', 'Front-end Avançado', 60, ['WEB0101', 'ALG0101']],
  ['ESW0101', 'Engenharia de Software', 60, []],
  ['RED0101', 'Redes de Computadores', 30, []],
  ['MAT0101', 'Matemática Discreta', 90, []],
];

const professores = [
  ['prof-ana', 'Ana Souza', 'ana.souza@unisinos.example', 4],
  ['prof-bruno', 'Bruno Lima', 'bruno.lima@unisinos.example', 3],
  ['prof-carla', 'Carla Mendes', 'carla.mendes@unisinos.example', 2], // ficará na carga máxima (R6)
  ['prof-diego', 'Diego Alves', 'diego.alves@unisinos.example', 5],
  ['prof-elisa', 'Elisa Rocha', 'elisa.rocha@unisinos.example', 3],
];

// [disciplina, professor, horário, vagas]
const turmas = [
  ['ALG0101', 'prof-ana', '21', 40],
  ['ALG0102', 'prof-ana', '22', 30],
  ['EDD0201', 'prof-bruno', '31', 30],
  ['BDD0101', 'prof-carla', '23', 30],
  ['BDD0102', 'prof-carla', '33', 30],
  ['WEB0101', 'prof-diego', '41', 40],
  ['FRT0201', 'prof-diego', '42', 30],
  ['ESW0101', 'prof-elisa', '21', 30], // mesmo horário de ALG0101 (R2)
  ['RED0101', 'prof-elisa', '52', 1], // 1 vaga, ocupada (R3)
  ['MAT0101', 'prof-bruno', '43', 30],
];

// [matrícula, nome, e-mail, cursadas, endereço, nascimento, celular]. Senha de todos: senha123
const alunos = [
  ['100000001', 'Lucas Pereira', 'lucas.pereira@aluno.example', [], 'Rua das Flores, 100 - São Leopoldo/RS', '2006-03-14', '51991110001'],
  ['100000002', 'Mariana Costa', 'mariana.costa@aluno.example', ['ALG0101', 'WEB0101'], 'Av. Unisinos, 950 - São Leopoldo/RS', '2004-07-22', '51991110002'],
  ['100000003', 'Rafael Oliveira', 'rafael.oliveira@aluno.example', ['ALG0101', 'ALG0102', 'BDD0101', 'WEB0101'], 'Rua Independência, 45 - Porto Alegre/RS', '2002-11-05', '51991110003'],
  ['100000004', 'Fernanda Dias', 'fernanda.dias@aluno.example', ['ALG0101'], 'Rua do Parque, 20 - Novo Hamburgo/RS', '2003-01-30', '51991110004'],
];

async function limpar() {
  for (const nome of COLECOES) {
    const snap = await db.collection(nome).get();
    for (let i = 0; i < snap.docs.length; i += 400) {
      const lote = db.batch();
      snap.docs.slice(i, i + 400).forEach((d) => lote.delete(d.ref));
      await lote.commit();
    }
    console.log('limpa: ' + nome + ' (' + snap.size + ')');
  }
}

async function popular() {
  const lote = db.batch();
  disciplinas.forEach(([codigo, nome, cargaHoraria, preRequisitos]) =>
    lote.set(db.collection('disciplinas').doc(codigo), { codigo, nome, cargaHoraria, preRequisitos }));
  professores.forEach(([id, nome, email, cargaMaxima]) =>
    lote.set(db.collection('professores').doc(id), { nome, email, cargaMaxima }));
  alunos.forEach(([matricula, nome, email, cursadas, endereco, dataNascimento, telefone]) =>
    lote.set(db.collection('alunos').doc(matricula), {
      matricula, nome, email, cursadas, endereco, dataNascimento, telefone, ...Senha.gerar('senha123'),
    }));
  turmas.forEach(([disc, prof, horario, vagas]) =>
    lote.set(db.collection('turmas').doc('turma-' + disc + '-' + horario), {
      codigo: disc + '-' + horario, disciplinaId: disc, professorId: prof, horario, vagas,
      semestre: SEM, status: 'aberta', criadaEm: FieldValue.serverTimestamp(),
    }));
  lote.set(db.collection('matriculas').doc('mat-seed-1'), {
    alunoId: '100000004', turmaId: 'turma-RED0101-52', semestre: SEM, criadaEm: FieldValue.serverTimestamp(),
  });
  await lote.commit();
}

(async () => {
  if (process.argv.includes('--reset')) await limpar();
  await popular();
  console.log('Seed concluído no projeto ' + projectId + '.');
})().catch((e) => {
  console.error('FALHOU:', e.message);
  process.exit(1);
});

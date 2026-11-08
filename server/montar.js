// Firestore não tem JOIN: o servidor lê as coleções (volume pequeno) e monta as respostas em memória.
const repo = require('./repositorio');
const Horario = require('../public/js/shared/horario.js');

function detalhar(turma, disciplinas, professores, matriculas) {
  const disciplina = disciplinas.find((d) => d.id === turma.disciplinaId);
  const professor = professores.find((p) => p.id === turma.professorId);
  return {
    id: turma.id,
    codigo: turma.codigo,
    horario: turma.horario,
    horarioTexto: Horario.textoDoHorario(turma.horario),
    vagas: turma.vagas,
    ocupadas: matriculas.filter((m) => m.turmaId === turma.id).length,
    status: turma.status,
    semestre: turma.semestre,
    disciplina: disciplina
      ? { id: disciplina.id, codigo: disciplina.codigo, nome: disciplina.nome, cargaHoraria: disciplina.cargaHoraria, preRequisitos: disciplina.preRequisitos }
      : null,
    professor: professor ? { id: professor.id, nome: professor.nome } : null,
  };
}

async function turmasDetalhadas(semestre) {
  const [turmas, disciplinas, professores, matriculas] = await Promise.all([
    repo.listar('turmas'), repo.listar('disciplinas'), repo.listar('professores'), repo.listar('matriculas'),
  ]);
  return turmas
    .filter((t) => !semestre || t.semestre === semestre)
    .map((t) => detalhar(t, disciplinas, professores, matriculas))
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
}

// Uma turma só: lê por ID o que ela referencia, em vez de varrer as quatro coleções inteiras.
async function turmaDetalhada(id) {
  const turma = await repo.obter('turmas', id);
  if (!turma) return null;
  const [disciplina, professor, matriculas] = await Promise.all([
    repo.obter('disciplinas', turma.disciplinaId),
    repo.obter('professores', turma.professorId),
    repo.buscarPor('matriculas', 'turmaId', turma.id),
  ]);
  return detalhar(turma, disciplina ? [disciplina] : [], professor ? [professor] : [], matriculas);
}

module.exports = { detalhar, turmasDetalhadas, turmaDetalhada };

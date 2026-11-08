// Testes das regras R1–R8 e dos formatos V1. Sem dependências: node:assert.
const assert = require('node:assert');
const Regras = require('../public/js/shared/regras.js');
const Validacao = require('../public/js/shared/validacao.js');
const Horario = require('../public/js/shared/horario.js');

let total = 0;
let fila = Promise.resolve(); // casos assíncronos rodam em sequência, preservando a ordem da saída
function caso(nome, fn) {
  fila = fila.then(() => fn()).then(() => {
    total++;
    console.log('ok  ' + nome);
  });
}

const disc = (codigo, pre = []) => ({ id: codigo, codigo, preRequisitos: pre });
const turma = (id, codigo, horario, extra = {}) => ({
  id, codigo: codigo + '-' + horario, horario, vagas: 10, ocupadas: 0, status: 'aberta', disciplina: disc(codigo), ...extra,
});
const aluno = (cursadas = []) => ({ cursadas });

caso('R1 feliz: tem os pré-requisitos', () => {
  const r = Regras.avaliarMatricula({ turma: turma('t', 'FRT0201', '42', { disciplina: disc('FRT0201', ['WEB0101', 'ALG0101']) }), aluno: aluno(['WEB0101', 'ALG0101']), turmasDoAluno: [] });
  assert.ok(r.podeMatricular);
});
caso('R1 bloqueio: lista os faltantes', () => {
  const r = Regras.avaliarMatricula({ turma: turma('t', 'FRT0201', '42', { disciplina: disc('FRT0201', ['WEB0101', 'ALG0101']) }), aluno: aluno(), turmasDoAluno: [] });
  assert.ok(!r.podeMatricular);
  assert.match(r.motivos[0], /WEB0101, ALG0101/);
});
caso('R2 feliz / bloqueio: conflito de horário do aluno', () => {
  const a = turma('a', 'ALG0101', '21');
  assert.ok(Regras.avaliarMatricula({ turma: turma('b', 'ESW0101', '22'), aluno: aluno(), turmasDoAluno: [a] }).podeMatricular);
  const r = Regras.avaliarMatricula({ turma: turma('b', 'ESW0101', '21'), aluno: aluno(), turmasDoAluno: [a] });
  assert.ok(!r.podeMatricular);
  assert.match(r.motivos.join(' '), /ALG0101-21/);
});
caso('R3 feliz / bloqueio: vagas e turma fechada', () => {
  assert.ok(Regras.avaliarMatricula({ turma: turma('a', 'RED0101', '52', { vagas: 1, ocupadas: 0 }), aluno: aluno(), turmasDoAluno: [] }).podeMatricular);
  assert.ok(!Regras.avaliarMatricula({ turma: turma('a', 'RED0101', '52', { vagas: 1, ocupadas: 1 }), aluno: aluno(), turmasDoAluno: [] }).podeMatricular);
  assert.ok(!Regras.avaliarMatricula({ turma: turma('a', 'RED0101', '52', { status: 'fechada' }), aluno: aluno(), turmasDoAluno: [] }).podeMatricular);
});
caso('R4 feliz / bloqueio: disciplina repetida ou já cursada', () => {
  assert.ok(!Regras.avaliarMatricula({ turma: turma('a', 'ALG0101', '21'), aluno: aluno(['ALG0101']), turmasDoAluno: [] }).podeMatricular);
  const r = Regras.avaliarMatricula({ turma: turma('b', 'ALG0101', '31'), aluno: aluno(), turmasDoAluno: [turma('a', 'ALG0101', '21')] });
  assert.ok(!r.podeMatricular);
});

const prof = { id: 'p1', cargaMaxima: 2 };
const bruta = (professorId, disciplinaId, horario) => ({ professorId, disciplinaId, horario, semestre: '2026/2' });
const nova = (professorId, disciplinaId, horario) => bruta(professorId, disciplinaId, horario);

caso('R5 feliz / bloqueio: conflito do professor', () => {
  const existentes = [bruta('p1', 'A', '21')];
  assert.ok(Regras.avaliarOferta({ turma: nova('p1', 'B', '22'), professor: prof, turmasDoSemestre: existentes }).podeOfertar);
  assert.ok(!Regras.avaliarOferta({ turma: nova('p1', 'B', '21'), professor: prof, turmasDoSemestre: existentes }).podeOfertar);
});
caso('R6 feliz / bloqueio: carga máxima', () => {
  assert.ok(Regras.avaliarOferta({ turma: nova('p1', 'C', '23'), professor: prof, turmasDoSemestre: [bruta('p1', 'A', '21')] }).podeOfertar);
  const r = Regras.avaliarOferta({ turma: nova('p1', 'C', '23'), professor: prof, turmasDoSemestre: [bruta('p1', 'A', '21'), bruta('p1', 'B', '22')] });
  assert.ok(!r.podeOfertar);
  assert.match(r.motivos[0], /2\/2/);
});
caso('R7 feliz / bloqueio: pré-requisito válido', () => {
  assert.ok(Regras.verificarPreRequisitosValidos('ALG0102', ['ALG0101'], ['ALG0101', 'ALG0102']).ok);
  assert.ok(!Regras.verificarPreRequisitosValidos('ALG0102', ['ALG0102'], ['ALG0102']).ok);
  assert.ok(!Regras.verificarPreRequisitosValidos('ALG0102', ['XXX9999'], ['ALG0102']).ok);
  const outras = [{ codigo: 'AAA0001', preRequisitos: [] }, { codigo: 'BBB0001', preRequisitos: ['AAA0001'] }];
  assert.ok(!Regras.verificarPreRequisitosValidos('AAA0001', ['BBB0001'], ['AAA0001', 'BBB0001'], outras).ok, 'ciclo A→B→A');
  assert.ok(Regras.verificarPreRequisitosValidos('CCC0001', ['BBB0001'], ['BBB0001', 'CCC0001'], outras).ok);
});
caso('R8 feliz / bloqueio: oferta única da disciplina no horário', () => {
  const existentes = [bruta('p2', 'A', '21')];
  assert.ok(Regras.avaliarOferta({ turma: nova('p1', 'A', '22'), professor: prof, turmasDoSemestre: existentes }).podeOfertar);
  assert.ok(!Regras.avaliarOferta({ turma: nova('p1', 'A', '21'), professor: prof, turmasDoSemestre: existentes }).podeOfertar);
});

caso('V1: valores que não são texto não passam nas regex', () => {
  const V = require('../public/js/shared/validacao.js');
  assert.ok(V.temErros(V.validarTurma({ disciplinaId: 'd', professorId: 'p', horario: 21, vagas: 10, semestre: '2026/2' })));
  assert.ok(V.temErros(V.validarTurma({ disciplinaId: 'd', professorId: 'p', horario: ['21'], vagas: 10, semestre: '2026/2' })));
  assert.ok(V.validarSenhaNova(['abc12345']));
  assert.ok(V.temErros(V.validarCadastro({ nome: ['Ana Silva'], dataNascimento: '2000-01-01', endereco: 'Rua A, 1', email: 'a@b.com', telefone: '51991234567', senha: 'abc12345' })));
});

caso('V1 formatos (regex)', () => {
  const ok = (re, v) => assert.ok(Validacao.REGEX[re].test(v), re + ' deveria aceitar ' + v);
  const ruim = (re, v) => assert.ok(!Validacao.REGEX[re].test(v), re + ' deveria recusar ' + v);
  ok('matricula', '100000001'); ruim('matricula', '12ab');
  ok('codigoDisciplina', 'INF0101'); ruim('codigoDisciplina', 'inf0101');
  ok('email', 'a@b.com'); ruim('email', 'x@y');
  ok('horario', '21'); ruim('horario', '11'); ruim('horario', '24');
  ok('semestre', '2026/2'); ruim('semestre', '2026/3');
  ok('nome', 'Ana Souza'); ruim('nome', 'A1');
});

caso('Cadastro de aluno: campos obrigatórios e formatos', () => {
  const bom = { nome: 'Maria da Silva', endereco: 'Rua A, 10 - Porto Alegre', dataNascimento: '2005-04-20', email: 'm@x.com', telefone: '(51) 91234-5678', senha: 'abc12345' };
  assert.deepStrictEqual(Validacao.validarCadastro(bom), {});
  assert.ok(Validacao.validarCadastro({ ...bom, nome: 'Maria' }).nome, 'nome sem sobrenome');
  assert.ok(Validacao.validarCadastro({ ...bom, dataNascimento: '2999-01-01' }).dataNascimento, 'data futura');
  assert.ok(Validacao.validarCadastro({ ...bom, dataNascimento: '2005-02-31' }).dataNascimento, 'data inexistente');
  assert.ok(Validacao.validarCadastro({ ...bom, telefone: '(51) 3123-4567' }).telefone, 'fixo não é celular');
  assert.ok(Validacao.validarCadastro({ ...bom, senha: 'abcdefgh' }).senha, 'senha sem número');
  assert.ok(Validacao.validarCadastro({ ...bom, senha: 'a1' }).senha, 'senha curta');
  assert.ok(Validacao.validarCadastro({ ...bom, endereco: 'Rua' }).endereco);
});

caso('Login do aluno exige matrícula ou e-mail, e senha', () => {
  assert.deepStrictEqual(Validacao.validarLogin({ perfil: 'aluno', identificador: '100000001', senha: 'x' }), {});
  assert.deepStrictEqual(Validacao.validarLogin({ perfil: 'aluno', identificador: 'lucas.pereira@aluno.example', senha: 'x' }), {});
  assert.ok(Validacao.validarLogin({ perfil: 'aluno', identificador: '100000001' }).senha);
  assert.ok(Validacao.validarLogin({ perfil: 'aluno', identificador: '12ab', senha: 'x' }).identificador);
  assert.ok(Validacao.validarLogin({ perfil: 'aluno', senha: 'x' }).identificador);
});

caso('Senha: hash com sal confere só a senha certa', async () => {
  const Senha = require('../server/senha.js');
  const a = Senha.gerar('abc12345');
  assert.ok(await Senha.conferir('abc12345', a));
  assert.ok(!(await Senha.conferir('errada123', a)));
  assert.ok(!(await Senha.conferirFalso('abc12345')));
  assert.ok(!('senhaHash' in Senha.publico({ ...a, nome: 'x' })));
});

caso('Horário: decodificação e combinações', () => {
  assert.strictEqual(Horario.decodificar('21').texto, 'Segunda — Manhã');
  assert.strictEqual(Horario.decodificar('33').texto, 'Terça — Noite');
  assert.strictEqual(Horario.todosCodigos().length, 18);
});

caso('Carga por professor: ordenação e média', () => {
  const lista = Regras.cargaPorProfessor(
    [{ id: 'a', nome: 'A Silva', cargaMaxima: 4 }, { id: 'b', nome: 'B Silva', cargaMaxima: 2 }],
    [{ professorId: 'a' }, { professorId: 'a' }, { professorId: 'b' }]
  );
  assert.strictEqual(lista[0].id, 'b');
  assert.strictEqual(lista[0].percentual, 50);
  assert.strictEqual(Regras.mediaDeCarga(lista).media, 1.5);
});

fila.then(() => console.log('\n' + total + ' casos passaram.')).catch((e) => {
  console.error(e);
  process.exit(1);
});

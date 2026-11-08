// UMD: valida no navegador (feedback imediato) e no servidor (nunca confia no cliente).
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Validacao = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const REGEX = {
    matricula: /^\d{9}$/,
    codigoDisciplina: /^[A-Z]{3}\d{4}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    horario: /^[2-7][1-3]$/,
    semestre: /^\d{4}\/[12]$/,
    nome: /^[A-Za-zÀ-ÿ' ]{3,80}$/,
    data: /^\d{4}-\d{2}-\d{2}$/,
    telefone: /^[1-9]\d9\d{8}$/, // só dígitos: DDD + celular com 9
    senha: /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/,
  };

  // test() converte arrays e números em texto e os deixaria passar; só string entra nas regex.
  const txt = (v) => (typeof v === 'string' ? v : '');
  const soDigitos = (t) => (typeof t === 'string' || typeof t === 'number' ? String(t) : '').replace(/\D/g, '');

  function dataValida(texto) {
    if (!REGEX.data.test(txt(texto))) return false;
    const d = new Date(texto + 'T00:00:00');
    return !isNaN(d) && d.toISOString().slice(0, 10) === texto && d <= new Date() && d.getFullYear() >= 1900;
  }

  const nomeCompleto = (n) => REGEX.nome.test(txt(n)) && txt(n).trim().split(/\s+/).length >= 2;

  // Endereço, e-mail e telefone: os dados que o aluno altera livremente.
  function validarContato(c) {
    const e = {};
    const end = txt(c.endereco).trim();
    if (end.length < 5 || end.length > 120) e.endereco = 'Endereço com 5 a 120 caracteres.';
    if (!REGEX.email.test(txt(c.email))) e.email = 'E-mail inválido (ex.: nome@dominio.com).';
    if (!REGEX.telefone.test(soDigitos(c.telefone))) e.telefone = 'Celular com DDD, ex.: (51) 91234-5678.';
    return e;
  }

  function validarSenhaNova(senha) {
    return REGEX.senha.test(txt(senha)) ? null : 'A senha precisa de 8 a 72 caracteres, com letras e números.';
  }

  // Primeiro acesso do aluno.
  function validarCadastro(c) {
    const e = validarContato(c);
    if (!nomeCompleto(c.nome)) e.nome = 'Informe o nome completo (nome e sobrenome, só letras).';
    if (!dataValida(c.dataNascimento)) e.dataNascimento = 'Data de nascimento inválida.';
    const s = validarSenhaNova(c.senha);
    if (s) e.senha = s;
    return e;
  }

  const inteiroEntre = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

  function validarDisciplina(d) {
    const e = {};
    if (!REGEX.codigoDisciplina.test(txt(d.codigo))) e.codigo = 'Use 3 letras maiúsculas e 4 dígitos (ex.: INF0101).';
    if (!REGEX.nome.test(txt(d.nome))) e.nome = 'Nome com 3 a 80 letras.';
    if (![30, 60, 90].includes(d.cargaHoraria)) e.cargaHoraria = 'Carga horária deve ser 30, 60 ou 90.';
    if (!Array.isArray(d.preRequisitos) || d.preRequisitos.some((c) => !REGEX.codigoDisciplina.test(c))) {
      e.preRequisitos = 'Pré-requisitos inválidos.';
    }
    return e;
  }

  function validarProfessor(p) {
    const e = {};
    if (!REGEX.nome.test(txt(p.nome))) e.nome = 'Nome com 3 a 80 letras.';
    if (!REGEX.email.test(txt(p.email))) e.email = 'E-mail inválido (ex.: nome@dominio.com).';
    if (!inteiroEntre(p.cargaMaxima, 1, 8)) e.cargaMaxima = 'Carga máxima de 1 a 8 turmas.';
    return e;
  }

  function validarTurma(t) {
    const e = {};
    if (!txt(t.disciplinaId)) e.disciplinaId = 'Escolha a disciplina.';
    if (!txt(t.professorId)) e.professorId = 'Escolha o professor.';
    if (!REGEX.horario.test(txt(t.horario))) e.horario = 'Horário inválido (dia 2–7 e turno 1–3).';
    if (!inteiroEntre(t.vagas, 1, 80)) e.vagas = 'Vagas de 1 a 80.';
    if (!REGEX.semestre.test(txt(t.semestre))) e.semestre = 'Semestre no formato 2026/2.';
    return e;
  }

  function validarLogin(l) {
    const e = {};
    if (l.perfil === 'aluno') {
      // O aluno entra com a matrícula (9 dígitos) ou com o e-mail cadastrado.
      const id = txt(l.identificador).trim();
      if (!REGEX.matricula.test(id) && !REGEX.email.test(id)) e.identificador = 'Informe a matrícula (9 dígitos) ou um e-mail válido.';
      if (!txt(l.senha)) e.senha = 'Informe a senha.';
    } else if (l.perfil === 'secretaria') {
      if (!txt(l.usuario)) e.usuario = 'Informe o usuário.';
      if (!txt(l.senha)) e.senha = 'Informe a senha.';
    } else {
      e.perfil = 'Perfil inválido.';
    }
    return e;
  }

  const temErros = (e) => Object.keys(e).length > 0;

  return {
    REGEX, soDigitos, dataValida, nomeCompleto, validarDisciplina, validarProfessor, validarTurma,
    validarLogin, validarContato, validarSenhaNova, validarCadastro, temErros,
  };
});

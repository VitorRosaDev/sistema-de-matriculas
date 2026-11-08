// UMD: as mesmas regras decidem na tela e no servidor. Funções puras (sem fetch, sem DOM).
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./horario.js'));
  else raiz.Regras = fabrica(raiz.Horario);
})(typeof self !== 'undefined' ? self : this, function (Horario) {
  // R1
  function verificarPreRequisitos(disciplina, cursadas) {
    const feitas = cursadas || [];
    const faltantes = (disciplina.preRequisitos || []).filter((c) => !feitas.includes(c));
    return { ok: faltantes.length === 0, faltantes };
  }

  // R2
  function verificarConflitoHorario(turma, outrasTurmas) {
    const conflitoCom = (outrasTurmas || []).find((o) => o.id !== turma.id && o.horario === turma.horario) || null;
    return { ok: !conflitoCom, conflitoCom };
  }

  // R1 + R2 + R3 + R4. `turmasDoAluno` são as turmas do semestre em que ele já está matriculado.
  function avaliarMatricula({ turma, aluno, turmasDoAluno }) {
    const motivos = [];
    const minhas = turmasDoAluno || [];

    if (minhas.some((t) => t.id === turma.id)) {
      motivos.push('Você já está matriculado nesta turma.');
    } else {
      const pre = verificarPreRequisitos(turma.disciplina, aluno.cursadas);
      if (!pre.ok) motivos.push('Faltam pré-requisitos: ' + pre.faltantes.join(', ') + '.');

      if ((aluno.cursadas || []).includes(turma.disciplina.codigo)) {
        motivos.push('Você já cursou esta disciplina.');
      } else if (minhas.some((t) => t.disciplina.codigo === turma.disciplina.codigo)) {
        motivos.push('Você já está matriculado nesta disciplina neste semestre.');
      }

      const conf = verificarConflitoHorario(turma, minhas);
      if (!conf.ok) {
        motivos.push('Conflito de horário (' + Horario.textoDoHorario(turma.horario) + ') com ' + conf.conflitoCom.codigo + '.');
      }
    }

    if (turma.status !== 'aberta') motivos.push('Turma fechada.');
    else if (turma.ocupadas >= turma.vagas) motivos.push('Turma lotada.');

    return { podeMatricular: motivos.length === 0, motivos };
  }

  // R5 + R6 + R8. `turma` = { disciplinaId, professorId, horario, semestre }; `turmasDoSemestre` são as já gravadas.
  function avaliarOferta({ turma, professor, turmasDoSemestre }) {
    const motivos = [];
    const doSemestre = (turmasDoSemestre || []).filter((t) => t.semestre === turma.semestre);

    if (doSemestre.some((t) => t.professorId === turma.professorId && t.horario === turma.horario)) {
      motivos.push('O professor já tem turma neste horário.');
    }
    if (professor) {
      const carga = doSemestre.filter((t) => t.professorId === professor.id).length;
      if (carga >= professor.cargaMaxima) motivos.push('O professor já está na carga máxima (' + carga + '/' + professor.cargaMaxima + ').');
    }
    if (doSemestre.some((t) => t.disciplinaId === turma.disciplinaId && t.horario === turma.horario)) {
      motivos.push('Já existe turma desta disciplina neste horário.');
    }
    return { podeOfertar: motivos.length === 0, motivos };
  }

  // R7
  // `outras` (opcional): as demais disciplinas ({codigo, preRequisitos}), para detectar pré-requisitos circulares.
  function verificarPreRequisitosValidos(codigo, preRequisitos, codigosExistentes, outras) {
    const motivos = [];
    if ((preRequisitos || []).includes(codigo)) motivos.push('Uma disciplina não pode ser pré-requisito de si mesma.');
    const inexistentes = (preRequisitos || []).filter((c) => c !== codigo && !codigosExistentes.includes(c));
    if (inexistentes.length) motivos.push('Pré-requisito inexistente: ' + inexistentes.join(', ') + '.');
    if (outras && !motivos.length) {
      const mapa = {};
      outras.forEach((d) => { if (d.codigo !== codigo) mapa[d.codigo] = d.preRequisitos || []; });
      mapa[codigo] = preRequisitos || [];
      const visitados = new Set();
      const fila = [...(preRequisitos || [])];
      while (fila.length) {
        const c = fila.pop();
        if (c === codigo) { motivos.push('Pré-requisito circular: nenhuma das disciplinas poderia ser cursada.'); break; }
        if (visitados.has(c)) continue;
        visitados.add(c);
        fila.push(...(mapa[c] || []));
      }
    }
    return { ok: motivos.length === 0, motivos };
  }

  // Ordena por menor carga (R6: quem tem menos turmas aparece primeiro).
  function cargaPorProfessor(professores, turmas) {
    return professores
      .map((p) => {
        const carga = turmas.filter((t) => t.professorId === p.id).length;
        return { ...p, carga, percentual: Math.round((carga / p.cargaMaxima) * 100) };
      })
      .sort((a, b) => a.carga - b.carga || a.nome.localeCompare(b.nome));
  }

  function mediaDeCarga(comCarga) {
    if (!comCarga.length) return { media: 0, desvio: 0 };
    const media = comCarga.reduce((s, p) => s + p.carga, 0) / comCarga.length;
    const variancia = comCarga.reduce((s, p) => s + Math.pow(p.carga - media, 2), 0) / comCarga.length;
    return { media, desvio: Math.sqrt(variancia) };
  }

  return {
    verificarPreRequisitos, verificarConflitoHorario, avaliarMatricula, avaliarOferta,
    verificarPreRequisitosValidos, cargaPorProfessor, mediaDeCarga,
  };
});

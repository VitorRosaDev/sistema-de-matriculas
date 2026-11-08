// Camada de acesso à API REST (mesma origem). Uma função por endpoint, todas devolvem Promise.
const Api = (function () {
  // O App registra aqui o que fazer quando o servidor diz que a sessão acabou (401 fora do login).
  const ganchos = { aoExpirar: null };

  function requisitar(caminho, opcoes) {
    const o = opcoes || {};
    return fetch('/api' + caminho, {
      method: o.method || 'GET',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: o.corpo ? JSON.stringify(o.corpo) : undefined,
    }).then((resposta) => {
      if (resposta.status === 204) return null;
      return resposta.json().then((dados) => {
        if (resposta.status === 401 && ganchos.aoExpirar && caminho !== '/login' && caminho !== '/sessao') {
          ganchos.aoExpirar();
          throw new Error('Sua sessão expirou. Entre novamente.');
        }
        if (!resposta.ok) throw new Error(dados.erro || 'Erro ' + resposta.status);
        return dados;
      });
    }, () => {
      throw new Error('Não foi possível falar com o servidor. Ele está rodando?');
    });
  }

  return {
    ganchos,
    sessao: () => requisitar('/sessao'),
    sair: () => requisitar('/logout', { method: 'POST' }),
    entrar: (credenciais) => requisitar('/login', { method: 'POST', corpo: credenciais }),

    listarDisciplinas: () => requisitar('/disciplinas'),
    criarDisciplina: (d) => requisitar('/disciplinas', { method: 'POST', corpo: d }),
    atualizarDisciplina: (id, d) => requisitar('/disciplinas/' + id, { method: 'PUT', corpo: d }),
    excluirDisciplina: (id) => requisitar('/disciplinas/' + id, { method: 'DELETE' }),

    listarProfessores: () => requisitar('/professores'),
    criarProfessor: (p) => requisitar('/professores', { method: 'POST', corpo: p }),
    atualizarProfessor: (id, p) => requisitar('/professores/' + id, { method: 'PUT', corpo: p }),
    excluirProfessor: (id) => requisitar('/professores/' + id, { method: 'DELETE' }),

    listarTurmas: (semestre) => requisitar('/turmas' + (semestre ? '?semestre=' + encodeURIComponent(semestre) : '')),
    criarTurma: (t) => requisitar('/turmas', { method: 'POST', corpo: t }),
    alterarStatusTurma: (id, status) => requisitar('/turmas/' + id, { method: 'PATCH', corpo: { status } }),
    excluirTurma: (id) => requisitar('/turmas/' + id, { method: 'DELETE' }),
    listarAlunosDaTurma: (id) => requisitar('/turmas/' + id + '/alunos'),

    cadastrarAluno: (dados) => requisitar('/alunos', { method: 'POST', corpo: dados }),
    atualizarContato: (matricula, dados) => requisitar('/alunos/' + matricula, { method: 'PUT', corpo: dados }),
    alterarSenha: (matricula, dados) => requisitar('/alunos/' + matricula + '/senha', { method: 'PUT', corpo: dados }),
    solicitarAlteracao: (matricula, dados) => requisitar('/alunos/' + matricula + '/solicitacoes', { method: 'POST', corpo: dados }),
    listarSolicitacoesDoAluno: (matricula) => requisitar('/alunos/' + matricula + '/solicitacoes'),
    listarSolicitacoes: () => requisitar('/solicitacoes'),
    decidirSolicitacao: (id, status) => requisitar('/solicitacoes/' + id, { method: 'PATCH', corpo: { status } }),
    obterAluno: (matricula) => requisitar('/alunos/' + matricula),
    listarMatriculasDoAluno: (matricula) => requisitar('/alunos/' + matricula + '/matriculas'),
    matricular: (alunoId, turmaId) => requisitar('/matriculas', { method: 'POST', corpo: { alunoId, turmaId } }),
    cancelarMatricula: (id) => requisitar('/matriculas/' + id, { method: 'DELETE' }),
  };
})();

// UC04 — painel de alocação: carga por professor, equilíbrio e alunos por turma.
class AdminAlocacao extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      professores: [], turmas: [], carregando: true, erro: '',
      turmaSelecionada: null, alunosDaTurma: [], carregandoAlunos: false,
    };
  }

  componentDidMount() {
    Promise.all([Api.listarProfessores(), Api.listarTurmas(Horario.SEMESTRE_ATUAL)])
      .then(([professores, turmas]) => this.setState({ professores, turmas }))
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ carregando: false }));
  }

  // Só busca os alunos quando a turma selecionada MUDOU: sem essa comparação o setState
  // dentro do fetch dispararia outro componentDidUpdate e teríamos um laço infinito.
  componentDidUpdate(prevProps, prevState) {
    if (prevState.turmaSelecionada === this.state.turmaSelecionada) return;
    const id = this.state.turmaSelecionada;
    if (!id) return;
    this.setState({ carregandoAlunos: true, alunosDaTurma: [] });
    Api.listarAlunosDaTurma(id)
      .then((alunos) => { if (this.state.turmaSelecionada === id) this.setState({ alunosDaTurma: alunos }); })
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ carregandoAlunos: false }));
  }

  selecionar(id) {
    this.setState((estado) => ({ turmaSelecionada: estado.turmaSelecionada === id ? null : id }));
  }

  render() {
    const { professores, turmas, carregando, erro, turmaSelecionada, alunosDaTurma, carregandoAlunos } = this.state;
    const brutas = turmas.map((t) => ({ professorId: t.professor && t.professor.id }));
    const comCarga = Regras.cargaPorProfessor(professores, brutas);
    const { media, desvio } = Regras.mediaDeCarga(comCarga);
    const selecionada = turmas.find((t) => t.id === turmaSelecionada);

    return (
      <div>
        <TituloPagina icone="bi-bar-chart-steps" titulo={'Alocação — ' + Horario.SEMESTRE_ATUAL} subtitulo="Carga por professor, equilíbrio da distribuição e alunos por turma." />
        <Alerta tipo="danger" mensagem={erro} onFechar={() => this.setState({ erro: '' })} />

        {carregando ? <Carregando texto="Carregando painel…" /> : professores.length === 0 ? (
          <EstadoVazio icone="bi-person-x" titulo="Nenhum professor cadastrado" />
        ) : (
          <div>
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-3"><div className="card"><div className="card-body"><div className="small text-body-secondary">Turmas ofertadas</div><div className="fs-3">{turmas.length}</div></div></div></div>
              <div className="col-6 col-md-3"><div className="card"><div className="card-body"><div className="small text-body-secondary">Média por professor</div><div className="fs-3">{media.toFixed(1)}</div></div></div></div>
              <div className="col-6 col-md-3"><div className="card"><div className="card-body"><div className="small text-body-secondary">Desvio padrão</div><div className="fs-3">{desvio.toFixed(2)}</div></div></div></div>
              <div className="col-6 col-md-3"><div className="card"><div className="card-body">
                <div className="small text-body-secondary">Equilíbrio</div>
                <div className="fs-5"><span className={'badge ' + (desvio <= 1 ? 'text-bg-success' : desvio <= 1.5 ? 'text-bg-warning text-dark' : 'text-bg-danger')}>{desvio <= 1 ? 'Equilibrado' : desvio <= 1.5 ? 'Atenção' : 'Desbalanceado'}</span></div>
              </div></div></div>
            </div>

            <div className="row g-4">
              <div className="col-lg-7">
                <h2 className="h5">Professores</h2>
                {comCarga.map((p) => {
                  const turmasDele = turmas.filter((t) => t.professor && t.professor.id === p.id);
                  const diff = p.carga - media;
                  return (
                    <div className="card mb-3" key={p.id}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between flex-wrap gap-1">
                          <h3 className="h6 mb-1">{p.nome}</h3>
                          <small className="text-body-secondary">{diff === 0 ? 'na média' : (diff > 0 ? '+' : '') + diff.toFixed(1) + ' da média'}</small>
                        </div>
                        <BarraCarga carga={p.carga} maxima={p.cargaMaxima} />
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {turmasDele.length === 0 && <span className="small text-body-secondary">Sem turmas.</span>}
                          {turmasDele.map((t) => (
                            <button key={t.id} type="button" aria-pressed={t.id === turmaSelecionada}
                              className={'btn btn-sm ' + (t.id === turmaSelecionada ? 'btn-primary' : 'btn-outline-primary')}
                              onClick={() => this.selecionar(t.id)}>
                              {t.codigo} · {t.ocupadas}/{t.vagas}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="col-lg-5">
                <div className="painel-lateral">
                  <h2 className="h5">Alunos da turma</h2>
                  {!selecionada ? (
                    <EstadoVazio icone="bi-hand-index" titulo="Selecione uma turma" texto="Clique numa turma de um professor para ver os alunos matriculados." />
                  ) : (
                    <div className="card">
                      <div className="card-body">
                        <h3 className="h6">{selecionada.codigo} — {selecionada.disciplina.nome}</h3>
                        <p className="small text-body-secondary">{selecionada.horarioTexto} · {selecionada.ocupadas}/{selecionada.vagas} vagas ocupadas</p>
                        {carregandoAlunos ? <Carregando texto="Carregando alunos…" /> : alunosDaTurma.length === 0 ? (
                          <p className="mb-0 text-body-secondary">Nenhum aluno matriculado.</p>
                        ) : (
                          <ul className="list-group list-group-flush">
                            {alunosDaTurma.map((a) => (
                              <li className="list-group-item px-0" key={a.matricula}>
                                <div className="fw-semibold">{a.nome}</div>
                                <div className="small text-body-secondary">{a.matricula} · {a.email}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

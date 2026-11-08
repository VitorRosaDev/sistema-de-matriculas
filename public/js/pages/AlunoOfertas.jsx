// UC05 — realizar e cancelar matrícula, com filtros e o motivo de cada bloqueio.
class AlunoOfertas extends React.Component {
  static contextType = SessaoContext;

  constructor(props) {
    super(props);
    this.state = {
      turmas: [], minhas: [], aluno: null, carregando: true, erro: '', sucesso: '', enviando: false,
      filtros: { busca: '', dia: '', turno: '', soDisponiveis: false },
      expandida: null,
    };
    this.aoFiltrar = this.aoFiltrar.bind(this);
    this.alternar = this.alternar.bind(this);
    this.matricular = this.matricular.bind(this);
  }

  componentDidMount() {
    this.carregar();
  }

  carregar() {
    const matricula = this.context.usuario.id;
    return Promise.all([Api.listarTurmas(Horario.SEMESTRE_ATUAL), Api.listarMatriculasDoAluno(matricula), Api.obterAluno(matricula)])
      .then(([turmas, minhas, aluno]) => this.setState({ turmas, minhas, aluno }))
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ carregando: false }));
  }

  aoFiltrar(event) {
    const { name, value, type, checked } = event.target;
    this.setState((estado) => ({ filtros: { ...estado.filtros, [name]: type === 'checkbox' ? checked : value } }));
  }

  alternar(id) {
    this.setState((estado) => ({ expandida: estado.expandida === id ? null : id }));
  }

  matricular(turma) {
    this.setState({ erro: '', sucesso: '', enviando: true });
    Api.matricular(turma.id)
      .then(() => { this.setState({ sucesso: 'Matrícula realizada em ' + turma.disciplina.nome + '.' }); return this.carregar(); })
      .catch((e) => { this.setState({ erro: e.message }); return this.carregar(); }) // o servidor é a palavra final (ex.: lotou agora)
      .finally(() => this.setState({ enviando: false }));
  }

  cancelar(m) {
    if (!window.confirm('Cancelar a matrícula em ' + m.turma.disciplina.nome + '?')) return;
    this.setState({ erro: '', sucesso: '' });
    Api.cancelarMatricula(m.id)
      .then(() => { this.setState({ sucesso: 'Matrícula em ' + m.turma.disciplina.nome + ' cancelada.' }); return this.carregar(); })
      .catch((e) => this.setState({ erro: e.message }));
  }

  render() {
    const { turmas, minhas, aluno, carregando, erro, sucesso, enviando, filtros, expandida } = this.state;
    const turmasDoAluno = minhas.map((m) => m.turma);
    const busca = filtros.busca.trim().toLowerCase();

    const avaliadas = aluno
      ? turmas.map((t) => ({ turma: t, avaliacao: Regras.avaliarMatricula({ turma: t, aluno, turmasDoAluno }), matriculado: turmasDoAluno.some((x) => x.id === t.id) }))
      : [];
    const visiveis = avaliadas
      .filter((x) => !busca || (x.turma.disciplina.nome + ' ' + x.turma.disciplina.codigo + ' ' + (x.turma.professor ? x.turma.professor.nome : '')).toLowerCase().includes(busca))
      .filter((x) => !filtros.dia || x.turma.horario.charAt(0) === filtros.dia)
      .filter((x) => !filtros.turno || x.turma.horario.charAt(1) === filtros.turno)
      .filter((x) => !filtros.soDisponiveis || x.avaliacao.podeMatricular);

    return (
      <div>
        <TituloPagina icone="bi-pencil-square" titulo="Matrícula" subtitulo={'Turmas ofertadas em ' + Horario.SEMESTRE_ATUAL + '. Cada bloqueio mostra o motivo.'} />
        <Alerta tipo="danger" mensagem={erro} onFechar={() => this.setState({ erro: '' })} />
        <Alerta tipo="success" mensagem={sucesso} onFechar={() => this.setState({ sucesso: '' })} />

        {carregando ? <Carregando texto="Carregando turmas…" /> : (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row g-2 align-items-end">
                    <div className="col-12 col-md-5">
                      <label htmlFor="busca" className="form-label">Buscar</label>
                      <input id="busca" name="busca" className="form-control" placeholder="Disciplina, código ou professor" value={filtros.busca} onChange={this.aoFiltrar} />
                    </div>
                    <div className="col-6 col-md-3">
                      <label htmlFor="dia" className="form-label">Dia</label>
                      <select id="dia" name="dia" className="form-select" value={filtros.dia} onChange={this.aoFiltrar}>
                        <option value="">Todos</option>
                        {Object.keys(Horario.DIAS).map((d) => <option key={d} value={d}>{Horario.DIAS[d]}</option>)}
                      </select>
                    </div>
                    <div className="col-6 col-md-4">
                      <label htmlFor="turno" className="form-label">Turno</label>
                      <select id="turno" name="turno" className="form-select" value={filtros.turno} onChange={this.aoFiltrar}>
                        <option value="">Todos</option>
                        {Object.keys(Horario.TURNOS).map((t) => <option key={t} value={t}>{Horario.TURNOS[t]}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="soDisponiveis" name="soDisponiveis" checked={filtros.soDisponiveis} onChange={this.aoFiltrar} />
                        <label className="form-check-label" htmlFor="soDisponiveis">Mostrar só turmas em que posso me matricular</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-body-secondary small" aria-live="polite">{visiveis.length} turma{visiveis.length === 1 ? '' : 's'} encontrada{visiveis.length === 1 ? '' : 's'}.</p>
              {turmas.length === 0 ? (
                <EstadoVazio icone="bi-calendar-x" titulo="Nenhuma turma ofertada" texto="A secretaria ainda não montou a oferta deste semestre." />
              ) : visiveis.length === 0 ? (
                <EstadoVazio icone="bi-search" titulo="Nenhuma turma com esses filtros" texto="Tente limpar a busca ou os filtros." />
              ) : visiveis.map((x) => (
                <CardTurma key={x.turma.id} turma={x.turma} avaliacao={x.avaliacao} matriculado={x.matriculado}
                  aberto={expandida === x.turma.id} onAlternar={this.alternar} onMatricular={this.matricular} enviando={enviando} />
              ))}
            </div>

            <div className="col-lg-4">
              <aside className="painel-lateral" aria-label="Minhas matrículas">
                <div className="card">
                  <div className="card-body">
                    <h2 className="h5">Minhas matrículas</h2>
                    {minhas.length === 0 ? (
                      <p className="text-body-secondary mb-0">Você ainda não se matriculou em nenhuma turma.</p>
                    ) : (
                      <ul className="list-group list-group-flush">
                        {minhas.map((m) => (
                          <li className="list-group-item px-0 d-flex justify-content-between align-items-start gap-2" key={m.id}>
                            <div>
                              <div className="fw-semibold">{m.turma.disciplina.nome}</div>
                              <div className="small text-body-secondary">{m.turma.codigo} · {m.turma.horarioTexto}</div>
                            </div>
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => this.cancelar(m)} aria-label={'Cancelar matrícula em ' + m.turma.disciplina.nome}>
                              <i className="bi bi-x-lg" aria-hidden="true"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <a href="#/aluno/grade" className="btn btn-link px-0 mt-2">Ver minha grade →</a>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    );
  }
}

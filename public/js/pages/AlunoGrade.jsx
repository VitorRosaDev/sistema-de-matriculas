// UC06 — minha grade horária, com total de carga horária e impressão.
class AlunoGrade extends React.Component {
  static contextType = SessaoContext;

  constructor(props) {
    super(props);
    this.state = { minhas: [], carregando: true, erro: '' };
    this.imprimir = this.imprimir.bind(this);
  }

  componentDidMount() {
    Api.listarMatriculasDoAluno(this.context.usuario.id)
      .then((minhas) => this.setState({ minhas }))
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ carregando: false }));
  }

  imprimir() {
    window.print();
  }

  render() {
    const { minhas, carregando, erro } = this.state;
    const turmas = minhas.map((m) => m.turma);
    const totalHoras = turmas.reduce((soma, t) => soma + t.disciplina.cargaHoraria, 0);

    return (
      <div>
        <TituloPagina icone="bi-table" titulo={'Minha grade — ' + Horario.SEMESTRE_ATUAL} subtitulo={this.context.usuario.nome + ' · matrícula ' + this.context.usuario.id} />
        <Alerta tipo="danger" mensagem={erro} onFechar={() => this.setState({ erro: '' })} />

        {carregando ? <Carregando texto="Carregando sua grade…" /> : turmas.length === 0 ? (
          <EstadoVazio icone="bi-calendar-x" titulo="Você ainda não tem matrículas"
            texto={<a href="#/aluno/ofertas">Ir para a matrícula</a>} />
        ) : (
          <div>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <p className="mb-0">
                <span className="badge text-bg-primary me-2">{turmas.length} disciplina{turmas.length === 1 ? '' : 's'}</span>
                <span className="badge text-bg-secondary">{totalHoras} horas</span>
              </p>
              <button type="button" className="btn btn-outline-primary no-print" onClick={this.imprimir}>
                <i className="bi bi-printer me-1" aria-hidden="true"></i>Imprimir
              </button>
            </div>
            <GradeHorario turmas={turmas} renderizarTurma={(t) => (
              <div>
                <div className="fw-semibold">{t.disciplina.codigo}</div>
                <div>{t.disciplina.nome}</div>
                <div className="text-body-secondary">{t.professor ? t.professor.nome : '—'} · {t.disciplina.cargaHoraria} h</div>
              </div>
            )} />
          </div>
        )}
      </div>
    );
  }
}

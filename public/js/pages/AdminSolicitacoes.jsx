// A secretaria autoriza (ou recusa) a troca de nome e data de nascimento pedida pelo aluno.
class AdminSolicitacoes extends React.Component {
  constructor(props) {
    super(props);
    this.state = { solicitacoes: [], carregando: true, erro: '', sucesso: '' };
  }

  componentDidMount() {
    this.carregar();
  }

  carregar() {
    return Api.listarSolicitacoes()
      .then((solicitacoes) => this.setState({ solicitacoes }))
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ carregando: false }));
  }

  decidir(s, status) {
    this.setState({ erro: '', sucesso: '' });
    Api.decidirSolicitacao(s.id, status)
      .then(() => { this.setState({ sucesso: 'Solicitação de ' + s.alunoNome + (status === 'aprovada' ? ' aprovada.' : ' recusada.') }); return this.carregar(); })
      .catch((e) => this.setState({ erro: e.message }));
  }

  formatar(s, valor) {
    return s.campo === 'dataNascimento' ? Formatos.data(valor) : valor;
  }

  render() {
    const { solicitacoes, carregando, erro, sucesso } = this.state;
    const pendentes = solicitacoes.filter((s) => s.status === 'pendente');
    const decididas = solicitacoes.filter((s) => s.status !== 'pendente');

    return (
      <div>
        <TituloPagina icone="bi-inbox" titulo="Solicitações de alteração" subtitulo="Nome e data de nascimento só mudam com a sua autorização." />
        <Alerta tipo="danger" mensagem={erro} onFechar={() => this.setState({ erro: '' })} />
        <Alerta tipo="success" mensagem={sucesso} onFechar={() => this.setState({ sucesso: '' })} />

        {carregando ? <Carregando texto="Carregando solicitações…" /> : solicitacoes.length === 0 ? (
          <EstadoVazio icone="bi-inbox" titulo="Nenhuma solicitação" texto="Quando um aluno pedir para alterar nome ou data de nascimento, ela aparece aqui." />
        ) : (
          <div>
            <h2 className="h5">Pendentes ({pendentes.length})</h2>
            {pendentes.length === 0 && <p className="text-body-secondary">Nenhuma solicitação pendente.</p>}
            {pendentes.map((s) => (
              <div className="card mb-3" key={s.id}>
                <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div>
                    <div className="fw-semibold">{s.alunoNome} <span className="text-body-secondary fw-normal">· matrícula {s.alunoId}</span></div>
                    <div>{ROTULO_CAMPO[s.campo]}: <span className="text-decoration-line-through text-body-secondary">{this.formatar(s, s.valorAtual)}</span> → <strong>{this.formatar(s, s.valorNovo)}</strong></div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-success" onClick={() => this.decidir(s, 'aprovada')}><i className="bi bi-check-lg me-1" aria-hidden="true"></i>Aprovar</button>
                    <button type="button" className="btn btn-outline-danger" onClick={() => this.decidir(s, 'recusada')}><i className="bi bi-x-lg me-1" aria-hidden="true"></i>Recusar</button>
                  </div>
                </div>
              </div>
            ))}

            {decididas.length > 0 && (
              <div className="mt-4">
                <h2 className="h5">Histórico</h2>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <caption className="visually-hidden">Solicitações já decididas</caption>
                    <thead><tr><th scope="col">Aluno</th><th scope="col">Campo</th><th scope="col">Alteração</th><th scope="col">Situação</th></tr></thead>
                    <tbody>
                      {decididas.map((s) => (
                        <tr key={s.id}>
                          <td>{s.alunoNome}</td>
                          <td>{ROTULO_CAMPO[s.campo]}</td>
                          <td>{this.formatar(s, s.valorAtual)} → {this.formatar(s, s.valorNovo)}</td>
                          <td><span className={'badge text-bg-' + COR_STATUS[s.status]}>{ROTULO_STATUS[s.status]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

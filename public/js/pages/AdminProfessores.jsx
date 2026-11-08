const FORM_PROFESSOR_VAZIO = { nome: '', email: '', cargaMaxima: '3' };

// UC02 — manter professores e a carga máxima de turmas.
class AdminProfessores extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      professores: [], carregando: true, erro: '', sucesso: '',
      form: { ...FORM_PROFESSOR_VAZIO }, editandoId: null, erros: {}, enviando: false,
    };
    this.aoAlterar = this.aoAlterar.bind(this);
    this.aoEnviar = this.aoEnviar.bind(this);
    this.cancelarEdicao = this.cancelarEdicao.bind(this);
  }

  componentDidMount() {
    this.carregar();
  }

  carregar() {
    return Api.listarProfessores()
      .then((professores) => this.setState({ professores }))
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ carregando: false }));
  }

  aoAlterar(event) {
    const { name, value } = event.target;
    this.setState((estado) => ({ form: { ...estado.form, [name]: value } }));
  }

  editar(p) {
    this.setState({ editandoId: p.id, erros: {}, erro: '', sucesso: '', form: { nome: p.nome, email: p.email, cargaMaxima: String(p.cargaMaxima) } });
    window.scrollTo(0, 0);
  }

  cancelarEdicao() {
    this.setState({ editandoId: null, erros: {}, form: { ...FORM_PROFESSOR_VAZIO } });
  }

  excluir(p) {
    if (!window.confirm('Excluir o professor ' + p.nome + '?')) return;
    this.setState({ erro: '', sucesso: '' });
    Api.excluirProfessor(p.id)
      .then(() => { this.setState({ sucesso: 'Professor ' + p.nome + ' excluído.' }); return this.carregar(); })
      .catch((e) => this.setState({ erro: e.message }));
  }

  aoEnviar(event) {
    event.preventDefault();
    const { form, editandoId } = this.state;
    const dados = { nome: form.nome.trim(), email: form.email.trim(), cargaMaxima: Number(form.cargaMaxima) };
    const erros = Validacao.validarProfessor(dados);
    this.setState({ erros, erro: '', sucesso: '' });
    if (Validacao.temErros(erros)) return;

    this.setState({ enviando: true });
    const chamada = editandoId ? Api.atualizarProfessor(editandoId, dados) : Api.criarProfessor(dados);
    chamada
      .then(() => {
        this.setState({ sucesso: 'Professor ' + dados.nome + (editandoId ? ' atualizado.' : ' cadastrado.'), editandoId: null, form: { ...FORM_PROFESSOR_VAZIO } });
        return this.carregar();
      })
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ enviando: false }));
  }

  render() {
    const { professores, carregando, erro, sucesso, form, editandoId, erros, enviando } = this.state;
    return (
      <div>
        <TituloPagina icone="bi-person-workspace" titulo="Professores" subtitulo="Cadastre professores e defina a carga máxima de turmas por semestre." />
        <Alerta tipo="danger" mensagem={erro} onFechar={() => this.setState({ erro: '' })} />
        <Alerta tipo="success" mensagem={sucesso} onFechar={() => this.setState({ sucesso: '' })} />

        <div className="row g-4">
          <div className="col-lg-4">
            <form className="card" onSubmit={this.aoEnviar} noValidate>
              <div className="card-body">
                <h2 className="h5">{editandoId ? 'Editar professor' : 'Novo professor'}</h2>
                <Campo id="nome" rotulo="Nome" erro={erros.nome}>
                  {(p) => <input {...p} name="nome" value={form.nome} onChange={this.aoAlterar} />}
                </Campo>
                <Campo id="email" rotulo="E-mail" erro={erros.email}>
                  {(p) => <input {...p} name="email" type="email" value={form.email} onChange={this.aoAlterar} />}
                </Campo>
                <Campo id="cargaMaxima" rotulo="Carga máxima (turmas por semestre)" erro={erros.cargaMaxima} classeControle="form-select">
                  {(p) => (
                    <select {...p} name="cargaMaxima" value={form.cargaMaxima} onChange={this.aoAlterar}>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  )}
                </Campo>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary flex-grow-1" disabled={enviando}>
                    {enviando ? 'Salvando…' : editandoId ? 'Salvar alterações' : 'Cadastrar professor'}
                  </button>
                  {editandoId && <button type="button" className="btn btn-outline-secondary" onClick={this.cancelarEdicao}>Cancelar</button>}
                </div>
              </div>
            </form>
          </div>

          <div className="col-lg-8">
            {carregando ? <Carregando texto="Carregando professores…" /> : professores.length === 0 ? (
              <EstadoVazio icone="bi-person-x" titulo="Nenhum professor cadastrado" texto="Use o formulário para cadastrar o primeiro." />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <caption className="visually-hidden">Lista de professores</caption>
                  <thead>
                    <tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col" style={{ minWidth: '10rem' }}>Carga em {Horario.SEMESTRE_ATUAL}</th><th scope="col"><span className="visually-hidden">Ações</span></th></tr>
                  </thead>
                  <tbody>
                    {professores.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-semibold">{p.nome}</td>
                        <td>{p.email}</td>
                        <td><BarraCarga carga={p.carga} maxima={p.cargaMaxima} /></td>
                        <td className="text-end text-nowrap">
                          <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => this.editar(p)} aria-label={'Editar ' + p.nome}>
                            <i className="bi bi-pencil" aria-hidden="true"></i>
                          </button>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => this.excluir(p)} aria-label={'Excluir ' + p.nome}>
                            <i className="bi bi-trash" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

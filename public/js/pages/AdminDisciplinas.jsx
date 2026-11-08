const FORM_DISCIPLINA_VAZIO = { codigo: '', nome: '', cargaHoraria: '60', preRequisitos: [] };

// UC01 — manter disciplinas e pré-requisitos.
class AdminDisciplinas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      disciplinas: [], carregando: true, erro: '', sucesso: '',
      form: { ...FORM_DISCIPLINA_VAZIO }, editandoId: null, erros: {}, enviando: false,
    };
    this.aoAlterar = this.aoAlterar.bind(this);
    this.alternarPreRequisito = this.alternarPreRequisito.bind(this);
    this.aoEnviar = this.aoEnviar.bind(this);
    this.cancelarEdicao = this.cancelarEdicao.bind(this);
  }

  componentDidMount() {
    this.carregar();
  }

  carregar() {
    return Api.listarDisciplinas()
      .then((disciplinas) => this.setState({ disciplinas }))
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ carregando: false }));
  }

  aoAlterar(event) {
    const { name, value } = event.target;
    this.setState((estado) => ({ form: { ...estado.form, [name]: name === 'codigo' ? value.toUpperCase() : value } }));
  }

  alternarPreRequisito(codigo) {
    this.setState((estado) => {
      const atuais = estado.form.preRequisitos;
      const novos = atuais.includes(codigo) ? atuais.filter((c) => c !== codigo) : [...atuais, codigo];
      return { form: { ...estado.form, preRequisitos: novos } };
    });
  }

  editar(d) {
    this.setState({
      editandoId: d.id, erros: {}, erro: '', sucesso: '',
      form: { codigo: d.codigo, nome: d.nome, cargaHoraria: String(d.cargaHoraria), preRequisitos: [...d.preRequisitos] },
    });
    window.scrollTo(0, 0);
  }

  cancelarEdicao() {
    this.setState({ editandoId: null, erros: {}, form: { ...FORM_DISCIPLINA_VAZIO } });
  }

  excluir(d) {
    if (!window.confirm('Excluir a disciplina ' + d.codigo + ' — ' + d.nome + '?')) return;
    this.setState({ erro: '', sucesso: '' });
    Api.excluirDisciplina(d.id)
      .then(() => { this.setState({ sucesso: 'Disciplina ' + d.codigo + ' excluída.' }); return this.carregar(); })
      .catch((e) => this.setState({ erro: e.message }));
  }

  aoEnviar(event) {
    event.preventDefault();
    const { form, editandoId } = this.state;
    const dados = { codigo: form.codigo.trim(), nome: form.nome.trim(), cargaHoraria: Number(form.cargaHoraria), preRequisitos: form.preRequisitos };
    const erros = Validacao.validarDisciplina(dados);
    this.setState({ erros, erro: '', sucesso: '' });
    if (Validacao.temErros(erros)) return;

    this.setState({ enviando: true });
    const chamada = editandoId ? Api.atualizarDisciplina(editandoId, dados) : Api.criarDisciplina(dados);
    chamada
      .then(() => {
        this.setState({ sucesso: 'Disciplina ' + dados.codigo + (editandoId ? ' atualizada.' : ' criada.'), editandoId: null, form: { ...FORM_DISCIPLINA_VAZIO } });
        return this.carregar();
      })
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ enviando: false }));
  }

  render() {
    const { disciplinas, carregando, erro, sucesso, form, editandoId, erros, enviando } = this.state;
    // R7: uma disciplina não pode ser pré-requisito de si mesma.
    const candidatas = disciplinas.filter((d) => d.codigo !== form.codigo);

    return (
      <div>
        <TituloPagina icone="bi-journal-bookmark" titulo="Disciplinas" subtitulo="Cadastre disciplinas e seus pré-requisitos." />
        <Alerta tipo="danger" mensagem={erro} onFechar={() => this.setState({ erro: '' })} />
        <Alerta tipo="success" mensagem={sucesso} onFechar={() => this.setState({ sucesso: '' })} />

        <div className="row g-4">
          <div className="col-lg-4">
            <form className="card" onSubmit={this.aoEnviar} noValidate>
              <div className="card-body">
                <h2 className="h5">{editandoId ? 'Editar disciplina' : 'Nova disciplina'}</h2>
                <Campo id="codigo" rotulo="Código" erro={erros.codigo} ajuda={editandoId ? 'O código não pode ser alterado.' : 'Ex.: INF0101'}>
                  {(p) => <input {...p} name="codigo" maxLength="7" value={form.codigo} onChange={this.aoAlterar} disabled={!!editandoId} />}
                </Campo>
                <Campo id="nome" rotulo="Nome" erro={erros.nome}>
                  {(p) => <input {...p} name="nome" value={form.nome} onChange={this.aoAlterar} />}
                </Campo>
                <Campo id="cargaHoraria" rotulo="Carga horária" erro={erros.cargaHoraria} classeControle="form-select">
                  {(p) => (
                    <select {...p} name="cargaHoraria" value={form.cargaHoraria} onChange={this.aoAlterar}>
                      <option value="30">30 horas</option>
                      <option value="60">60 horas</option>
                      <option value="90">90 horas</option>
                    </select>
                  )}
                </Campo>
                <fieldset className="mb-3">
                  <legend className="form-label fs-6">Pré-requisitos</legend>
                  {candidatas.length === 0 && <p className="small text-body-secondary">Nenhuma outra disciplina cadastrada.</p>}
                  <div style={{ maxHeight: '14rem', overflowY: 'auto' }}>
                    {candidatas.map((d) => (
                      <div className="form-check" key={d.id}>
                        <input className="form-check-input" type="checkbox" id={'pre-' + d.codigo}
                          checked={form.preRequisitos.includes(d.codigo)} onChange={() => this.alternarPreRequisito(d.codigo)} />
                        <label className="form-check-label" htmlFor={'pre-' + d.codigo}>{d.codigo} — {d.nome}</label>
                      </div>
                    ))}
                  </div>
                  {erros.preRequisitos && <div className="text-danger small">{erros.preRequisitos}</div>}
                </fieldset>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary flex-grow-1" disabled={enviando}>
                    {enviando ? 'Salvando…' : editandoId ? 'Salvar alterações' : 'Criar disciplina'}
                  </button>
                  {editandoId && <button type="button" className="btn btn-outline-secondary" onClick={this.cancelarEdicao}>Cancelar</button>}
                </div>
              </div>
            </form>
          </div>

          <div className="col-lg-8">
            {carregando ? <Carregando texto="Carregando disciplinas…" /> : disciplinas.length === 0 ? (
              <EstadoVazio icone="bi-journal-x" titulo="Nenhuma disciplina cadastrada" texto="Use o formulário para criar a primeira." />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <caption className="visually-hidden">Lista de disciplinas</caption>
                  <thead>
                    <tr><th scope="col">Código</th><th scope="col">Nome</th><th scope="col">Carga</th><th scope="col">Pré-requisitos</th><th scope="col"><span className="visually-hidden">Ações</span></th></tr>
                  </thead>
                  <tbody>
                    {disciplinas.map((d) => (
                      <tr key={d.id}>
                        <td className="fw-semibold">{d.codigo}</td>
                        <td>{d.nome}</td>
                        <td>{d.cargaHoraria} h</td>
                        <td>{d.preRequisitos.length ? d.preRequisitos.join(', ') : <span className="text-body-secondary">—</span>}</td>
                        <td className="text-end text-nowrap">
                          <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => this.editar(d)} aria-label={'Editar ' + d.codigo}>
                            <i className="bi bi-pencil" aria-hidden="true"></i>
                          </button>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => this.excluir(d)} aria-label={'Excluir ' + d.codigo}>
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

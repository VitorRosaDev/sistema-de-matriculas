// UC03 — montar a oferta de turmas e ver a grade (dia × turno).
class AdminTurmas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      turmas: [], disciplinas: [], professores: [], carregando: true, erro: '', sucesso: '',
      form: { disciplinaId: '', professorId: '', dia: '2', turno: '1', vagas: '30' },
      erros: {}, enviando: false, visao: 'grade',
    };
    this.aoAlterar = this.aoAlterar.bind(this);
    this.aoEnviar = this.aoEnviar.bind(this);
  }

  componentDidMount() {
    this.carregar();
  }

  carregar() {
    return Promise.all([Api.listarTurmas(Horario.SEMESTRE_ATUAL), Api.listarDisciplinas(), Api.listarProfessores()])
      .then(([turmas, disciplinas, professores]) => this.setState({ turmas, disciplinas, professores }))
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ carregando: false }));
  }

  aoAlterar(event) {
    const { name, value } = event.target;
    this.setState((estado) => ({ form: { ...estado.form, [name]: value } }));
  }

  // Formato "bruto" que as regras esperam (iguais às do servidor).
  turmasBrutas() {
    return this.state.turmas.map((t) => ({ id: t.id, professorId: t.professor && t.professor.id, disciplinaId: t.disciplina && t.disciplina.id, horario: t.horario, semestre: t.semestre }));
  }

  dadosDoForm() {
    const f = this.state.form;
    return { disciplinaId: f.disciplinaId, professorId: f.professorId, horario: f.dia + f.turno, vagas: Number(f.vagas), semestre: Horario.SEMESTRE_ATUAL };
  }

  aoEnviar(event) {
    event.preventDefault();
    const dados = this.dadosDoForm();
    const erros = Validacao.validarTurma(dados);
    this.setState({ erros, erro: '', sucesso: '' });
    if (Validacao.temErros(erros)) return;

    this.setState({ enviando: true });
    Api.criarTurma(dados)
      .then((t) => {
        this.setState({ sucesso: 'Turma ' + t.codigo + ' ofertada.' });
        return this.carregar();
      })
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ enviando: false }));
  }

  alternarStatus(t) {
    const novo = t.status === 'aberta' ? 'fechada' : 'aberta';
    this.setState({ erro: '', sucesso: '' });
    Api.alterarStatusTurma(t.id, novo)
      .then(() => { this.setState({ sucesso: 'Turma ' + t.codigo + (novo === 'fechada' ? ' fechada.' : ' reaberta.') }); return this.carregar(); })
      .catch((e) => this.setState({ erro: e.message }));
  }

  excluir(t) {
    if (!window.confirm('Excluir a turma ' + t.codigo + '?')) return;
    this.setState({ erro: '', sucesso: '' });
    Api.excluirTurma(t.id)
      .then(() => { this.setState({ sucesso: 'Turma ' + t.codigo + ' excluída.' }); return this.carregar(); })
      .catch((e) => this.setState({ erro: e.message }));
  }

  renderizarTurma(t) {
    return (
      <div>
        <div className="fw-semibold">{t.disciplina.codigo}</div>
        <div>{t.disciplina.nome}</div>
        <div className="text-body-secondary">{t.professor ? t.professor.nome : '—'}</div>
        <div className="d-flex flex-wrap align-items-center gap-1 my-1">
          <span className="badge text-bg-secondary">{t.ocupadas}/{t.vagas} alunos</span>
          {t.status === 'fechada' && <span className="badge text-bg-warning text-dark">Fechada</span>}
        </div>
        <div className="d-flex gap-1">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => this.alternarStatus(t)}
            aria-label={(t.status === 'aberta' ? 'Fechar ' : 'Reabrir ') + t.codigo}>
            <i className={'bi ' + (t.status === 'aberta' ? 'bi-lock' : 'bi-unlock')} aria-hidden="true"></i>
          </button>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => this.excluir(t)} aria-label={'Excluir ' + t.codigo}>
            <i className="bi bi-trash" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    );
  }

  render() {
    const { turmas, disciplinas, professores, carregando, erro, sucesso, form, erros, enviando, visao } = this.state;
    const dados = this.dadosDoForm();
    const brutas = this.turmasBrutas();

    // R6: professores ordenados pela menor carga; quem está lotado fica desabilitado.
    const comCarga = Regras.cargaPorProfessor(professores, brutas);
    const professor = comCarga.find((p) => p.id === form.professorId);
    // Avisos ao vivo (R5, R6, R8) antes mesmo de enviar.
    const avaliacao = form.disciplinaId && form.professorId
      ? Regras.avaliarOferta({ turma: dados, professor, turmasDoSemestre: brutas })
      : { podeOfertar: true, motivos: [] };

    return (
      <div>
        <TituloPagina icone="bi-calendar3" titulo={'Oferta de turmas — ' + Horario.SEMESTRE_ATUAL} subtitulo="Monte a oferta do semestre e acompanhe a grade de horários." />
        <Alerta tipo="danger" mensagem={erro} onFechar={() => this.setState({ erro: '' })} />
        <Alerta tipo="success" mensagem={sucesso} onFechar={() => this.setState({ sucesso: '' })} />

        <div className="row g-4">
          <div className="col-lg-4">
            <form className="card" onSubmit={this.aoEnviar} noValidate>
              <div className="card-body">
                <h2 className="h5">Nova turma</h2>
                <Campo id="disciplinaId" rotulo="Disciplina" erro={erros.disciplinaId} classeControle="form-select">
                  {(p) => (
                    <select {...p} name="disciplinaId" value={form.disciplinaId} onChange={this.aoAlterar}>
                      <option value="">Selecione…</option>
                      {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.codigo} — {d.nome}</option>)}
                    </select>
                  )}
                </Campo>
                <Campo id="professorId" rotulo="Professor (menor carga primeiro)" erro={erros.professorId} classeControle="form-select">
                  {(p) => (
                    <select {...p} name="professorId" value={form.professorId} onChange={this.aoAlterar}>
                      <option value="">Selecione…</option>
                      {comCarga.map((pr) => (
                        <option key={pr.id} value={pr.id} disabled={pr.carga >= pr.cargaMaxima}>
                          {pr.nome} — {pr.carga}/{pr.cargaMaxima}{pr.carga >= pr.cargaMaxima ? ' (lotado)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
                <div className="row">
                  <Campo id="dia" rotulo="Dia" className="col-6 mb-3" classeControle="form-select">
                    {(p) => (
                      <select {...p} name="dia" value={form.dia} onChange={this.aoAlterar}>
                        {Object.keys(Horario.DIAS).map((d) => <option key={d} value={d}>{Horario.DIAS[d]}</option>)}
                      </select>
                    )}
                  </Campo>
                  <Campo id="turno" rotulo="Turno" className="col-6 mb-3" classeControle="form-select">
                    {(p) => (
                      <select {...p} name="turno" value={form.turno} onChange={this.aoAlterar}>
                        {Object.keys(Horario.TURNOS).map((t) => <option key={t} value={t}>{Horario.TURNOS[t]}</option>)}
                      </select>
                    )}
                  </Campo>
                </div>
                <p className="small" aria-live="polite">
                  Código de horário: <span className="badge text-bg-primary">{dados.horario}</span> ({Horario.textoDoHorario(dados.horario)})
                </p>
                <Campo id="vagas" rotulo="Vagas" erro={erros.vagas}>
                  {(p) => <input {...p} name="vagas" type="number" min="1" max="80" value={form.vagas} onChange={this.aoAlterar} />}
                </Campo>

                {avaliacao.motivos.length > 0 && (
                  <div className="alert alert-warning small" role="alert">
                    <strong>Atenção:</strong>
                    <ul className="mb-0 ps-3">{avaliacao.motivos.map((m) => <li key={m}>{m}</li>)}</ul>
                  </div>
                )}
                <button type="submit" className="btn btn-primary w-100" disabled={enviando || !avaliacao.podeOfertar}>
                  {enviando ? 'Salvando…' : 'Ofertar turma'}
                </button>
              </div>
            </form>
          </div>

          <div className="col-lg-8">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Turmas ofertadas ({turmas.length})</h2>
              <div className="btn-group" role="group" aria-label="Modo de visualização">
                <button type="button" className={'btn btn-sm ' + (visao === 'grade' ? 'btn-primary' : 'btn-outline-primary')} aria-pressed={visao === 'grade'}
                  onClick={() => this.setState({ visao: 'grade' })}><i className="bi bi-grid-3x3 me-1" aria-hidden="true"></i>Grade</button>
                <button type="button" className={'btn btn-sm ' + (visao === 'tabela' ? 'btn-primary' : 'btn-outline-primary')} aria-pressed={visao === 'tabela'}
                  onClick={() => this.setState({ visao: 'tabela' })}><i className="bi bi-list-ul me-1" aria-hidden="true"></i>Tabela</button>
              </div>
            </div>

            {carregando ? <Carregando texto="Carregando oferta…" /> : turmas.length === 0 ? (
              <EstadoVazio icone="bi-calendar-x" titulo="Nenhuma turma ofertada" texto="Use o formulário para ofertar a primeira turma." />
            ) : visao === 'grade' ? (
              <GradeHorario turmas={turmas} renderizarTurma={(t) => this.renderizarTurma(t)} />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <caption className="visually-hidden">Turmas ofertadas</caption>
                  <thead>
                    <tr><th scope="col">Turma</th><th scope="col">Disciplina</th><th scope="col">Professor</th><th scope="col">Horário</th><th scope="col">Alunos</th><th scope="col">Situação</th><th scope="col"><span className="visually-hidden">Ações</span></th></tr>
                  </thead>
                  <tbody>
                    {turmas.map((t) => (
                      <tr key={t.id}>
                        <td className="fw-semibold">{t.codigo}</td>
                        <td>{t.disciplina.nome}</td>
                        <td>{t.professor ? t.professor.nome : '—'}</td>
                        <td>{t.horarioTexto}</td>
                        <td>{t.ocupadas}/{t.vagas}</td>
                        <td><span className={'badge ' + (t.status === 'aberta' ? 'text-bg-success' : 'text-bg-secondary')}>{t.status === 'aberta' ? 'Aberta' : 'Fechada'}</span></td>
                        <td className="text-end text-nowrap">
                          <button type="button" className="btn btn-outline-secondary btn-sm me-1" onClick={() => this.alternarStatus(t)}
                            aria-label={(t.status === 'aberta' ? 'Fechar ' : 'Reabrir ') + t.codigo}>
                            <i className={'bi ' + (t.status === 'aberta' ? 'bi-lock' : 'bi-unlock')} aria-hidden="true"></i>
                          </button>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => this.excluir(t)} aria-label={'Excluir ' + t.codigo}>
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

const ROTULO_CAMPO = { nome: 'Nome', dataNascimento: 'Data de nascimento' };
const ROTULO_STATUS = { pendente: 'Aguardando a secretaria', aprovada: 'Aprovada', recusada: 'Recusada' };
const COR_STATUS = { pendente: 'warning text-dark', aprovada: 'success', recusada: 'danger' };

// Meu cadastro. Endereço e contatos: edição livre. Nome e nascimento: só por solicitação. Senha: confirma a atual.
class AlunoPerfil extends React.Component {
  static contextType = SessaoContext;

  constructor(props) {
    super(props);
    this.state = {
      aluno: null, solicitacoes: [], carregando: true, erro: '', sucesso: '',
      contato: { endereco: '', email: '', telefone: '' }, errosContato: {}, salvandoContato: false,
      pedido: { campo: null, valor: '' }, erroPedido: '',
      senhas: { senhaAtual: '', senhaNova: '', confirmar: '' }, errosSenha: {}, salvandoSenha: false,
    };
    this.aoAlterarContato = this.aoAlterarContato.bind(this);
    this.salvarContato = this.salvarContato.bind(this);
    this.aoAlterarSenha = this.aoAlterarSenha.bind(this);
    this.salvarSenha = this.salvarSenha.bind(this);
    this.enviarPedido = this.enviarPedido.bind(this);
  }

  componentDidMount() {
    this.carregar();
  }

  carregar() {
    const id = this.context.usuario.id;
    return Promise.all([Api.obterAluno(id), Api.listarSolicitacoesDoAluno(id)])
      .then(([aluno, solicitacoes]) => {
        this.setState({ aluno, solicitacoes, contato: { endereco: aluno.endereco || '', email: aluno.email || '', telefone: Formatos.telefone(aluno.telefone) } });
        // Se a secretaria aprovou uma troca de nome, o nome da barra superior acompanha.
        if (aluno.nome !== this.context.usuario.nome) this.context.entrar('aluno', { id, nome: aluno.nome });
      })
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ carregando: false }));
  }

  aoAlterarContato(event) {
    const { name, value } = event.target;
    this.setState((estado) => ({ contato: { ...estado.contato, [name]: name === 'telefone' ? Formatos.telefone(value) : value } }));
  }

  salvarContato(event) {
    event.preventDefault();
    const c = this.state.contato;
    const dados = { endereco: c.endereco.trim(), email: c.email.trim(), telefone: c.telefone };
    const errosContato = Validacao.validarContato(dados);
    this.setState({ errosContato, erro: '', sucesso: '' });
    if (Validacao.temErros(errosContato)) return;

    this.setState({ salvandoContato: true });
    Api.atualizarContato(this.context.usuario.id, dados)
      .then(() => { this.setState({ sucesso: 'Dados de contato atualizados.' }); return this.carregar(); })
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ salvandoContato: false }));
  }

  abrirPedido(campo) {
    this.setState({ pedido: { campo, valor: '' }, erroPedido: '', erro: '', sucesso: '' });
  }

  enviarPedido(event) {
    event.preventDefault();
    const { campo, valor } = this.state.pedido;
    const invalido = campo === 'nome' ? !Validacao.nomeCompleto(valor.trim()) : !Validacao.dataValida(valor);
    if (invalido) {
      this.setState({ erroPedido: campo === 'nome' ? 'Informe o nome completo (nome e sobrenome, só letras).' : 'Data de nascimento inválida.' });
      return;
    }
    this.setState({ erroPedido: '' });
    Api.solicitarAlteracao(this.context.usuario.id, { campo, valorNovo: valor })
      .then(() => {
        this.setState({ pedido: { campo: null, valor: '' }, sucesso: 'Solicitação enviada. A secretaria vai analisar.' });
        return this.carregar();
      })
      .catch((e) => this.setState({ erroPedido: e.message }));
  }

  aoAlterarSenha(event) {
    const { name, value } = event.target;
    this.setState((estado) => ({ senhas: { ...estado.senhas, [name]: value } }));
  }

  salvarSenha(event) {
    event.preventDefault();
    const { senhaAtual, senhaNova, confirmar } = this.state.senhas;
    const errosSenha = {};
    if (!senhaAtual) errosSenha.senhaAtual = 'Informe a senha atual.';
    const erroNova = Validacao.validarSenhaNova(senhaNova);
    if (erroNova) errosSenha.senhaNova = erroNova;
    else if (senhaNova === senhaAtual) errosSenha.senhaNova = 'A nova senha deve ser diferente da atual.';
    if (senhaNova !== confirmar) errosSenha.confirmar = 'As senhas não são iguais.';
    this.setState({ errosSenha, erro: '', sucesso: '' });
    if (Validacao.temErros(errosSenha)) return;

    this.setState({ salvandoSenha: true });
    Api.alterarSenha(this.context.usuario.id, { senhaAtual, senhaNova })
      .then(() => this.setState({ sucesso: 'Senha alterada.', senhas: { senhaAtual: '', senhaNova: '', confirmar: '' } }))
      // 403 = senha atual recusada: o erro vai para o campo. Qualquer outro vai para o alerta geral.
      .catch((e) => this.setState(e.status === 403 ? { errosSenha: { senhaAtual: e.message } } : { erro: e.message }))
      .finally(() => this.setState({ salvandoSenha: false }));
  }

  renderCampoProtegido(campo, valorExibido) {
    const { pedido, erroPedido, solicitacoes } = this.state;
    const pendente = solicitacoes.find((s) => s.campo === campo && s.status === 'pendente');
    const editando = pedido.campo === campo;
    return (
      <div className="mb-3">
        <div className="form-label">{ROTULO_CAMPO[campo]}</div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="fw-semibold">{valorExibido}</span>
          <span className="badge text-bg-secondary"><i className="bi bi-lock me-1" aria-hidden="true"></i>Alteração com autorização</span>
          {pendente
            ? <span className="badge text-bg-warning">Pedido pendente: {campo === 'dataNascimento' ? Formatos.data(pendente.valorNovo) : pendente.valorNovo}</span>
            : !editando && <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => this.abrirPedido(campo)}>Solicitar alteração</button>}
        </div>
        {editando && (
          <form className="mt-2" onSubmit={this.enviarPedido} noValidate>
            <Campo id={'pedido-' + campo} rotulo={'Novo valor para ' + ROTULO_CAMPO[campo].toLowerCase()} erro={erroPedido} className="mb-2">
              {(p) => <input {...p} type={campo === 'dataNascimento' ? 'date' : 'text'} value={pedido.valor}
                onChange={(e) => this.setState({ pedido: { campo, valor: e.target.value } })} />}
            </Campo>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm">Enviar solicitação</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => this.setState({ pedido: { campo: null, valor: '' }, erroPedido: '' })}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    );
  }

  render() {
    const { aluno, solicitacoes, carregando, erro, sucesso, contato, errosContato, salvandoContato, senhas, errosSenha, salvandoSenha } = this.state;
    return (
      <div>
        <TituloPagina icone="bi-person-circle" titulo="Meu cadastro" subtitulo="Atualize seus dados de contato e sua senha." />
        <Alerta tipo="danger" mensagem={erro} onFechar={() => this.setState({ erro: '' })} />
        <Alerta tipo="success" mensagem={sucesso} onFechar={() => this.setState({ sucesso: '' })} />

        {carregando ? <Carregando texto="Carregando seu cadastro…" /> : !aluno ? null : (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card mb-4">
                <div className="card-body">
                  <h2 className="h5">Dados pessoais</h2>
                  <div className="mb-3"><div className="form-label">Matrícula</div><span className="fw-semibold">{aluno.matricula}</span></div>
                  {this.renderCampoProtegido('nome', aluno.nome)}
                  {this.renderCampoProtegido('dataNascimento', Formatos.data(aluno.dataNascimento))}
                </div>
              </div>

              {solicitacoes.length > 0 && (
                <div className="card">
                  <div className="card-body">
                    <h2 className="h5">Minhas solicitações</h2>
                    <ul className="list-group list-group-flush">
                      {solicitacoes.map((s) => (
                        <li className="list-group-item px-0 d-flex justify-content-between align-items-start gap-2" key={s.id}>
                          <div>
                            <div className="fw-semibold">{ROTULO_CAMPO[s.campo]}</div>
                            <div className="small text-body-secondary">
                              {s.campo === 'dataNascimento' ? Formatos.data(s.valorAtual) + ' → ' + Formatos.data(s.valorNovo) : s.valorAtual + ' → ' + s.valorNovo}
                            </div>
                          </div>
                          <span className={'badge text-bg-' + COR_STATUS[s.status]}>{ROTULO_STATUS[s.status]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="col-lg-6">
              <form className="card mb-4" onSubmit={this.salvarContato} noValidate>
                <div className="card-body">
                  <h2 className="h5">Endereço e contatos</h2>
                  <Campo id="endereco" rotulo="Endereço" erro={errosContato.endereco}>
                    {(p) => <input {...p} name="endereco" value={contato.endereco} onChange={this.aoAlterarContato} />}
                  </Campo>
                  <Campo id="email" rotulo="E-mail" erro={errosContato.email}>
                    {(p) => <input {...p} name="email" type="email" value={contato.email} onChange={this.aoAlterarContato} />}
                  </Campo>
                  <Campo id="telefone" rotulo="Celular" erro={errosContato.telefone}>
                    {(p) => <input {...p} name="telefone" type="tel" inputMode="tel" value={contato.telefone} onChange={this.aoAlterarContato} />}
                  </Campo>
                  <button type="submit" className="btn btn-primary" disabled={salvandoContato}>{salvandoContato ? 'Salvando…' : 'Salvar dados'}</button>
                </div>
              </form>

              <form className="card" onSubmit={this.salvarSenha} noValidate>
                <div className="card-body">
                  <h2 className="h5">Alterar senha</h2>
                  <Campo id="senhaAtual" rotulo="Senha atual" erro={errosSenha.senhaAtual}>
                    {(p) => <input {...p} name="senhaAtual" type="password" autoComplete="current-password" value={senhas.senhaAtual} onChange={this.aoAlterarSenha} />}
                  </Campo>
                  <Campo id="senhaNova" rotulo="Nova senha" erro={errosSenha.senhaNova} ajuda="Mínimo de 8 caracteres, com letras e números.">
                    {(p) => <input {...p} name="senhaNova" type="password" autoComplete="new-password" value={senhas.senhaNova} onChange={this.aoAlterarSenha} />}
                  </Campo>
                  <Campo id="confirmar" rotulo="Confirmar nova senha" erro={errosSenha.confirmar}>
                    {(p) => <input {...p} name="confirmar" type="password" autoComplete="new-password" value={senhas.confirmar} onChange={this.aoAlterarSenha} />}
                  </Campo>
                  <button type="submit" className="btn btn-primary" disabled={salvandoSenha}>{salvandoSenha ? 'Salvando…' : 'Alterar senha'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
}

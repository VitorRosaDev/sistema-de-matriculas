// Usuários criados por `npm run seed` (ver seed.js).
const SENHA_ALUNOS_TESTE = 'senha123';
const ALUNOS_TESTE = [
  { matricula: '100000001', email: 'lucas.pereira@aluno.example', nome: 'Lucas Pereira', nota: 'calouro, sem disciplinas cursadas' },
  { matricula: '100000002', email: 'mariana.costa@aluno.example', nome: 'Mariana Costa', nota: 'intermediária' },
  { matricula: '100000003', email: 'rafael.oliveira@aluno.example', nome: 'Rafael Oliveira', nota: 'avançado' },
  { matricula: '100000004', email: 'fernanda.dias@aluno.example', nome: 'Fernanda Dias', nota: 'intermediária' },
];
const SECRETARIA_TESTE = { usuario: 'secretaria', senha: 'unisinos' };

class Login extends React.Component {
  static contextType = SessaoContext;

  constructor(props) {
    super(props);
    this.state = { perfil: 'aluno', identificador: '', usuario: '', senha: '', erros: {}, erro: '', enviando: false, infoAberta: false };
    this.botaoInfo = React.createRef();
    this.aoAlterar = this.aoAlterar.bind(this);
    this.aoEnviar = this.aoEnviar.bind(this);
    this.trocarPerfil = this.trocarPerfil.bind(this);
    this.alternarInfo = this.alternarInfo.bind(this);
    this.fecharInfo = this.fecharInfo.bind(this);
    this.aoTeclarInfo = this.aoTeclarInfo.bind(this);
  }

  aoAlterar(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  trocarPerfil(perfil) {
    this.setState({ perfil, senha: '', erros: {}, erro: '' });
  }

  alternarInfo() {
    this.setState((s) => ({ infoAberta: !s.infoAberta }));
  }

  fecharInfo() {
    this.setState({ infoAberta: false });
    if (this.botaoInfo.current) this.botaoInfo.current.focus();
  }

  aoTeclarInfo(event) {
    if (event.key === 'Escape') this.fecharInfo();
  }

  // Preenche o formulário com um usuário de teste; quem envia é o professor, clicando em "Entrar".
  usarCredencial(perfil, login, senha) {
    this.setState({
      perfil,
      identificador: perfil === 'aluno' ? login : '',
      usuario: perfil === 'secretaria' ? login : '',
      senha,
      erros: {},
      erro: '',
      infoAberta: false,
    });
  }

  aoEnviar(event) {
    event.preventDefault();
    const { perfil, identificador, usuario, senha } = this.state;
    const credenciais = perfil === 'aluno' ? { perfil, identificador: identificador.trim(), senha } : { perfil, usuario: usuario.trim(), senha };
    const erros = Validacao.validarLogin(credenciais);
    this.setState({ erros, erro: '' });
    if (Validacao.temErros(erros)) return;

    this.setState({ enviando: true });
    Api.entrar(credenciais)
      .then((resposta) => this.context.entrar(resposta.perfil, resposta.usuario))
      .catch((e) => this.setState({ erro: e.message, enviando: false }));
  }

  renderInfo() {
    return (
      <div id="card-info-teste" className="card card-info-teste shadow" role="dialog" aria-labelledby="titulo-info-teste" onKeyDown={this.aoTeclarInfo}>
        <div className="card-header d-flex align-items-center justify-content-between">
          <h2 id="titulo-info-teste" className="h6 mb-0"><i className="bi bi-info-circle me-1" aria-hidden="true"></i>Dados de teste</h2>
          <button type="button" className="btn-close" aria-label="Fechar" onClick={this.fecharInfo}></button>
        </div>
        <div className="card-body">
          <p className="small">
            Ao rodar <code>npm run seed</code>, o banco é carregado com usuários fictícios, só para avaliar o sistema.
            O aluno entra com a matrícula <strong>ou</strong> com o e-mail. Escolha uma das formas e o formulário
            é preenchido; depois é só clicar em “Entrar”.
          </p>

          <h3 className="h6">Alunos <span className="fw-normal text-body-secondary">(senha padrão: {SENHA_ALUNOS_TESTE})</span></h3>
          <div className="list-group mb-3">
            {ALUNOS_TESTE.map((a) => (
              <div key={a.matricula} className="list-group-item">
                <span className="fw-semibold">{a.nome}</span>
                <span className="d-block small text-body-secondary mb-2">{a.nota}</span>
                <div className="d-grid gap-2">
                  <button type="button" className="btn btn-outline-primary btn-sm text-start"
                    onClick={() => this.usarCredencial('aluno', a.matricula, SENHA_ALUNOS_TESTE)}>
                    <i className="bi bi-123 me-1" aria-hidden="true"></i><span className="visually-hidden">Entrar com a matrícula </span>{a.matricula}
                  </button>
                  <button type="button" className="btn btn-outline-primary btn-sm text-start text-break"
                    onClick={() => this.usarCredencial('aluno', a.email, SENHA_ALUNOS_TESTE)}>
                    <i className="bi bi-envelope me-1" aria-hidden="true"></i><span className="visually-hidden">Entrar com o e-mail </span>{a.email}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h3 className="h6">Secretaria</h3>
          <div className="list-group">
            <button type="button" className="list-group-item list-group-item-action"
              onClick={() => this.usarCredencial('secretaria', SECRETARIA_TESTE.usuario, SECRETARIA_TESTE.senha)}>
              <span className="fw-semibold">{SECRETARIA_TESTE.usuario}</span>
              <span className="d-block small text-body-secondary">senha {SECRETARIA_TESTE.senha}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { perfil, erros, erro, enviando, infoAberta } = this.state;
    return (
      <div>
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h1 className="h4 titulo-pagina mb-1">Entrar</h1>
              <p className="text-body-secondary">Sistema de Atendimento e Matrículas</p>

              <div className="btn-group w-100 mb-3" role="group" aria-label="Perfil de acesso">
                <button type="button" className={'btn ' + (perfil === 'aluno' ? 'btn-primary' : 'btn-outline-primary')}
                  aria-pressed={perfil === 'aluno'} onClick={() => this.trocarPerfil('aluno')}>
                  <i className="bi bi-mortarboard me-1" aria-hidden="true"></i>Aluno
                </button>
                <button type="button" className={'btn ' + (perfil === 'secretaria' ? 'btn-primary' : 'btn-outline-primary')}
                  aria-pressed={perfil === 'secretaria'} onClick={() => this.trocarPerfil('secretaria')}>
                  <i className="bi bi-building me-1" aria-hidden="true"></i>Secretaria
                </button>
              </div>

              <Alerta tipo="danger" mensagem={erro} onFechar={() => this.setState({ erro: '' })} />

              <form onSubmit={this.aoEnviar} noValidate>
                {perfil === 'aluno' ? (
                  <div>
                    <Campo id="identificador" rotulo="Matrícula ou e-mail" erro={erros.identificador} ajuda="Use a matrícula ou o e-mail do seu cadastro.">
                      {(p) => <input {...p} name="identificador" autoComplete="username" autoCapitalize="none" spellCheck="false" value={this.state.identificador} onChange={this.aoAlterar} />}
                    </Campo>
                    <Campo id="senha" rotulo="Senha" erro={erros.senha} ajuda="A senha criada no seu cadastro.">
                      {(p) => <input {...p} name="senha" type="password" autoComplete="current-password" value={this.state.senha} onChange={this.aoAlterar} />}
                    </Campo>
                  </div>
                ) : (
                  <div>
                    <Campo id="usuario" rotulo="Usuário" erro={erros.usuario} ajuda="Usuário de acesso da secretaria.">
                      {(p) => <input {...p} name="usuario" autoComplete="username" value={this.state.usuario} onChange={this.aoAlterar} />}
                    </Campo>
                    <Campo id="senha" rotulo="Senha" erro={erros.senha} ajuda="Senha de acesso da secretaria.">
                      {(p) => <input {...p} name="senha" type="password" autoComplete="current-password" value={this.state.senha} onChange={this.aoAlterar} />}
                    </Campo>
                  </div>
                )}
                <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
                  {enviando ? 'Entrando…' : 'Entrar'}
                </button>
              </form>

              {perfil === 'aluno' && (
                <p className="text-center mt-3 mb-0">
                  Primeiro acesso? <a href="#/cadastro">Faça seu cadastro</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {infoAberta && this.renderInfo()}
      <button type="button" ref={this.botaoInfo} className={'btn-info-teste' + (infoAberta ? ' aberto' : '')}
        aria-label="Dados de teste" aria-haspopup="dialog" aria-expanded={infoAberta} aria-controls="card-info-teste"
        onClick={this.alternarInfo}>
        <i className="bi bi-info-lg" aria-hidden="true"></i>
      </button>
      </div>
    );
  }
}

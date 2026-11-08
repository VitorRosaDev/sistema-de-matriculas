class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.lerEstadoSalvo();
    this.entrar = this.entrar.bind(this);
    this.sair = this.sair.bind(this);
    this.alternarTema = this.alternarTema.bind(this);
    this.irParaConteudo = this.irParaConteudo.bind(this);
  }

  // A sessão vive no cookie HttpOnly do servidor; ao abrir a página, perguntamos a ele quem está logado (componentDidMount).
  lerEstadoSalvo() {
    let tema = 'light';
    try {
      tema = localStorage.getItem('tema') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch (e) { /* mantém claro */ }
    return { usuario: null, perfil: null, tema, carregando: true };
  }

  componentDidMount() {
    document.documentElement.dataset.bsTheme = this.state.tema;
    Api.ganchos.aoExpirar = () => this.setState({ perfil: null, usuario: null });
    Api.sessao()
      .then((s) => this.setState({ perfil: s.perfil, usuario: s.usuario, carregando: false }))
      .catch(() => this.setState({ carregando: false })); // sem sessão (ou servidor fora): mostra o login
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.tema !== this.state.tema) {
      document.documentElement.dataset.bsTheme = this.state.tema;
      try { localStorage.setItem('tema', this.state.tema); } catch (e) { /* ignora */ }
    }
  }

  entrar(perfil, usuario) {
    this.setState({ perfil, usuario });
  }

  sair() {
    // Sai da tela mesmo se o servidor não responder; o cookie expira sozinho.
    Api.sair().catch(() => {}).then(() => this.setState({ perfil: null, usuario: null }));
  }

  alternarTema() {
    this.setState((estado) => ({ tema: estado.tema === 'light' ? 'dark' : 'light' }));
  }

  // "Pular para o conteúdo" sem mexer no hash (que é usado pelo roteador).
  irParaConteudo(event) {
    event.preventDefault();
    const principal = document.getElementById('conteudo-principal');
    if (principal) principal.focus();
  }

  render() {
    const valor = {
      usuario: this.state.usuario,
      perfil: this.state.perfil,
      tema: this.state.tema,
      entrar: this.entrar,
      sair: this.sair,
      alternarTema: this.alternarTema,
    };
    return (
      <SessaoContext.Provider value={valor}>
        <a className="visually-hidden-focusable" href="#conteudo-principal" onClick={this.irParaConteudo}>Pular para o conteúdo</a>
        <Navbar />
        <main id="conteudo-principal" tabIndex="-1" className="container py-4">
          <ErrorBoundary>
            {this.state.carregando ? <p className="text-body-secondary" role="status">Carregando…</p> : <Roteador />}
          </ErrorBoundary>
        </main>
      </SessaoContext.Provider>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

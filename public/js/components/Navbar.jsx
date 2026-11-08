const LINKS_POR_PERFIL = {
  secretaria: [
    { hash: '#/admin/disciplinas', texto: 'Disciplinas', icone: 'bi-journal-bookmark' },
    { hash: '#/admin/professores', texto: 'Professores', icone: 'bi-person-workspace' },
    { hash: '#/admin/turmas', texto: 'Ofertas', icone: 'bi-calendar3' },
    { hash: '#/admin/alocacao', texto: 'Alocação', icone: 'bi-bar-chart-steps' },
    { hash: '#/admin/solicitacoes', texto: 'Solicitações', icone: 'bi-inbox' },
  ],
  aluno: [
    { hash: '#/aluno/ofertas', texto: 'Matrícula', icone: 'bi-pencil-square' },
    { hash: '#/aluno/grade', texto: 'Minha grade', icone: 'bi-table' },
  ],
};

// Classe porque acompanha o hash (rota ativa) e o menu recolhido do celular.
class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { caminho: window.location.hash, menuAberto: false };
    this.aoMudarHash = this.aoMudarHash.bind(this);
    this.alternarMenu = this.alternarMenu.bind(this);
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.aoMudarHash);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.aoMudarHash);
  }

  aoMudarHash() {
    this.setState({ caminho: window.location.hash, menuAberto: false });
  }

  alternarMenu() {
    this.setState((estado) => ({ menuAberto: !estado.menuAberto }));
  }

  render() {
    return (
      <SessaoContext.Consumer>
        {(sessao) => {
          const links = sessao.usuario ? LINKS_POR_PERFIL[sessao.perfil] || [] : [];
          return (
            <nav className="navbar navbar-expand-lg navbar-marca no-print" aria-label="Navegação principal">
              <div className="container">
                <a className="navbar-brand" href={sessao.usuario ? paginaInicialDoPerfil(sessao.perfil) : '#/login'}>
                  <Logo />
                </a>
                {/* No celular o menu fica recolhido (e só existe logado); o tema precisa estar sempre à vista. */}
                <div className="ms-auto me-2 d-lg-none">
                  <button type="button" className="btn btn-outline-light" onClick={sessao.alternarTema}
                    aria-label={sessao.tema === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}>
                    <i className={'bi ' + (sessao.tema === 'light' ? 'bi-moon-stars' : 'bi-sun')} aria-hidden="true"></i>
                  </button>
                </div>
                {sessao.usuario && (
                  <button className="navbar-toggler" type="button" aria-controls="menu-principal"
                    aria-expanded={this.state.menuAberto} aria-label="Abrir menu" onClick={this.alternarMenu}>
                    <span className="navbar-toggler-icon"></span>
                  </button>
                )}
                <div id="menu-principal" className={'collapse navbar-collapse' + (this.state.menuAberto ? ' show' : '')}>
                  <ul className="navbar-nav me-auto">
                    {links.map((l) => (
                      <li className="nav-item" key={l.hash}>
                        <a className={'nav-link gap-1' + (this.state.caminho === l.hash ? ' active' : '')}
                          href={l.hash} aria-current={this.state.caminho === l.hash ? 'page' : undefined}>
                          <i className={'bi ' + l.icone} aria-hidden="true"></i>{l.texto}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {sessao.usuario && (
                      sessao.perfil === 'aluno' ? (
                        <a className={'nav-link gap-1 me-2' + (this.state.caminho === '#/aluno/perfil' ? ' active' : '')} href="#/aluno/perfil"
                          aria-current={this.state.caminho === '#/aluno/perfil' ? 'page' : undefined} title="Editar meu cadastro">
                          <i className="bi bi-person-circle" aria-hidden="true"></i>{sessao.usuario.nome}
                        </a>
                      ) : (
                        <span className="navbar-text me-2">
                          <i className="bi bi-person-circle me-1" aria-hidden="true"></i>{sessao.usuario.nome}
                        </span>
                      )
                    )}
                    <button type="button" className="btn btn-outline-light d-none d-lg-inline-flex" onClick={sessao.alternarTema}
                      aria-label={sessao.tema === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}>
                      <i className={'bi ' + (sessao.tema === 'light' ? 'bi-moon-stars' : 'bi-sun')} aria-hidden="true"></i>
                    </button>
                    {sessao.usuario && (
                      <button type="button" className="btn btn-light" onClick={sessao.sair}>
                        <i className="bi bi-box-arrow-right me-1" aria-hidden="true"></i>Sair
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </nav>
          );
        }}
      </SessaoContext.Consumer>
    );
  }
}

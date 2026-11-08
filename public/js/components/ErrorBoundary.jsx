// Única classe "de infraestrutura": só classe consegue capturar erros de renderização dos filhos.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
    this.tentarNovamente = this.tentarNovamente.bind(this);
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error('Erro de renderização:', erro, info.componentStack);
  }

  tentarNovamente() {
    this.setState({ erro: null });
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="container py-5">
        <div className="card border-danger" role="alert">
          <div className="card-body text-center">
            <i className="bi bi-exclamation-octagon display-5 text-danger" aria-hidden="true"></i>
            <h2 className="h5 mt-2">Algo deu errado nesta tela</h2>
            <p className="text-body-secondary">O restante do sistema continua funcionando.</p>
            <button type="button" className="btn btn-primary" onClick={this.tentarNovamente}>Tentar novamente</button>
          </div>
        </div>
      </div>
    );
  }
}

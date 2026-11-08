// Roteador por hash (sem react-router, que não foi estudado).
const ROTAS = {
  '#/login': { pagina: Login, perfil: null },
  '#/cadastro': { pagina: Cadastro, perfil: null },
  '#/admin/disciplinas': { pagina: AdminDisciplinas, perfil: 'secretaria' },
  '#/admin/professores': { pagina: AdminProfessores, perfil: 'secretaria' },
  '#/admin/turmas': { pagina: AdminTurmas, perfil: 'secretaria' },
  '#/admin/alocacao': { pagina: AdminAlocacao, perfil: 'secretaria' },
  '#/aluno/ofertas': { pagina: AlunoOfertas, perfil: 'aluno' },
  '#/aluno/grade': { pagina: AlunoGrade, perfil: 'aluno' },
  '#/aluno/perfil': { pagina: AlunoPerfil, perfil: 'aluno' },
  '#/admin/solicitacoes': { pagina: AdminSolicitacoes, perfil: 'secretaria' },
};

class Roteador extends React.Component {
  static contextType = SessaoContext;

  constructor(props) {
    super(props);
    this.state = { caminho: window.location.hash };
    this.aoMudarHash = this.aoMudarHash.bind(this);
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.aoMudarHash);
    this.redirecionarSePreciso();
  }

  componentDidUpdate() {
    this.redirecionarSePreciso();
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.aoMudarHash);
  }

  aoMudarHash() {
    this.setState({ caminho: window.location.hash });
  }

  // Para onde esta rota deve ir, ou null se pode ser exibida como está.
  destino() {
    const { usuario, perfil } = this.context;
    const rota = ROTAS[this.state.caminho];
    if (!usuario) return ['#/login', '#/cadastro'].includes(this.state.caminho) ? null : '#/login';
    if (['', '#/login', '#/cadastro'].includes(this.state.caminho)) return paginaInicialDoPerfil(perfil);
    if (rota && rota.perfil && rota.perfil !== perfil) return paginaInicialDoPerfil(perfil);
    return null;
  }

  // Efeito colateral fora do render; condicional, então não gera laço.
  redirecionarSePreciso() {
    const destino = this.destino();
    if (destino) window.location.replace(destino);
  }

  render() {
    if (this.destino()) return null;
    const rota = ROTAS[this.state.caminho];
    const Pagina = rota ? rota.pagina : NaoEncontrada;
    return <Pagina key={this.state.caminho} />;
  }
}

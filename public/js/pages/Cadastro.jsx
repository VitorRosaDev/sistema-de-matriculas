const FORM_CADASTRO_VAZIO = { nome: '', endereco: '', dataNascimento: '', email: '', telefone: '', senha: '', confirmarSenha: '' };

// Primeiro acesso do aluno: cria o cadastro e mostra a matrícula gerada.
class Cadastro extends React.Component {
  constructor(props) {
    super(props);
    this.state = { form: { ...FORM_CADASTRO_VAZIO }, erros: {}, erro: '', enviando: false, criado: null };
    this.aoAlterar = this.aoAlterar.bind(this);
    this.aoEnviar = this.aoEnviar.bind(this);
  }

  aoAlterar(event) {
    const { name, value } = event.target;
    this.setState((estado) => ({ form: { ...estado.form, [name]: name === 'telefone' ? Formatos.telefone(value) : value } }));
  }

  aoEnviar(event) {
    event.preventDefault();
    const f = this.state.form;
    const dados = { nome: f.nome.trim(), endereco: f.endereco.trim(), dataNascimento: f.dataNascimento, email: f.email.trim(), telefone: f.telefone, senha: f.senha };
    const erros = Validacao.validarCadastro(dados);
    if (f.senha !== f.confirmarSenha) erros.confirmarSenha = 'As senhas não são iguais.';
    this.setState({ erros, erro: '' });
    if (Validacao.temErros(erros)) return;

    this.setState({ enviando: true });
    Api.cadastrarAluno(dados)
      .then((resposta) => this.setState({ criado: resposta, form: { ...FORM_CADASTRO_VAZIO } }))
      .catch((e) => this.setState({ erro: e.message }))
      .finally(() => this.setState({ enviando: false }));
  }

  render() {
    const { form, erros, erro, enviando, criado } = this.state;

    if (criado) {
      return (
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card border-success shadow-sm" role="status">
              <div className="card-body p-4 text-center">
                <i className="bi bi-check-circle-fill display-4 text-success" aria-hidden="true"></i>
                <h1 className="h4 mt-2">Cadastro concluído, {criado.nome.split(' ')[0]}!</h1>
                <p className="mb-1">Anote o número da sua matrícula:</p>
                <p className="display-4 fw-bold text-success my-2" aria-label={'Matrícula ' + criado.matricula.split('').join(' ')}>{criado.matricula}</p>
                <div className="alert alert-warning text-start" role="alert">
                  <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
                  Para entrar, use este número <strong>ou o e-mail</strong> que você informou, junto com a senha que acabou de criar. Guarde a matrícula: ela também identifica você no atendimento.
                </div>
                <a href="#/login" className="btn btn-primary btn-lg">Ir para o login</a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h1 className="h4 titulo-pagina mb-1">Primeiro acesso</h1>
              <p className="text-body-secondary">Preencha seus dados para criar o cadastro de aluno. Ao final, você receberá o número da matrícula; o login poderá ser feito com ela ou com o e-mail informado aqui.</p>
              <Alerta tipo="danger" mensagem={erro} onFechar={() => this.setState({ erro: '' })} />

              <form onSubmit={this.aoEnviar} noValidate>
                <Campo id="nome" rotulo="Nome completo" erro={erros.nome}>
                  {(p) => <input {...p} name="nome" autoComplete="name" value={form.nome} onChange={this.aoAlterar} />}
                </Campo>
                <Campo id="endereco" rotulo="Endereço" erro={erros.endereco} ajuda="Rua, número, bairro e cidade.">
                  {(p) => <input {...p} name="endereco" autoComplete="street-address" value={form.endereco} onChange={this.aoAlterar} />}
                </Campo>
                <div className="row">
                  <Campo id="dataNascimento" rotulo="Data de nascimento" erro={erros.dataNascimento} className="col-md-6 mb-3">
                    {(p) => <input {...p} name="dataNascimento" type="date" autoComplete="bday" value={form.dataNascimento} onChange={this.aoAlterar} />}
                  </Campo>
                  <Campo id="telefone" rotulo="Celular" erro={erros.telefone} className="col-md-6 mb-3">
                    {(p) => <input {...p} name="telefone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(51) 91234-5678" value={form.telefone} onChange={this.aoAlterar} />}
                  </Campo>
                </div>
                <Campo id="email" rotulo="E-mail" erro={erros.email}>
                  {(p) => <input {...p} name="email" type="email" autoComplete="email" value={form.email} onChange={this.aoAlterar} />}
                </Campo>
                <div className="row">
                  <Campo id="senha" rotulo="Senha" erro={erros.senha} ajuda="Mínimo de 8 caracteres, com letras e números." className="col-md-6 mb-3">
                    {(p) => <input {...p} name="senha" type="password" autoComplete="new-password" value={form.senha} onChange={this.aoAlterar} />}
                  </Campo>
                  <Campo id="confirmarSenha" rotulo="Confirmar senha" erro={erros.confirmarSenha} className="col-md-6 mb-3">
                    {(p) => <input {...p} name="confirmarSenha" type="password" autoComplete="new-password" value={form.confirmarSenha} onChange={this.aoAlterar} />}
                  </Campo>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button type="submit" className="btn btn-primary flex-grow-1" disabled={enviando}>{enviando ? 'Cadastrando…' : 'Criar cadastro'}</button>
                  <a href="#/login" className="btn btn-outline-secondary">Voltar ao login</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

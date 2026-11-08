// Avisos de erro e de sucesso no topo das páginas.
// Convenção das páginas que usam este arquivo: o state tem `erro` e `sucesso` (texto) e a classe tem `carregar()`,
// que busca de novo os dados da tela e devolve uma Promise.
function Avisos(props) {
  return (
    <React.Fragment>
      <Alerta tipo="danger" mensagem={props.erro} onFechar={() => props.aoFechar('erro')} />
      <Alerta tipo="success" mensagem={props.sucesso} onFechar={() => props.aoFechar('sucesso')} />
    </React.Fragment>
  );
}

// O ciclo que toda ação de página repete: limpa os avisos → espera a API → mostra o sucesso e recarrega a tela,
// ou mostra o erro. É composição (uma função que recebe a página), não herança: as páginas continuam
// estendendo React.Component diretamente.
// `sucesso` é a mensagem, ou uma função que recebe a resposta da API e devolve a mensagem ou um objeto
// de estado com `sucesso` (para, por exemplo, limpar o formulário no mesmo setState).
function executarAcao(pagina, promessa, sucesso) {
  pagina.setState({ erro: '', sucesso: '' });
  return promessa
    .then((resposta) => {
      const r = typeof sucesso === 'function' ? sucesso(resposta) : sucesso;
      pagina.setState(typeof r === 'string' ? { sucesso: r } : r);
      return pagina.carregar();
    })
    .catch((e) => pagina.setState({ erro: e.message }));
}

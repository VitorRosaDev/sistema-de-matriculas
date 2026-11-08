function NaoEncontrada() {
  return (
    <SessaoContext.Consumer>
      {(sessao) => (
        <EstadoVazio icone="bi-signpost-split" titulo="Página não encontrada"
          texto={<a href={sessao.perfil ? paginaInicialDoPerfil(sessao.perfil) : '#/login'}>Voltar para o início</a>} />
      )}
    </SessaoContext.Consumer>
  );
}

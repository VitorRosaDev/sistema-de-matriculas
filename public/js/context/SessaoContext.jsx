// Contexto global da sessão (usuário, perfil e tema). O App fornece o valor; Navbar, Roteador e páginas consomem.
const SessaoContext = React.createContext({
  usuario: null,
  perfil: null,
  tema: 'light',
  entrar() {},
  sair() {},
  alternarTema() {},
});

function paginaInicialDoPerfil(perfil) {
  return perfil === 'secretaria' ? '#/admin/turmas' : '#/aluno/ofertas';
}

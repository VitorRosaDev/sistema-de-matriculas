// Rótulos das solicitações de alteração, usados pelo aluno (AlunoPerfil) e pela secretaria (AdminSolicitacoes).
// Ficam aqui, e não dentro de uma das páginas, para nenhuma página depender da ordem de carga da outra.
const ROTULO_CAMPO = { nome: 'Nome', dataNascimento: 'Data de nascimento' };
const ROTULO_STATUS = { pendente: 'Aguardando a secretaria', aprovada: 'Aprovada', recusada: 'Recusada' };
const COR_STATUS = { pendente: 'warning text-dark', aprovada: 'success', recusada: 'danger' };

function StatusSolicitacao(props) {
  return <span className={'badge text-bg-' + COR_STATUS[props.status]}>{ROTULO_STATUS[props.status]}</span>;
}

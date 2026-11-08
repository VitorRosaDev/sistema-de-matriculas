function Alerta(props) {
  if (!props.mensagem) return null;
  return (
    <div className={'alert alert-' + props.tipo + ' alert-dismissible d-flex align-items-start'} role="alert">
      <div className="flex-grow-1">{props.mensagem}</div>
      {props.onFechar && (
        <button type="button" className="btn-close" aria-label="Fechar aviso" onClick={props.onFechar}></button>
      )}
    </div>
  );
}

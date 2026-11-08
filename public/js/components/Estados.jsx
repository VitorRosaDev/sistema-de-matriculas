function Carregando(props) {
  return (
    <div className="text-center py-5" role="status">
      <div className="spinner-border text-primary" aria-hidden="true"></div>
      <p className="mt-2 mb-0 text-body-secondary">{props.texto || 'Carregando…'}</p>
    </div>
  );
}

function EstadoVazio(props) {
  return (
    <div className="text-center py-5 text-body-secondary">
      <i className={'bi ' + (props.icone || 'bi-inbox') + ' display-5 d-block mb-2'} aria-hidden="true"></i>
      <p className="mb-1 fw-semibold">{props.titulo}</p>
      {props.texto && <p className="mb-0">{props.texto}</p>}
    </div>
  );
}

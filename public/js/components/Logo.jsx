function Logo(props) {
  return (
    <span className="d-inline-flex align-items-center gap-2">
      <i className="bi bi-mortarboard-fill fs-4" aria-hidden="true"></i>
      <span className="fw-semibold">{props.titulo || 'Sistema de Matrículas'}</span>
    </span>
  );
}

// Cabeçalho padrão de toda página interna.
function TituloPagina(props) {
  return (
    <header className="mb-4">
      <h1 className="h3 titulo-pagina d-flex align-items-center gap-2">
        <i className={'bi ' + props.icone} aria-hidden="true"></i>
        {props.titulo}
      </h1>
      {props.subtitulo && <p className="text-body-secondary mb-0">{props.subtitulo}</p>}
    </header>
  );
}

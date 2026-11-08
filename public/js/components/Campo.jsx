// Rótulo + controle + mensagem de erro, ligados por id/aria (acessibilidade dos formulários).
// props: id, rotulo, erro, ajuda, children (função que recebe as props do controle)
function Campo(props) {
  const idErro = props.id + '-erro';
  const idAjuda = props.id + '-ajuda';
  const descritores = [props.erro ? idErro : null, props.ajuda ? idAjuda : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={props.className || 'mb-3'}>
      <label htmlFor={props.id} className="form-label">{props.rotulo}</label>
      {props.children({
        id: props.id,
        className: (props.classeControle || 'form-control') + (props.erro ? ' is-invalid' : ''),
        'aria-invalid': props.erro ? 'true' : undefined,
        'aria-describedby': descritores,
      })}
      {props.ajuda && <div id={idAjuda} className="form-text">{props.ajuda}</div>}
      {props.erro && <div id={idErro} className="invalid-feedback">{props.erro}</div>}
    </div>
  );
}

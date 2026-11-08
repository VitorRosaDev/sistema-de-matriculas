function BarraCarga(props) {
  const pct = props.maxima ? Math.min(100, Math.round((props.carga / props.maxima) * 100)) : 0;
  const cor = pct >= 100 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success';
  return (
    <div>
      <div className="progress" style={{ height: '1rem' }}>
        <div className={'progress-bar ' + cor} role="progressbar" style={{ width: pct + '%' }}
          aria-valuenow={props.carga} aria-valuemin="0" aria-valuemax={props.maxima}
          aria-label={'Carga: ' + props.carga + ' de ' + props.maxima + ' turmas'}></div>
      </div>
      <small className="text-body-secondary">{props.carga}/{props.maxima} turmas</small>
    </div>
  );
}

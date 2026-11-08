// Card de turma na visão do aluno. props: turma, avaliacao, matriculado, aberto, onAlternar, onMatricular, enviando
function CardTurma(props) {
  const t = props.turma;
  const a = props.avaliacao;
  const livres = t.vagas - t.ocupadas;
  const cheio = livres <= 0;
  const corVagas = cheio ? 'danger' : t.ocupadas / t.vagas >= 0.75 ? 'warning text-dark' : 'success';
  const idDetalhes = 'detalhes-' + t.id;
  const bloqueada = !a.podeMatricular && !props.matriculado;

  return (
    <div className={'card card-turma mb-3' + (bloqueada ? ' bloqueada' : '')}>
      <button type="button" className="cabecalho-turma" aria-expanded={props.aberto} aria-controls={props.aberto ? idDetalhes : undefined}
        onClick={() => props.onAlternar(t.id)}>
        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <div>
            <div className="fw-semibold">{t.disciplina.codigo} — {t.disciplina.nome}</div>
            <div className="text-body-secondary small">
              <i className="bi bi-clock me-1" aria-hidden="true"></i>{t.horarioTexto} ·
              <i className="bi bi-person ms-2 me-1" aria-hidden="true"></i>{t.professor ? t.professor.nome : '—'}
            </div>
          </div>
          <div className="d-flex gap-1 flex-wrap">
            {props.matriculado && <span className="badge text-bg-primary">Matriculado</span>}
            {t.status === 'fechada' && <span className="badge text-bg-secondary">Fechada</span>}
            <span className={'badge text-bg-' + corVagas}>{cheio ? 'Lotada' : livres + ' vaga' + (livres === 1 ? '' : 's')}</span>
          </div>
        </div>
      </button>

      {props.aberto && (
        <div id={idDetalhes} className="px-3 pb-3">
          <dl className="row mb-2 small">
            <dt className="col-5 col-sm-3">Código</dt><dd className="col-7 col-sm-9">{t.codigo}</dd>
            <dt className="col-5 col-sm-3">Carga horária</dt><dd className="col-7 col-sm-9">{t.disciplina.cargaHoraria} h</dd>
            <dt className="col-5 col-sm-3">Pré-requisitos</dt>
            <dd className="col-7 col-sm-9">{t.disciplina.preRequisitos.length ? t.disciplina.preRequisitos.join(', ') : 'Nenhum'}</dd>
            <dt className="col-5 col-sm-3">Ocupação</dt><dd className="col-7 col-sm-9">{t.ocupadas}/{t.vagas}</dd>
          </dl>
        </div>
      )}

      <div className="px-3 pb-3">
        {bloqueada && (
          <ul className="small text-danger-emphasis mb-2 ps-3">
            {a.motivos.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}
        {!props.matriculado && (
          <button type="button" className="btn btn-primary" disabled={!a.podeMatricular || props.enviando}
            onClick={(event) => { event.stopPropagation(); props.onMatricular(t); }}>
            <i className="bi bi-check2-circle me-1" aria-hidden="true"></i>Matricular
          </button>
        )}
      </div>
    </div>
  );
}

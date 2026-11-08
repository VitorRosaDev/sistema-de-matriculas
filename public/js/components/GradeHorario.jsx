// Grade dia × turno. Tabela no desktop; no celular vira lista agrupada por dia.
// props: turmas, renderizarTurma(turma) → conteúdo da célula
function GradeHorario(props) {
  const codigos = Horario.todosCodigos();
  const dias = Object.keys(Horario.DIAS);
  const turnos = Object.keys(Horario.TURNOS);
  const daCelula = (codigo) => props.turmas.filter((t) => t.horario === codigo);

  return (
    <div>
      <div className="table-responsive d-none d-md-block">
        <table className="table table-bordered grade-horario">
          <caption className="visually-hidden">Grade de horários por dia da semana e turno</caption>
          <thead>
            <tr>
              <th scope="col">Turno</th>
              {dias.map((d) => <th scope="col" key={d}>{Horario.DIAS[d]}</th>)}
            </tr>
          </thead>
          <tbody>
            {turnos.map((t) => (
              <tr key={t}>
                <th scope="row">{Horario.TURNOS[t]}</th>
                {dias.map((d) => {
                  const turmas = daCelula(d + t);
                  return (
                    <td key={d + t}>
                      {turmas.length === 0
                        ? <span className="celula-vazia"><span aria-hidden="true">—</span><span className="visually-hidden">Sem turmas</span></span>
                        : turmas.map((turma) => <div className="item-grade" key={turma.id}>{props.renderizarTurma(turma)}</div>)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-md-none">
        {dias.map((d) => {
          const doDia = codigos.filter((c) => c.charAt(0) === d && daCelula(c).length > 0);
          if (doDia.length === 0) return null;
          return (
            <section key={d} className="mb-3">
              <h3 className="h6 border-bottom pb-1">{Horario.DIAS[d]}</h3>
              {doDia.map((c) => daCelula(c).map((turma) => (
                <div className="item-grade" key={turma.id}>
                  <div className="text-body-secondary small">{Horario.decodificar(c).turnoTexto}</div>
                  {props.renderizarTurma(turma)}
                </div>
              )))}
            </section>
          );
        })}
        {props.turmas.length === 0 && <p className="text-body-secondary">Nenhuma turma.</p>}
      </div>
    </div>
  );
}

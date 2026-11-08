// UMD: o mesmo arquivo roda no navegador (window.Horario) e no Node (require).
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Horario = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const DIAS = { 2: 'Segunda', 3: 'Terça', 4: 'Quarta', 5: 'Quinta', 6: 'Sexta', 7: 'Sábado' };
  const TURNOS = { 1: 'Manhã', 2: 'Tarde', 3: 'Noite' };
  const SEMESTRE_ATUAL = '2026/2';

  function decodificar(codigo) {
    const dia = String(codigo).charAt(0);
    const turno = String(codigo).charAt(1);
    if (!DIAS[dia] || !TURNOS[turno]) return null;
    return { dia, turno, diaTexto: DIAS[dia], turnoTexto: TURNOS[turno], texto: DIAS[dia] + ' — ' + TURNOS[turno] };
  }

  function textoDoHorario(codigo) {
    const d = decodificar(codigo);
    return d ? d.texto : String(codigo);
  }

  // Ordem: por dia e, dentro do dia, por turno.
  function todosCodigos() {
    const lista = [];
    Object.keys(DIAS).forEach((d) => Object.keys(TURNOS).forEach((t) => lista.push(d + t)));
    return lista;
  }

  return { DIAS, TURNOS, SEMESTRE_ATUAL, decodificar, textoDoHorario, todosCodigos };
});

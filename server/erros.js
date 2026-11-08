class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

// `erros` é o objeto { campo: mensagem } de shared/validacao.js. Se não estiver vazio, a requisição para com 400.
function exigirValido(erros) {
  const mensagens = Object.values(erros);
  if (mensagens.length) throw new ErroHttp(400, mensagens.join(' '));
}

function naoEncontradoApi(req, res, next) {
  next(new ErroHttp(404, 'Rota não encontrada.'));
}

// Express 5 repassa para cá também as exceções de handlers async.
// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
  if (err instanceof ErroHttp) return res.status(err.status).json({ erro: err.message });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
  // Erros do body-parser (corpo grande demais, charset inválido...) já trazem um status 4xx próprio.
  if (err && err.expose && err.status >= 400 && err.status < 500) return res.status(err.status).json({ erro: 'Requisição inválida.' });
  console.error(err); // detalhes só no log do servidor
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { ErroHttp, exigirValido, naoEncontradoApi, tratarErros };

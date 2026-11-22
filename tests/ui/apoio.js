// Apoio dos testes de interface: login pela tela e limpeza pela API, para o banco voltar ao estado do seed.
const { request } = require('@playwright/test');

const SEMESTRE = '2026/2';
const SECRETARIA = { perfil: 'secretaria', usuario: 'secretaria', senha: 'unisinos' };
const aluno = (matricula) => ({ perfil: 'aluno', identificador: matricula, senha: 'senha123' });

// Preenche o formulário de login como um usuário faria. `secretaria` troca a aba antes.
async function entrarPelaTela(page, credenciais) {
  await page.goto('/#/login');
  if (credenciais.perfil === 'secretaria') {
    await page.getByRole('button', { name: 'Secretaria', exact: true }).click();
    await page.getByLabel('Usuário').fill(credenciais.usuario);
  } else {
    await page.getByLabel('Matrícula ou e-mail').fill(credenciais.identificador);
  }
  await page.getByLabel('Senha').fill(credenciais.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

// Sessão própria na API (cookie num contexto separado do navegador), usada só para limpar.
async function apiAutenticada(baseURL, credenciais) {
  const api = await request.newContext({ baseURL });
  const r = await api.post('/api/login', { data: credenciais });
  if (!r.ok()) throw new Error('Limpeza: login falhou (' + r.status() + ').');
  return api;
}

async function removerTurmas(baseURL, codigos) {
  const api = await apiAutenticada(baseURL, SECRETARIA);
  const turmas = await (await api.get('/api/turmas?semestre=' + encodeURIComponent(SEMESTRE))).json();
  for (const t of turmas.filter((x) => codigos.includes(x.codigo))) await api.delete('/api/turmas/' + t.id);
  await api.dispose();
}

async function cancelarMatriculas(baseURL, matricula, codigosDeTurma) {
  const api = await apiAutenticada(baseURL, aluno(matricula));
  const minhas = await (await api.get('/api/alunos/' + matricula + '/matriculas')).json();
  for (const m of minhas.filter((x) => codigosDeTurma.includes(x.turma.codigo))) await api.delete('/api/matriculas/' + m.id);
  await api.dispose();
}

module.exports = { SECRETARIA, aluno, entrarPelaTela, removerTurmas, cancelarMatriculas };

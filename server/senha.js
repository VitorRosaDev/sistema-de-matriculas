// Senhas nunca são guardadas em texto: scrypt (nativo do Node) com sal aleatório por aluno.
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

function gerar(senha) {
  const sal = crypto.randomBytes(16).toString('hex');
  return { senhaSal: sal, senhaHash: crypto.scryptSync(senha, sal, 64).toString('hex') };
}

// Assíncrono: o scrypt roda fora da thread principal e não trava as outras requisições.
async function conferir(senha, aluno) {
  if (!aluno.senhaHash || !aluno.senhaSal) return false;
  const esperado = Buffer.from(aluno.senhaHash, 'hex');
  const calculado = await scrypt(String(senha), aluno.senhaSal, 64);
  return calculado.length === esperado.length && crypto.timingSafeEqual(calculado, esperado);
}

// Mesmo custo de uma conferência real, para a resposta não revelar se a conta existe (tempo).
async function conferirFalso(senha) {
  await scrypt(String(senha), 'sal-descartavel-0000000000000', 64);
  return false;
}

// O que pode sair da API: nunca o hash nem o sal.
function publico(aluno) {
  const { senhaHash, senhaSal, ...resto } = aluno;
  return resto;
}

module.exports = { gerar, conferir, conferirFalso, publico };

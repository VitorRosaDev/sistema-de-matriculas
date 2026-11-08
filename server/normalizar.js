// Limpeza dos campos de texto que chegam no corpo das requisições, antes da validação.
// O que não for string passa intacto: a validação (shared/validacao.js) recusa com 400, em vez de o servidor quebrar aqui.
const ehTexto = (v) => typeof v === 'string';

// Tira os espaços das pontas.
const aparar = (v) => (ehTexto(v) ? v.trim() : v);

// Tira os espaços das pontas e junta os repetidos ("Ana   Silva " → "Ana Silva"). Usado em nomes de pessoas.
const nome = (v) => (ehTexto(v) ? v.trim().replace(/\s+/g, ' ') : v);

// E-mail é guardado em minúsculas: a unicidade e o login por e-mail dependem disso.
const email = (v) => (ehTexto(v) ? v.trim().toLowerCase() : v);

module.exports = { aparar, nome, email };

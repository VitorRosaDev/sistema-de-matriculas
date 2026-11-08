const { db } = require('./firebase');

function docParaObjeto(doc) {
  const dados = doc.data();
  for (const k of Object.keys(dados)) {
    if (dados[k] && typeof dados[k].toDate === 'function') dados[k] = dados[k].toDate().toISOString();
  }
  return { id: doc.id, ...dados };
}

async function listar(colecao) {
  const snap = await db.collection(colecao).get();
  return snap.docs.map(docParaObjeto);
}

async function obter(colecao, id) {
  // O Firestore rejeita (e a API viraria 500) IDs com "/", "." e "..", ou no formato __nome__.
  if (!id || /\/|^\.\.?$|^__.*__$/.test(String(id))) return null;
  const doc = await db.collection(colecao).doc(String(id)).get();
  return doc.exists ? docParaObjeto(doc) : null;
}

async function buscarPor(colecao, campo, valor) {
  const snap = await db.collection(colecao).where(campo, '==', valor).get();
  return snap.docs.map(docParaObjeto);
}

async function criar(colecao, dados, id) {
  const ref = id ? db.collection(colecao).doc(String(id)) : db.collection(colecao).doc();
  await ref.set(dados);
  return obter(colecao, ref.id);
}

async function atualizar(colecao, id, dados) {
  await db.collection(colecao).doc(String(id)).update(dados);
  return obter(colecao, id);
}

async function remover(colecao, id) {
  await db.collection(colecao).doc(String(id)).delete();
}

module.exports = { docParaObjeto, listar, obter, buscarPor, criar, atualizar, remover };

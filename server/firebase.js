const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

let chave;
try {
  chave = require('../serviceAccountKey.json');
} catch (e) {
  console.error('serviceAccountKey.json não encontrado na raiz do projeto.');
  console.error('Veja a seção "Firebase" do README.md para gerar a sua chave.');
  process.exit(1);
}

initializeApp({ credential: cert(chave) });

module.exports = { db: getFirestore(), FieldValue, projectId: chave.project_id };

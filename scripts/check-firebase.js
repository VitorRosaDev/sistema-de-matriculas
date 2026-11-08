const { db, FieldValue, projectId } = require('../server/firebase');

(async () => {
  const ref = db.collection('_healthcheck').doc('ping');
  await ref.set({ em: FieldValue.serverTimestamp() });
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Documento não foi lido de volta');
  await ref.delete();
  console.log('OK — projeto ' + projectId);
})().catch((e) => {
  console.error('FALHOU:', e.message);
  process.exit(1);
});

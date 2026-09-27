import { randomUUID } from 'node:crypto';

const DEFAULT_COUNT = 5000;
const SEARCH_MARKER_STEP = 500;
const EMPTY_MARKS = {
  front: { cloze: [], emphasis: [] },
  back: { cloze: [], emphasis: [] },
  notes: { cloze: [], emphasis: [] },
};

function buildCard(deckId, index, now) {
  const marker = index % SEARCH_MARKER_STEP === 0 ? ' abacate' : '';
  return {
    id: randomUUID(),
    deckId,
    front: `Pergunta de teste número ${index}${marker}`,
    back: `Resposta de teste número ${index}`,
    notes: '',
    marks: EMPTY_MARKS,
    tags: [],
    due: now - index * 1000,
    stability: 5,
    difficulty: 5,
    elapsedDays: 1,
    scheduledDays: 1,
    learningSteps: 0,
    reps: 1,
    lapses: 0,
    state: 2,
    createdAt: now - index * 1000,
    updatedAt: now,
    deletedAt: 0,
    dirty: 1,
  };
}

function buildScript(deckId, count) {
  const now = Date.now();
  const cards = Array.from({ length: count }, (_, i) => buildCard(deckId, i, now));
  return `
(async () => {
  const cards = ${JSON.stringify(cards)};
  const req = indexedDB.open('certamecards');
  return await new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('cards', 'readwrite');
      const store = tx.objectStore('cards');
      cards.forEach((card) => store.put(card));
      tx.oncomplete = () => resolve(cards.length + ' cartões semeados');
      tx.onerror = () => reject(String(tx.error));
    };
    req.onerror = () => reject(String(req.error));
  });
})();
`;
}

function main() {
  const [deckId, countArg] = process.argv.slice(2);
  if (!deckId) {
    console.error('Uso: node scripts/seed-cards.mjs <deckId> [quantidade=5000]');
    process.exitCode = 1;
    return;
  }
  const count = countArg ? Number(countArg) : DEFAULT_COUNT;
  process.stdout.write(buildScript(deckId, count));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}

export { buildScript };

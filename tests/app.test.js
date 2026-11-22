const test = require('node:test');
const assert = require('node:assert/strict');

const {
  etat,
  BARBE_GRISE_INDEX,
  calculerBonusAlliancesMutuelles,
  calculerScoresSelonMode,
  scoreSkullKing
} = require('../app.js');

test('Barbe Grise rapporte 20 points si le pari du joueur est exact', () => {
  const formData = {
    paris: [2, 1],
    plis: [2, 0],
    alliances: [[BARBE_GRISE_INDEX], []]
  };

  assert.deepEqual(calculerBonusAlliancesMutuelles(formData), [20, 0]);
});

test('Barbe Grise ne rapporte aucun point si le pari du joueur est incorrect', () => {
  const formData = {
    paris: [2, 1],
    plis: [1, 1],
    alliances: [[BARBE_GRISE_INDEX], []]
  };

  assert.deepEqual(calculerBonusAlliancesMutuelles(formData), [0, 0]);
});

test('Les alliances normales restent réciproques et valent 20 points', () => {
  const formData = {
    paris: [1, 2],
    plis: [1, 2],
    alliances: [[1], [0]]
  };

  assert.deepEqual(calculerBonusAlliancesMutuelles(formData), [20, 20]);
});

test('Le pari flambeur exact est appliqué au score Skull King', () => {
  etat.joueurs = ['Alice', 'Bob'];
  const formData = {
    paris: [1, 0],
    plis: [1, 0],
    bonus: [0, 0],
    alliances: [[], []],
    extraBets: [10, 0],
    bouletCanon: [false, false]
  };

  assert.deepEqual(calculerScoresSelonMode(formData, 'skullking', 1), [30, 10]);
});

test('Le score Skull King conserve son calcul de base', () => {
  assert.equal(scoreSkullKing(0, 0, 3, 0, 0, 0), 30);
  assert.equal(scoreSkullKing(2, 2, 2, 0, 0, 0), 40);
});

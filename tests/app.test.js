const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  etat,
  ajouterBarbeGriseAuxJoueurs,
  obtenirJoueursHumains,
  calculerBonusAlliancesMutuelles,
  calculerScoresSelonMode,
  scoreSkullKing
} = require('../app.js');

test('Barbe Grise est ajoutee comme troisieme joueur dans une partie a deux humains', () => {
  assert.deepEqual(
    ajouterBarbeGriseAuxJoueurs(['Alice', 'Bob']),
    ['Alice', 'Bob', 'Barbe Grise']
  );
});

test('Barbe Grise n est pas ajoutee dans une partie a trois joueurs humains', () => {
  assert.deepEqual(
    ajouterBarbeGriseAuxJoueurs(['Alice', 'Bob', 'Charlie']),
    ['Alice', 'Bob', 'Charlie']
  );
});

test('La sauvegarde conserve uniquement les joueurs humains', () => {
  assert.deepEqual(
    obtenirJoueursHumains(['Alice', 'Bob', 'Barbe Grise']),
    ['Alice', 'Bob']
  );
});

test('Barbe Grise participe au calcul comme un joueur virtuel complet', () => {
  etat.joueurs = ['Alice', 'Bob', 'Barbe Grise'];
  const formData = {
    paris: [1, 0, 1],
    plis: [1, 0, 1],
    bonus: [0, 0, 0],
    alliances: [[], [], []],
    extraBets: [0, 0, 0],
    bouletCanon: [false, false, false]
  };

  assert.deepEqual(calculerScoresSelonMode(formData, 'skullking', 2), [20, 20, 20]);
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

test('La mise en page contraint le panneau d édition à sa colonne', () => {
  const stylesheet = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

  assert.match(
    stylesheet,
    /\.app\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*380px\)\s+minmax\(0,\s*1fr\)/s
  );
  assert.match(stylesheet, /\.app > \*\s*\{[^}]*min-width:\s*0/s);
  assert.match(stylesheet, /\.controls\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(stylesheet, /\.controls button\s*\{[^}]*max-width:\s*100%/s);
  assert.match(stylesheet, /\.table-wrap\s*\{[^}]*overflow-x:\s*auto/s);
});

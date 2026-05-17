// --- État global du tableau ---
const etat = {
  joueurs: ['Alex', 'Cathy', 'Marion', 'Philippe'], // Valeur par défaut, remplacée dès la saisie
  totaux: [0, 0, 0, 0],
  manches: []
};

let affichageDoubleScores = false;

// Met à jour la liste des joueurs à partir du champ texte
function majJoueursDepuisChamp() {
  const brut = document.getElementById('playersInput').value.trim();
  const liste = brut.split(',').map(s => s.trim()).filter(Boolean);
  if (liste.length < 2 || liste.length > 20) {
    alert('Veuillez entrer 2 à 20 joueurs, séparés par des virgules.');
    return;
  }
  etat.joueurs = liste;
  etat.totaux = new Array(liste.length).fill(0);
  etat.manches = [];
  majEntetes();
  majTableau();
  majTotaux();
  champsPariPlis();
}

// Met à jour les entêtes du tableau des scores
function majEntetes() {
  // Recompose le thead dynamiquement (un joueur par colonne)
  const thead = document.querySelector('#resultsTable thead tr');
  thead.innerHTML = '<th>Manche</th>' + etat.joueurs.map((p, i) => `<th id="thP${i + 1}">${p}</th>`).join('');
}

// Met à jour le tableau des scores
function majTableau() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  const modeActuel = document.getElementById('modeScore').value;
  const cumulsModeActuel = new Array(etat.joueurs.length).fill(0);
  const cumulsSkullKing = new Array(etat.joueurs.length).fill(0);
  const cumulsRascal = new Array(etat.joueurs.length).fill(0);
  // Affichage en colonnes : chaque colonne = joueur, chaque ligne = manche
  for (let idx = 0; idx < etat.manches.length; idx++) {
    const manche = etat.manches[idx];
    const mancheNum = idx + 1;
    const dataManche = normaliserDonneesScore(manche);
    const scoresSkullKing = affichageDoubleScores ? calculerScoresSelonMode(dataManche, 'skullking', mancheNum) : null;
    const scoresRascal = affichageDoubleScores ? calculerScoresSelonMode(dataManche, 'rascal', mancheNum) : null;
    const tr = document.createElement('tr');
    const scoresMancheActuelle = modeActuel === 'rascal'
      ? (scoresRascal || manche.scores)
      : (scoresSkullKing || manche.scores);
    const totalMancheActuelle = scoresMancheActuelle.reduce((acc, val) => acc + val, 0);
    const totalMancheSkullKing = scoresSkullKing ? scoresSkullKing.reduce((acc, val) => acc + val, 0) : null;
    const totalMancheRascal = scoresRascal ? scoresRascal.reduce((acc, val) => acc + val, 0) : null;

    // Colonne 0 : numéro de manche
    const details = document.createElement('td');
    details.innerHTML = affichageDoubleScores
      ? `<span class="pill">${idx + 1}</span> <span class="pill">Total SK: ${totalMancheSkullKing}</span> <span class="pill">Total Rascal: ${totalMancheRascal}</span>`
      : `<span class="pill">${idx + 1}</span> <span class="pill">Total manche: ${totalMancheActuelle}</span>`;
    tr.appendChild(details);
    // Colonnes suivantes : score du joueur pour cette manche
    for (let i = 0; i < etat.joueurs.length; i++) {
      const td = document.createElement('td');
      let allianceInfo = '';
      if (manche.alliances && Array.isArray(manche.alliances[i])) {
        allianceInfo = manche.alliances[i]
          .filter(j => etat.joueurs[j])
          .map(j => `<span class="pill alliance">Allié: ${etat.joueurs[j]}</span>`)
          .join(' ');
      }
      // Affichage du pari supplémentaire si > 0
      let extraBetInfo = '';
      if (manche.extraBets && typeof manche.extraBets[i] !== 'undefined' && manche.extraBets[i] > 0) {
        extraBetInfo = `<span class="pill">Pari supp.: ${manche.extraBets[i]}</span>`;
      }
      let bouletCanonInfo = '';
      if (manche.bouletCanon && manche.bouletCanon[i]) {
        bouletCanonInfo = `<span class="pill">Boulet de canon</span>`;
      }
      const scoreActuel = modeActuel === 'rascal'
        ? (scoresRascal ? scoresRascal[i] : manche.scores[i])
        : (scoresSkullKing ? scoresSkullKing[i] : manche.scores[i]);
      if (affichageDoubleScores) {
        cumulsSkullKing[i] += scoresSkullKing[i];
        cumulsRascal[i] += scoresRascal[i];
      } else {
        cumulsModeActuel[i] += scoreActuel;
      }
      const scoreInfo = affichageDoubleScores
        ? `<span class="pill">Skull King: ${scoresSkullKing[i] > 0 ? '+' + scoresSkullKing[i] : scoresSkullKing[i]}</span> <span class="pill">Rascal: ${scoresRascal[i] > 0 ? '+' + scoresRascal[i] : scoresRascal[i]}</span> <span class="pill">Cumul SK: ${cumulsSkullKing[i] > 0 ? '+' + cumulsSkullKing[i] : cumulsSkullKing[i]}</span> <span class="pill">Cumul Rascal: ${cumulsRascal[i] > 0 ? '+' + cumulsRascal[i] : cumulsRascal[i]}</span>`
        : `<span class="pill">Score: ${scoreActuel > 0 ? '+' + scoreActuel : scoreActuel}</span> <span class="pill">Cumul: ${cumulsModeActuel[i] > 0 ? '+' + cumulsModeActuel[i] : cumulsModeActuel[i]}</span>`;
      td.innerHTML = `<span class="pill">Pari: ${manche.paris[i]}</span> <span class="pill">Plis: ${manche.plis[i]}</span> <span class="pill">Bonus: ${manche.bonus && typeof manche.bonus[i] !== 'undefined' ? manche.bonus[i] : 0}</span> ${extraBetInfo} ${bouletCanonInfo} ${allianceInfo} ${scoreInfo}`;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

// Met à jour les totaux de chaque joueur
function majTotaux() {
  const totalsWrap = document.getElementById('totals');
  if (affichageDoubleScores) {
    const totauxSkullKing = new Array(etat.joueurs.length).fill(0);
    const totauxRascal = new Array(etat.joueurs.length).fill(0);

    for (let idx = 0; idx < etat.manches.length; idx++) {
      const manche = etat.manches[idx];
      const mancheNum = idx + 1;
      const dataManche = normaliserDonneesScore(manche);
      const scoresSkullKing = calculerScoresSelonMode(dataManche, 'skullking', mancheNum);
      const scoresRascal = calculerScoresSelonMode(dataManche, 'rascal', mancheNum);

      for (let i = 0; i < etat.joueurs.length; i++) {
        totauxSkullKing[i] += scoresSkullKing[i];
        totauxRascal[i] += scoresRascal[i];
      }
    }

    totalsWrap.innerHTML = etat.joueurs.map((p, i) =>
      `<div class="total-box"><div class="sub">${p}</div><div>Skull King: ${totauxSkullKing[i]}</div><div>Rascal: ${totauxRascal[i]}</div></div>`
    ).join('');
    return;
  }

  totalsWrap.innerHTML = etat.joueurs.map((p, i) =>
    `<div class="total-box"><div class="sub">${p}</div><div id="tot${i + 1}">${etat.totaux[i]}</div></div>`
  ).join('');
}

// Ajoute une manche au tableau
function ajouterManche(manche) {
  etat.manches.push(manche);
  for (let i = 0; i < etat.totaux.length; i++) {
    etat.totaux[i] += manche.scores[i];
  }
  majTableau();
  majTotaux();
}

// Réinitialise le tableau des scores
function reinitialiserTout() {
  etat.manches = [];
  etat.totaux = new Array(etat.joueurs.length).fill(0);
  majTableau();
  majTotaux();
}

function selectionnerValeurInput(input) {
  requestAnimationFrame(() => {
    input.select();
  });
}

function configurerNavigationInputs(selecteur) {
  const inputs = Array.from(document.querySelectorAll(selecteur));

  inputs.forEach((input, index) => {
    input.addEventListener('focus', () => {
      selectionnerValeurInput(input);
    });

    input.addEventListener('click', () => {
      selectionnerValeurInput(input);
    });

    input.addEventListener('keydown', event => {
      if (event.key !== 'Tab') {
        return;
      }

      const direction = event.shiftKey ? -1 : 1;
      const nextInput = inputs[index + direction];

      if (!nextInput) {
        return;
      }

      event.preventDefault();
      nextInput.focus();
    });
  });
}

// Génère les champs de pari et plis pour chaque joueur et affiche la manche en cours
function champsPariPlis() {
  const container = document.getElementById('betsTricksFields');
  const mancheInfo = document.getElementById('mancheInfo');
  const numManche = etat.manches.length + 1;
  const maxManches = 10;
  const nbPlis = numManche;
  const mode = document.getElementById('modeScore').value;

  document.body.dataset.mode = mode;

  // Affichage du numéro de manche et du nombre de plis
  if (numManche > maxManches) {
    mancheInfo.textContent = `Partie terminée (maximum ${maxManches} manches).`;
    container.innerHTML = '';
    return;
  }

  mancheInfo.textContent = `Manche ${numManche} / ${maxManches} — ${nbPlis} pli${nbPlis > 1 ? 's' : ''}`;
  container.innerHTML = etat.joueurs.map((p, i) => {
    // Cases à cocher pour alliances multiples
    const checkboxes = etat.joueurs
      .map((nom, idx) => {
        if (idx === i) {
          return '';
        }
        return `<label class='alliance-label'><input type='checkbox' class='alliance-checkbox' data-joueur='${i}' value='${idx}' id='alliance_${i}_${idx}' /> ${nom}</label>`;
      }).join('');
    return `
    <div class="row joueur-block">
      <div class="player-heading">${p}</div>
      <div>
        <label for="bet_${i}">Pari</label>
        <input type="number" id="bet_${i}" min="0" max="${nbPlis}" value="0" class="input-small" />
      </div>
      <div>
        <label for="tricks_${i}">Plis remportés</label>
        <input type="number" id="tricks_${i}" min="0" max="${nbPlis}" value="0" class="input-small" />
      </div>
      <div>
        <label for="bonus_${i}">Bonus</label>
        <input type="number" id="bonus_${i}" value="0" class="input-small" />
      </div>
      
      <div>
        <label>Alliances</label>
        <div id="alliances_${i}">${checkboxes}</div>
      </div>
      <div>
        <label for="extra_bet_${i}">Pari supplémentaire</label>
        <input type="number" id="extra_bet_${i}" min="0" max="20" step="10" value="0" class="input-small" />
      </div>
      <div class="rascal-only">
        <label class="alliance-label">
          <input type="checkbox" id="boulet_canon_${i}" /> Boulet de canon
        </label>
      </div>
    </div>
    <hr class="joueur-separateur" />
    `;
  }).join('');

  configurerNavigationInputs('[id^="bet_"]');
  configurerNavigationInputs('[id^="tricks_"]');

  // Synchronisation automatique des alliances (cases à cocher réciproques)
  for (let i = 0; i < etat.joueurs.length; i++) {
    const checkboxes = document.querySelectorAll(`#alliances_${i} input[type=checkbox]`);
    checkboxes.forEach(cb => {
      cb.addEventListener('change', function () {
        const j = Number(cb.value);
        // Si on coche, on coche aussi la case réciproque
        const recip = document.getElementById(`alliance_${j}_${i}`);
        if (cb.checked) {
          if (recip && !recip.checked) {
            recip.checked = true;
          }
        } else if (recip && recip.checked) {
          recip.checked = false;
        }
      });
    });
  }
}

// Lit les valeurs des champs pari/plis
function lireFormulaire() {
  const paris = [];
  const plis = [];
  const bonus = [];
  const alliances = [];
  const extraBets = [];
  const bouletCanon = [];
  for (let i = 0; i < etat.joueurs.length; i++) {
    paris.push(Number(document.getElementById(`bet_${i}`).value));
    plis.push(Number(document.getElementById(`tricks_${i}`).value));
    bonus.push(Number(document.getElementById(`bonus_${i}`).value));
    extraBets.push(Number(document.getElementById(`extra_bet_${i}`).value));
    bouletCanon.push(Boolean(document.getElementById(`boulet_canon_${i}`)?.checked));
    // Récupère toutes les alliances cochées pour ce joueur
    const checked = Array.from(document.querySelectorAll(`#alliances_${i} input[type=checkbox]:checked`)).map(cb => Number(cb.value));
    alliances.push(checked);
  }
  return { paris, plis, bonus, alliances, extraBets, bouletCanon };
}

// Calcule le score Skull King pour un joueur en fonction du numéro de manche
// Règle Skull King : Pari correct = 20 points/plis. Pari incorrect = -10 points par écart. Pari 0 et 0 plis = 10 points * numéro de manche.
function scoreSkullKing(pari, plis, mancheNum) {
  if (pari === 0 && plis === 0) {
    return 10 * mancheNum;
  }
  if (pari === plis) {
    return 20 * plis;
  }
  return -10 * Math.abs(pari - plis);
}

// Calcule le score Rascal pour un joueur
// Règle Rascal corrigée :
// - Prédiction exacte : 10 pts/plis + bonus
// - 1 d'écart : moitié des points + moitié du bonus
// - Plus de 1 d'écart : 0 point, pas de bonus
function scoreRascal(pari, plis, nbPlis, bonus, allianceBonus) {
  const scoreMax = 10 * nbPlis;
  const ecart = Math.abs(pari - plis);
  if (ecart === 0) {
    // Mise exacte : bonus complet
    return scoreMax + bonus + allianceBonus;
  }
  if (ecart === 1) {
    // 1 d'écart : moitié des points + moitié du bonus
    return Math.floor(scoreMax / 2) + Math.floor(bonus / 2);
  }
  // Plus de 1 d'écart : 0 point, pas de bonus
  return 0;
}

function scoreBouletCanon(pari, plis) {
  return pari === plis ? 15 : 0;
}

function normaliserDonneesScore(source) {
  const taille = etat.joueurs.length;
  const paris = Array.isArray(source.paris) ? source.paris.slice(0, taille) : [];
  const plis = Array.isArray(source.plis) ? source.plis.slice(0, taille) : [];
  const bonus = Array.isArray(source.bonus) ? source.bonus.slice(0, taille) : [];
  const alliances = Array.isArray(source.alliances) ? source.alliances.slice(0, taille) : [];
  const extraBets = Array.isArray(source.extraBets) ? source.extraBets.slice(0, taille) : [];
  const bouletCanon = Array.isArray(source.bouletCanon) ? source.bouletCanon.slice(0, taille) : [];

  while (paris.length < taille) {
    paris.push(0);
  }
  while (plis.length < taille) {
    plis.push(0);
  }
  while (bonus.length < taille) {
    bonus.push(0);
  }
  while (alliances.length < taille) {
    alliances.push([]);
  }
  while (extraBets.length < taille) {
    extraBets.push(0);
  }
  while (bouletCanon.length < taille) {
    bouletCanon.push(false);
  }

  return { paris, plis, bonus, alliances, extraBets, bouletCanon };
}

function calculerScoresSelonMode(formData, mode, mancheNum) {
  const f = normaliserDonneesScore(formData);
  let scores;
  let alliancesBonus = new Array(f.paris.length).fill(0);
  let extraBetBonus = new Array(f.paris.length).fill(0);

  if (mode === 'skullking') {
    scores = f.paris.map((pari, i) => scoreSkullKing(pari, f.plis[i], mancheNum) + f.bonus[i]);
    const dejaCompte = new Set();
    for (let i = 0; i < f.paris.length; i++) {
      if (!Array.isArray(f.alliances[i])) {
        continue;
      }
      f.alliances[i].forEach(allyIdx => {
        if (allyIdx === i) {
          return;
        }
        const key = i < allyIdx ? `${i}-${allyIdx}` : `${allyIdx}-${i}`;
        if (dejaCompte.has(key)) {
          return;
        }
        if (Array.isArray(f.alliances[allyIdx]) && f.alliances[allyIdx].includes(i)) {
          if (f.paris[i] === f.plis[i] && f.paris[allyIdx] === f.plis[allyIdx]) {
            alliancesBonus[i] += 20;
            alliancesBonus[allyIdx] += 20;
            dejaCompte.add(key);
          }
        }
      });
    }
    for (let i = 0; i < f.paris.length; i++) {
      if (f.extraBets[i] > 0 && f.paris[i] === f.plis[i]) {
        extraBetBonus[i] = f.extraBets[i];
      }
    }
    return scores.map((s, i) => s + alliancesBonus[i] + extraBetBonus[i]);
  }

  const dejaCompte = new Set();
  for (let i = 0; i < f.paris.length; i++) {
    if (!Array.isArray(f.alliances[i])) {
      continue;
    }
    f.alliances[i].forEach(allyIdx => {
      if (allyIdx === i) {
        return;
      }
      const key = i < allyIdx ? `${i}-${allyIdx}` : `${allyIdx}-${i}`;
      if (dejaCompte.has(key)) {
        return;
      }
      if (Array.isArray(f.alliances[allyIdx]) && f.alliances[allyIdx].includes(i)) {
        if (f.paris[i] === f.plis[i] && f.paris[allyIdx] === f.plis[allyIdx]) {
          alliancesBonus[i] += 20;
          alliancesBonus[allyIdx] += 20;
          dejaCompte.add(key);
        }
      }
    });
  }

  scores = f.paris.map((pari, i) => {
    if (f.bouletCanon[i]) {
      return scoreBouletCanon(pari, f.plis[i]);
    }
    return scoreRascal(pari, f.plis[i], mancheNum, f.bonus[i], alliancesBonus[i]);
  });
  return scores;
}

// Calcule les scores de la manche courante selon le mode choisi
function calculerScores() {
  const f = normaliserDonneesScore(lireFormulaire());
  const mode = document.getElementById('modeScore').value;
  const mancheNum = etat.manches.length + 1;
  const scores = calculerScoresSelonMode(f, mode, mancheNum);
  return { paris: f.paris, plis: f.plis, bonus: f.bonus, alliances: f.alliances, extraBets: f.extraBets, scores };
}

// Met à jour la règle affichée selon le mode
function majRegleScore() {
  const mode = document.getElementById('modeScore').value;
  const regle = document.getElementById('regleScore');
  document.body.dataset.mode = mode;
  if (mode === 'skullking') {
    regle.textContent = "Si vous remportez le nombre exact de plis que vous avez annoncé, vous gagnez 20 points pour chaque pli réalisé. Si vous remportez plus ou moins de plis que prévu, vous perdez 10 points pour chaque pli de différence. Vous ne gagnez pas de points pour les plis réalisés pendant cette manche. Si votre mise est sur zéro et que vous ne remportez aucun pli, votre score est de 10 points multipliés par le nombre de cartes de cette manche.";
  } else {
    regle.textContent = 'Prédiction correcte : 10 pts + 5 pts/plis. Sinon : -5 pts par écart. Boulet de canon : 15 pts si la prédiction est exacte, sinon 0 pt.';
  }
}

// Initialisation
majEntetes();
majTotaux();
champsPariPlis();

// --- Événements UI ---
document.getElementById('playersInput').addEventListener('change', majJoueursDepuisChamp);
document.getElementById('modeScore').addEventListener('change', () => {
  majRegleScore();
});

document.getElementById('dualScoresBtn').addEventListener('click', () => {
  affichageDoubleScores = !affichageDoubleScores;
  document.getElementById('dualScoresBtn').textContent = affichageDoubleScores
    ? 'Masquer les 2 scores'
    : 'Voir les 2 scores';
  majTableau();
  majTotaux();
});

// Affiche un aperçu des scores calculés sans les ajouter au tableau
document.getElementById('calcBtn').addEventListener('click', () => {
  try {
    const mode = document.getElementById('modeScore').value;
    const f = normaliserDonneesScore(lireFormulaire());
    const mancheNum = etat.manches.length + 1;
    const c = {
      ...f,
      scores: calculerScoresSelonMode(f, mode, mancheNum)
    };
    const scoresSkullKing = affichageDoubleScores ? calculerScoresSelonMode(f, 'skullking', mancheNum) : null;
    const scoresRascal = affichageDoubleScores ? calculerScoresSelonMode(f, 'rascal', mancheNum) : null;
    // Affiche un aperçu temporaire en haut du tableau (sans l'ajouter)
    const tbody = document.getElementById('tbody');
    const preview = document.createElement('tr');
    preview.className = 'scores-row';
    const td0 = document.createElement('td');
    td0.innerHTML = '<strong>Aperçu</strong>';
    preview.appendChild(td0);
    for (let i = 0; i < etat.joueurs.length; i++) {
      const td = document.createElement('td');
      const scoreInfo = affichageDoubleScores
        ? `<span class="pill">Skull King: ${scoresSkullKing[i] > 0 ? '+' + scoresSkullKing[i] : scoresSkullKing[i]}</span> <span class="pill">Rascal: ${scoresRascal[i] > 0 ? '+' + scoresRascal[i] : scoresRascal[i]}</span>`
        : `<span class="pill">Score: ${c.scores[i] > 0 ? '+' + c.scores[i] : c.scores[i]}</span>`;
      td.innerHTML = `<span class="pill">Pari: ${c.paris[i]}</span> <span class="pill">Plis: ${c.plis[i]}</span> <span class="pill">Bonus: ${c.bonus[i]}</span> ${scoreInfo}`;
      preview.appendChild(td);
    }
    // Nettoie le dernier aperçu
    const lastPreview = document.querySelector('.scores-row');
    if (lastPreview) {
      lastPreview.remove();
    }
    tbody.prepend(preview);
  } catch (e) {
    alert(e.message);
  }
});

// Ajoute la manche au tableau et met à jour les totaux
document.getElementById('addRowBtn').addEventListener('click', () => {
  try {
    const maxManches = 10;
    if (etat.manches.length >= maxManches) {
      alert(`Vous avez déjà joué les ${maxManches} manches.`);
      return;
    }
    const c = calculerScores();
    const manche = {
      paris: c.paris,
      plis: c.plis,
      bonus: c.bonus,
      alliances: c.alliances,
      extraBets: c.extraBets,
      bouletCanon: c.bouletCanon,
      scores: c.scores
    };
    // Supprime l'aperçu si présent
    const lastPreview = document.querySelector('.scores-row');
    if (lastPreview) {
      lastPreview.remove();
    }
    ajouterManche(manche);
    champsPariPlis(); // Met à jour la manche suivante
  } catch (e) {
    alert(e.message);
  }
});

// Réinitialise le tableau et les totaux
document.getElementById('resetBtn').addEventListener('click', () => {
  reinitialiserTout();
  champsPariPlis();
});

// --- Sauvegarde et chargement de partie ---
document.getElementById('saveBtn').addEventListener('click', () => {
  const data = {
    joueurs: etat.joueurs,
    totaux: etat.totaux,
    manches: etat.manches,
    mode: document.getElementById('modeScore').value
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'skullking_partie.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
});

// Ouvre le sélecteur de fichier pour charger une partie
document.getElementById('loadBtn').addEventListener('click', () => {
  document.getElementById('loadInput').click();
});

// Charge une partie depuis un fichier JSON
document.getElementById('loadInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (!Array.isArray(data.joueurs) || !Array.isArray(data.totaux) || !Array.isArray(data.manches)) {
        alert('Fichier de partie invalide.');
        return;
      }
      etat.joueurs = data.joueurs;
      etat.totaux = data.totaux;
      etat.manches = data.manches;
      document.body.dataset.mode = document.getElementById('modeScore').value;
      // Restaure le mode de score si présent
      if (data.mode) {
        document.getElementById('modeScore').value = data.mode;
        majRegleScore();
      }
      majEntetes();
      majTableau();
      majTotaux();
      champsPariPlis();
    } catch (err) {
      alert('Erreur lors du chargement de la partie : ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

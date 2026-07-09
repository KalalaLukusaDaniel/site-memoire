// ==========================================================================
// SITE MÉMOIRE DE DANIEL — Thème Spider-Man: Brand New Day
// ==========================================================================
//
// ⚠️ IMPORTANT — CONFIGURATION GOOGLE SHEETS ⚠️
// Suis le fichier GUIDE-GOOGLE-SHEETS.md pour créer TON Google Sheet,
// puis colle ici l'URL de ton déploiement Apps Script (elle finit par /exec).
// Tant que tu ne l'as pas fait, les noms sont quand même sauvegardés
// dans le navigateur (localStorage) et exportables via la console secrète.
//
const GOOGLE_SHEET_URL = "COLLE_TON_URL_APPS_SCRIPT_ICI";

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // DOM ELEMENTS
  // ==========================================================================
  const form = document.getElementById('submission-form');
  const submitBtn = document.getElementById('submit-btn');

  const celebrationOverlay = document.getElementById('celebration-overlay');

  const adminTrigger = document.getElementById('admin-trigger');
  const adminOverlay = document.getElementById('admin-overlay');
  const closeAdminBtn = document.getElementById('close-admin-btn');
  const adminCount = document.getElementById('admin-count');
  const adminTableBody = document.getElementById('admin-table-body');

  const exportJsonBtn = document.getElementById('export-json-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const resetDataBtn = document.getElementById('reset-data-btn');

  // Load submissions from LocalStorage
  let submissions = JSON.parse(localStorage.getItem('memoire_daniel_submissions')) || [];

  // Couleurs des confettis : rouge & bleu Spidey + blanc + or
  const SPIDEY_COLORS = ['#e02434', '#1b3b9e', '#ffffff', '#f5c518'];

  // ==========================================================================
  // MUSIQUE DU SITE : "Brand New Day Song" (MP3, en boucle jusqu'au départ)
  // Les navigateurs bloquent le son 100% automatique, alors on contourne :
  //  1. On tente de lancer la musique dès le chargement (marche parfois).
  //  2. Sinon, elle démarre TOUTE SEULE à la première interaction du visiteur
  //     (un clic, une touche, un scroll, toucher l'écran... n'importe quoi).
  // Résultat : dès que la personne touche à la page, la musique part.
  // ==========================================================================
  const soundToggle = document.getElementById('sound-toggle');
  const siteMusic = document.getElementById('site-music');
  let soundOn = false;
  let autoStartDone = false;

  function setSoundUI(on) {
    soundToggle.textContent = (on ? '🔊' : '🔇') + ' Brand New Day Song';
    soundToggle.classList.toggle('is-on', on);
    soundToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function startMusic() {
    if (!siteMusic) return;
    siteMusic.volume = 0.65;
    const attempt = siteMusic.play();
    if (attempt && attempt.then) {
      attempt.then(() => {
        soundOn = true;
        autoStartDone = true;
        setSoundUI(true);
      }).catch(() => { /* bloqué par le navigateur : on attend une interaction */ });
    }
  }

  function stopMusic() {
    if (!siteMusic) return;
    siteMusic.pause();
    soundOn = false;
    setSoundUI(false);
  }

  // La vidéo de fond est muette : on s'assure qu'elle tourne bien
  const bgVideo = document.getElementById('trailer-bg');
  function ensureVideoPlays() {
    if (bgVideo && bgVideo.paused) {
      const p = bgVideo.play();
      if (p && p.catch) p.catch(() => {});
    }
  }
  ensureVideoPlays();

  // 1. Tentative directe au chargement (quelques secondes après, comme demandé)
  startMusic();
  setTimeout(() => { if (!soundOn) startMusic(); ensureVideoPlays(); }, 2500);

  // 2. Démarrage automatique à la première interaction, où que ce soit sur la page
  const autoStart = (e) => {
    // Le clic sur le bouton musique gère lui-même le son : on l'ignore ici
    ensureVideoPlays();
    if (e && e.target && e.target.closest && e.target.closest('#sound-toggle')) return;
    if (!autoStartDone && !soundOn) startMusic();
    if (autoStartDone || soundOn) {
      ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(evt =>
        document.removeEventListener(evt, autoStart));
    }
  };
  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(evt =>
    document.addEventListener(evt, autoStart, { passive: true }));

  // 3. Le bouton permet quand même de couper / relancer manuellement
  if (soundToggle) {
    soundToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      autoStartDone = true; // un choix manuel prime sur l'auto-démarrage
      if (soundOn) { stopMusic(); } else { startMusic(); }
    });
  }

  // ==========================================================================
  // FORM SUBMISSION & CELEBRATION (Spidey Graduation & Confetti)
  // ==========================================================================
  // --- Validation : Prénom et Nom obligatoires, Pseudo optionnel ---
  function setFieldError(field, message) {
    const group = document.getElementById('group-' + field);
    const errorEl = document.getElementById('error-' + field);
    if (message) {
      group.classList.add('has-error');
      if (errorEl) errorEl.textContent = message;
    } else {
      group.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
    }
  }

  // L'erreur disparaît dès que la personne se met à taper
  ['firstname', 'lastname'].forEach(field => {
    document.getElementById(field).addEventListener('input', () => setFieldError(field, ''));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get input values
    const firstname = document.getElementById('firstname').value.trim();
    const lastname = document.getElementById('lastname').value.trim();
    const nickname = document.getElementById('nickname').value.trim();

    // Vérification des champs obligatoires
    let valid = true;
    if (!firstname) {
      setFieldError('firstname', '🕸️ Oups ! Ton prénom est obligatoire pour figurer dans les remerciements.');
      valid = false;
    }
    if (!lastname) {
      setFieldError('lastname', '🕸️ Oups ! Ton nom est obligatoire pour figurer dans les remerciements.');
      valid = false;
    }
    if (!valid) {
      const firstInvalid = !firstname ? 'firstname' : 'lastname';
      document.getElementById(firstInvalid).focus();
      return;
    }

    // Create entry
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      firstname,
      lastname,
      nickname
    };

    // Save to array and local storage
    submissions.push(newEntry);
    localStorage.setItem('memoire_daniel_submissions', JSON.stringify(submissions));

    // Send data to Google Sheets API (no-cors + URL-encoded for cross-domain compatibility)
    if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.startsWith("COLLE_TON_URL")) {
      const formData = new URLSearchParams();
      formData.append("firstname", firstname);
      formData.append("lastname", lastname);
      formData.append("nickname", nickname);
      formData.append("date", newEntry.date);

      fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
      })
      .then(() => {
        console.log("Données envoyées vers Google Sheets avec succès !");
      })
      .catch(error => {
        console.error("Erreur lors de l'envoi vers Google Sheets, sauvegarde locale active.", error);
      });
    } else {
      console.warn("⚠️ Google Sheets non configuré : les données sont sauvegardées uniquement dans ce navigateur. Voir GUIDE-GOOGLE-SHEETS.md.");
    }

    // Trigger celebration effects
    triggerCelebration();

    // Reset Form
    form.reset();
  });

  // Sécurité : si la librairie confetti n'a pas chargé (CDN bloqué), on ne casse rien
  const fireConfetti = (opts) => { if (typeof confetti === 'function') confetti(opts); };

  function triggerCelebration() {
    // Show celebration overlay
    celebrationOverlay.classList.remove('hidden');
    celebrationOverlay.setAttribute('aria-hidden', 'false');

    // Confetti Fireworks (Multi-burst canvas confetti)
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1100, colors: SPIDEY_COLORS };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Confetti burst left and right
      fireConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      fireConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    // Initial big burst in center
    fireConfetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      zIndex: 1100,
      colors: SPIDEY_COLORS
    });

    // Hide celebration overlay after 4.5 seconds
    setTimeout(() => {
      celebrationOverlay.classList.add('hidden');
      celebrationOverlay.setAttribute('aria-hidden', 'true');
    }, 4500);
  }

  // ==========================================================================
  // SECRET ADMIN PANEL
  // ==========================================================================

  // Double-click on "remerciements" in the title opens the admin console
  adminTrigger.addEventListener('dblclick', () => {
    openAdminPanel();
  });

  function openAdminPanel() {
    updateAdminTable();
    adminOverlay.classList.remove('hidden');
    adminOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeAdminPanel() {
    adminOverlay.classList.add('hidden');
    adminOverlay.setAttribute('aria-hidden', 'true');
  }

  closeAdminBtn.addEventListener('click', closeAdminPanel);

  // Close overlay on click outside card
  adminOverlay.addEventListener('click', (e) => {
    if (e.target === adminOverlay) {
      closeAdminPanel();
    }
  });

  // Populate Admin Table with entries
  function updateAdminTable() {
    adminCount.textContent = submissions.length;
    adminTableBody.innerHTML = '';

    if (submissions.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="5" style="text-align: center; color: rgba(255,255,255,0.5); padding: 20px;">Aucune donnée enregistrée pour le moment.</td>`;
      adminTableBody.appendChild(emptyRow);
      return;
    }

    // Sort submissions: newest first
    const sortedSubmissions = [...submissions].reverse();

    sortedSubmissions.forEach((entry) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${entry.date}</td>
        <td>${escapeHtml(entry.firstname)}</td>
        <td>${escapeHtml(entry.lastname)}</td>
        <td>${entry.nickname ? escapeHtml(entry.nickname) : '—'}</td>
        <td>
          <button class="delete-row-btn" data-id="${entry.id}">Supprimer</button>
        </td>
      `;
      adminTableBody.appendChild(row);
    });

    // Add listeners to row delete buttons
    document.querySelectorAll('.delete-row-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idToDelete = parseInt(e.target.getAttribute('data-id'));
        deleteSubmission(idToDelete);
      });
    });
  }

  // Delete individual submission
  function deleteSubmission(id) {
    if (confirm("Supprimer ce contributeur de la liste ?")) {
      submissions = submissions.filter(s => s.id !== id);
      localStorage.setItem('memoire_daniel_submissions', JSON.stringify(submissions));
      updateAdminTable();
    }
  }

  // Reset all submissions
  resetDataBtn.addEventListener('click', () => {
    if (confirm("⚠️ ATTENTION : Es-tu absolument sûr de vouloir réinitialiser TOUTES les inscriptions ? Cette action est irréversible.")) {
      submissions = [];
      localStorage.removeItem('memoire_daniel_submissions');
      updateAdminTable();
    }
  });

  // ==========================================================================
  // DATA EXPORT (JSON & CSV)
  // ==========================================================================

  // Export JSON
  exportJsonBtn.addEventListener('click', () => {
    if (submissions.length === 0) return alert("Aucune donnée à exporter !");

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(submissions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `remerciements_memoire_daniel_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    if (submissions.length === 0) return alert("Aucune donnée à exporter !");

    // CSV Headers
    let csvContent = "data:text/csv;charset=utf-8," + "\uFEFF"; // Include BOM for proper French accents encoding in Excel
    csvContent += "Date,Prénom,Nom,Pseudo\n";

    // CSV Rows
    submissions.forEach(entry => {
      const row = [
        entry.date,
        escapeCsvField(entry.firstname),
        escapeCsvField(entry.lastname),
        escapeCsvField(entry.nickname)
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `remerciements_memoire_daniel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // Helper function to escape HTML special characters
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Helper function to format CSV fields (handle quotes and commas)
  function escapeCsvField(val) {
    let field = val.replace(/"/g, '""'); // Double double quotes to escape
    if (field.includes(",") || field.includes("\n") || field.includes('"')) {
      field = `"${field}"`;
    }
    return field;
  }
});

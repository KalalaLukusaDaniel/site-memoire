# 🕷️ Guide : Connecter TON Google Sheet au site (5-10 min)

Ce guide te permet de recevoir en direct, dans ton propre Google Sheet, les noms de toutes les personnes qui remplissent ton formulaire. C'est gratuit et tu n'as besoin que de ton compte Google.

> ⚠️ Tant que tu n'as pas fait ça, le site fonctionne quand même : les noms sont sauvegardés dans le navigateur du visiteur et tu peux les exporter via la console secrète (double-clic sur le mot « remerciements » du titre). Mais chaque visiteur garde ses données dans SON navigateur — donc pour tout recevoir chez toi, le Google Sheet est indispensable.

---

## Étape 1 : Créer ton Google Sheet

1. Va sur [sheets.google.com](https://sheets.google.com) et crée une **nouvelle feuille de calcul** (bouton +).
2. Nomme-la par exemple « Remerciements Mémoire Daniel ».
3. Sur la **première ligne**, écris exactement ces en-têtes (respecte les minuscules) :
   - Colonne A : `Date`
   - Colonne B : `firstname`
   - Colonne C : `lastname`
   - Colonne D : `nickname`

---

## Étape 2 : Créer le script (l'API)

1. Dans ton Google Sheet, menu **Extensions → Apps Script**.
2. Supprime tout le code affiché et colle ceci :

```javascript
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Évite les collisions d'écritures simultanées

  try {
    // Le script est lié à ta feuille : pas besoin d'ID
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheets()[0]; // Premier onglet de la feuille

    // Les données arrivent en format formulaire (URL-encoded)
    const p = e.parameter;

    sheet.appendRow([
      p.date || new Date().toLocaleString('fr-FR'),
      p.firstname || "",
      p.lastname || "",
      p.nickname || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

3. Clique sur l'icône **💾 (Enregistrer)** et donne un nom au projet (ex : « API Remerciements »).

> 💡 Note : ce script est légèrement différent de celui du guide de Trésor — le sien attendait du JSON alors que le site envoie des données de formulaire. Celui-ci correspond exactement au `app.js` de ton site, donc pas de bug.

---

## Étape 3 : Déployer en application Web

1. En haut à droite : **Déployer → Nouveau déploiement**.
2. Clique sur l'engrenage ⚙️ (à gauche) et choisis **Application Web**.
3. Configure :
   - **Description** : « API Remerciements Mémoire » (ou ce que tu veux)
   - **Exécuter en tant que** : **Moi** (ton compte Google)
   - **Qui a accès** : **Tout le monde** ← important, sinon le site ne pourra pas envoyer les données
4. Clique sur **Déployer**.
5. Google va te demander d'**autoriser l'accès** : choisis ton compte, puis si un écran « Google n'a pas validé cette application » apparaît, clique sur **Paramètres avancés → Accéder à [nom du projet] (non sécurisé)** — c'est normal, c'est TON propre script.
6. **Copie l'URL de l'application Web** (elle se termine par `/exec`).

> ⚠️ Si tu modifies le script plus tard, il faudra faire **Déployer → Gérer les déploiements → ✏️ → Nouvelle version** pour que les changements soient pris en compte.

---

## Étape 4 : Coller l'URL dans le site

1. Ouvre le fichier `app.js` de ton site.
2. Tout en haut, remplace la ligne :

```javascript
const GOOGLE_SHEET_URL = "COLLE_TON_URL_APPS_SCRIPT_ICI";
```

par (avec TON URL copiée à l'étape 3) :

```javascript
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/TON_LONG_IDENTIFIANT/exec";
```

3. Enregistre. C'est tout ! 🎉

---

## Étape 5 : Tester

1. Ouvre ton site, remplis le formulaire avec un nom bidon (ex : Peter Parker, surnom « Spidey »).
2. Vérifie que la ligne apparaît dans ton Google Sheet quelques secondes après.
3. Si rien n'arrive : ouvre la console du navigateur (F12 → onglet Console) et regarde s'il y a une erreur, puis vérifie que « Qui a accès » est bien sur « Tout le monde » dans le déploiement.

---

## 🚀 Bonus : Mettre le site en ligne gratuitement

Comme Trésor, tu peux héberger ton site gratuitement :

- **GitHub Pages** : crée un compte [GitHub](https://github.com), crée un dépôt, glisse tes 3 fichiers (`index.html`, `style.css`, `app.js`), puis Settings → Pages → Deploy from branch `main`. Ton site sera sur `https://tonpseudo.github.io/nom-du-depot`.
- **Netlify Drop** : va sur [app.netlify.com/drop](https://app.netlify.com/drop) et glisse simplement le dossier — en ligne en 30 secondes.

Ensuite tu partages le lien à tout le monde, et les noms tombent dans ton Google Sheet ! 🕸️

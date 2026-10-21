/* ==========================================================
   ÉTAT GLOBAL
========================================================== */
let etudiants = JSON.parse(localStorage.getItem("etudiants")) || [];

// Migration : ajoute un id aux anciens enregistrements (avant cette version)
etudiants = etudiants.map((e, i) => e.id ? e : { ...e, id: Date.now() + i });

let currentPage = 1;
const studentsPerPage = 5;
let filtreActuel = "all";
let rechercheActuelle = "";
let editId = null;   // id de l'étudiant en cours d'édition (null = création)

/* ==========================================================
   UTILITAIRES
========================================================== */
function sauvegarder() {
    localStorage.setItem("etudiants", JSON.stringify(etudiants));
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function viderFormulaire() {
    ["nom", "prenom", "email", "classe", "note"].forEach(id => {
        document.getElementById(id).value = "";
    });
}

function afficherMessage(txt, couleur = "var(--success-color)") {
    const msg = document.getElementById("message");
    msg.textContent = txt;
    msg.style.color = couleur;
    clearTimeout(msg._t);
    msg._t = setTimeout(() => { msg.textContent = ""; }, 3000);
}

/* ==========================================================
   AJOUT
========================================================== */
document.getElementById("btnAjouter").addEventListener("click", ajouterEtudiant);

function ajouterEtudiant() {
    const nom    = document.getElementById("nom").value.trim();
    const prenom = document.getElementById("prenom").value.trim();
    const email  = document.getElementById("email").value.trim();
    const classe = document.getElementById("classe").value.trim();
    const note   = parseFloat(document.getElementById("note").value);

    if (!nom || !prenom || !email || !classe || isNaN(note)) {
        afficherMessage("Veuillez remplir tous les champs.", "var(--danger-color)");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        afficherMessage("Email invalide.", "var(--danger-color)");
        return;
    }

    if (note < 0 || note > 20) {
        afficherMessage("La note doit être entre 0 et 20.", "var(--danger-color)");
        return;
    }

    const doublon = etudiants.some(e =>
        e.email.toLowerCase() === email.toLowerCase()
    );
    if (doublon) {
        afficherMessage("Cet email existe déjà.", "var(--danger-color)");
        return;
    }

    etudiants.push({ id: Date.now(), nom, prenom, email, classe, note });

    sauvegarder();
    viderFormulaire();
    currentPage = 1;
    afficherEtudiants();
    mettreAJourStats();
    afficherMessage("Étudiant ajouté avec succès ✅");
}

/* ==========================================================
   FILTRE + RECHERCHE (sur la donnée, pas sur le DOM)
========================================================== */
function getListeFiltree() {
    let liste = [...etudiants];

    if (filtreActuel === "admis")      liste = liste.filter(e => e.note >= 10);
    else if (filtreActuel === "echec") liste = liste.filter(e => e.note < 10);

    if (rechercheActuelle) {
        const q = rechercheActuelle.toLowerCase();
        liste = liste.filter(e =>
            `${e.nom} ${e.prenom} ${e.email} ${e.classe}`.toLowerCase().includes(q)
        );
    }

    return liste;
}

document.getElementById("filtre").addEventListener("change", function () {
    filtreActuel = this.value;
    currentPage = 1;
    afficherEtudiants();
});

document.getElementById("search").addEventListener("input", function () {
    rechercheActuelle = this.value;
    currentPage = 1;
    afficherEtudiants();
});

/* ==========================================================
   AFFICHAGE + PAGINATION
========================================================== */
function afficherEtudiants() {
    const tbody = document.getElementById("tableBody");
    const liste = getListeFiltree();
    const totalPages = Math.max(1, Math.ceil(liste.length / studentsPerPage));

    if (currentPage > totalPages) currentPage = totalPages;

    const debut = (currentPage - 1) * studentsPerPage;
    const pageData = liste.slice(debut, debut + studentsPerPage);

    tbody.innerHTML = "";

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888;">
            Aucun étudiant à afficher
        </td></tr>`;
    } else {
        pageData.forEach(etud => {
            const resultat = etud.note >= 10
                ? '<span class="admis">Admis</span>'
                : '<span class="echec">Échec</span>';

            tbody.innerHTML += `
                <tr>
                    <td>${escapeHtml(etud.nom)} ${escapeHtml(etud.prenom)}</td>
                    <td>${escapeHtml(etud.email)}</td>
                    <td>${escapeHtml(etud.classe)}</td>
                    <td>${etud.note}/20</td>
                    <td>${resultat}</td>
                    <td>
                        <button class="edit-btn"   onclick="ouvrirModal(${etud.id})">Modifier</button>
                        <button class="delete-btn" onclick="supprimerEtudiant(${etud.id})">Supprimer</button>
                    </td>
                </tr>
            `;
        });
    }

    document.getElementById("pageInfo").textContent =
        `Page ${currentPage} sur ${totalPages}`;
}

document.getElementById("nextPage").addEventListener("click", () => {
    const total = Math.max(1, Math.ceil(getListeFiltree().length / studentsPerPage));
    if (currentPage < total) { currentPage++; afficherEtudiants(); }
});

document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) { currentPage--; afficherEtudiants(); }
});

/* ==========================================================
   SUPPRESSION (par id)
========================================================== */
function supprimerEtudiant(id) {
    if (!confirm("Voulez-vous supprimer cet étudiant ?")) return;
    etudiants = etudiants.filter(e => e.id !== id);
    sauvegarder();
    afficherEtudiants();
    mettreAJourStats();
}

/* ==========================================================
   TRI
========================================================== */
function trierParNote() {
    etudiants.sort((a, b) => b.note - a.note);
    sauvegarder();
    currentPage = 1;
    afficherEtudiants();
}

/* ==========================================================
   MODALE MODIFICATION (par id)
========================================================== */
function ouvrirModal(id) {
    const etud = etudiants.find(e => e.id === id);
    if (!etud) return;

    editId = id;

    document.getElementById("editNom").value    = etud.nom;
    document.getElementById("editPrenom").value = etud.prenom;
    document.getElementById("editEmail").value  = etud.email;
    document.getElementById("editClasse").value = etud.classe;
    document.getElementById("editNote").value   = etud.note;

    document.getElementById("modal").classList.add("active");
}

function fermerModal() {
    document.getElementById("modal").classList.remove("active");
    editId = null;
}

document.getElementById("closeModal").addEventListener("click", fermerModal);

document.getElementById("saveEdit").addEventListener("click", () => {
    const nom    = document.getElementById("editNom").value.trim();
    const prenom = document.getElementById("editPrenom").value.trim();
    const email  = document.getElementById("editEmail").value.trim();
    const classe = document.getElementById("editClasse").value.trim();
    const note   = parseFloat(document.getElementById("editNote").value);

    if (!nom || !prenom || !email || !classe || isNaN(note)) {
        alert("Veuillez remplir tous les champs correctement.");
        return;
    }
    if (note < 0 || note > 20) {
        alert("La note doit être entre 0 et 20.");
        return;
    }

    const doublon = etudiants.some(e =>
        e.id !== editId && e.email.toLowerCase() === email.toLowerCase()
    );
    if (doublon) {
        alert("Cet email existe déjà.");
        return;
    }

    const index = etudiants.findIndex(e => e.id === editId);
    if (index !== -1) {
        etudiants[index] = { id: editId, nom, prenom, email, classe, note };
    }

    sauvegarder();
    fermerModal();
    afficherEtudiants();
    mettreAJourStats();
});

/* ==========================================================
   STATISTIQUES
========================================================== */
function mettreAJourStats() {
    document.getElementById("totalEtudiants").textContent = etudiants.length;

    const somme = etudiants.reduce((s, e) => s + e.note, 0);
    const moyenne = etudiants.length ? (somme / etudiants.length).toFixed(2) : "0.00";
    document.getElementById("moyenneGenerale").textContent = moyenne + "/20";

    const admis = etudiants.filter(e => e.note >= 10).length;
    document.getElementById("etudiantsAdmis").textContent = admis;
}

/* ==========================================================
   MODE SOMBRE
========================================================== */
document.getElementById("themeBtn").addEventListener("click", function () {
    document.body.classList.toggle("dark");
    this.textContent = document.body.classList.contains("dark")
        ? "☀️ Mode clair"
        : "🌙 Mode sombre";
});

/* ==========================================================
   EXPORT / IMPORT CSV
========================================================== */
function exportCSV() {
    if (etudiants.length === 0) { alert("Aucun étudiant à exporter."); return; }
   function importCSV() {
    if (etudiants.length === 0) { alert("Aucun étudiant à importer."); return; }


    let csv = "Nom,Prenom,Email,Classe,Note\n";
    etudiants.forEach(e => {
        csv += `${e.nom},${e.prenom},${e.email},${e.classe},${e.note}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "etudiants.csv";
    a.click();
    URL.revokeObjectURL(a.href);
}

document.getElementById("importCSV").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        const lignes = ev.target.result.split(/\r?\n/).filter(l => l.trim());
        const start = /nom/i.test(lignes[0]) ? 1 : 0;   // ignore l'entête
        let ajoutes = 0;

        for (let i = start; i < lignes.length; i++) {
            const [nom, prenom, email, classe, noteStr] =
                lignes[i].split(",").map(p => p.trim());
            const note = parseFloat(noteStr);

            if (!nom || !prenom || !email || !classe || isNaN(note)) continue;
            if (note < 0 || note > 20) continue;
            if (etudiants.some(e => e.email.toLowerCase() === email.toLowerCase())) continue;

            etudiants.push({ id: Date.now() + i, nom, prenom, email, classe, note });
            ajoutes++;
        }

        sauvegarder();
        currentPage = 1;
        afficherEtudiants();
        mettreAJourStats();
        alert(`${ajoutes} étudiant(s) importé(s).`);
    };
    reader.readAsText(file);
    e.target.value = "";   // permet de réimporter le même fichier
});

/* ==========================================================
   INITIALISATION
========================================================== */
afficherEtudiants();
mettreAJourStats();

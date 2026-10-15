let etudiants = JSON.parse(localStorage.getItem("etudiants")) || [];
let currentPage = 1;
const studentsPerPage = 5;
let editIndex = -1;

/* ==========================
   AJOUT ETUDIANT
========================== */
const btnAjouter = document.getElementById("btnAjouter");
btnAjouter.addEventListener("click", ajouterEtudiant);

function ajouterEtudiant() {
    const nom = document.getElementById("nom").value.trim();
    const prenom = document.getElementById("prenom").value.trim();
    const email = document.getElementById("email").value.trim();
    const classe = document.getElementById("classe").value.trim();
    const note = parseFloat(document.getElementById("note").value);

    if (nom === "" || prenom === "" || email === "" || classe === "" || isNaN(note)) {
        alert("Veuillez remplir tous les champs");
        return;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
        alert("Email invalide");
        return;
    }

    if (note < 0 || note > 20) {
        alert("La note doit être comprise entre 0 et 20");
        return;
    }

    const emailExiste = etudiants.some((e, index) => 
        e.email.toLowerCase() === email.toLowerCase() && index !== editIndex
    );

    if (emailExiste) {
        alert("Cet email existe déjà");
        return;
    }

    const etudiant = { nom, prenom, email, classe, note };

    if (editIndex === -1) {
        etudiants.push(etudiant);
    } else {
        etudiants[editIndex] = etudiant;
        editIndex = -1;
        btnAjouter.textContent = "Ajouter l'étudiant";
    }

    sauvegarder();
    afficherEtudiants();
    mettreAJourStats();

    document.getElementById("message").textContent = "Étudiant ajouté avec succès";
    setTimeout(() => { document.getElementById("message").textContent = ""; }, 3000);

    viderFormulaire();
}

/* ==========================
   AFFICHAGE
========================== */
function afficherEtudiants() {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    const debut = (currentPage - 1) * studentsPerPage;
    const fin = debut + studentsPerPage;
    const pageData = etudiants.slice(debut, fin);

    if (pageData.length === 0 && currentPage > 1) {
        currentPage--;
        afficherEtudiants();
        return;
    }

    pageData.forEach((etud, index) => {
        const realIndex = debut + index;
        const resultat = etud.note >= 10
            ? '<span class="admis">Admis</span>'
            : '<span class="echec">Échec</span>';

        tbody.innerHTML += `
            <tr>
               <td>${etud.nom} ${etud.prenom}</td>
               <td>${etud.email}</td>
               <td>${etud.classe}</td>
               <td>${etud.note}/20</td>
               <td>${resultat}</td>
               <td>
                   <button class="edit-btn" onclick="ouvrirModal(${realIndex})">Modifier</button>
                   <button class="delete-btn" onclick="supprimerEtudiant(${realIndex})">Supprimer</button>
               </td>
            </tr>
        `;
    });

    updatePageInfo();
}

/* ==========================
   SUPPRESSION
========================== */
function supprimerEtudiant(index) {
    if (!confirm("Voulez-vous supprimer cet étudiant ?")) return;

    etudiants.splice(index, 1);
    sauvegarder();
    afficherEtudiants();
    mettreAJourStats();
}

/* ==========================
   MODALE MODIFICATION
========================== */
function ouvrirModal(index) {
    editIndex = index;
    const etud = etudiants[index];

    document.getElementById("editNom").value = etud.nom;
    document.getElementById("editPrenom").value = etud.prenom;
    document.getElementById("editEmail").value = etud.email;
    document.getElementById("editClasse").value = etud.classe;
    document.getElementById("editNote").value = etud.note;

    document.getElementById("modal").style.display = "flex";
}

document.getElementById("closeModal").addEventListener("click", function() {
    document.getElementById("modal").style.display = "none";
});

document.getElementById("saveEdit").addEventListener("click", function() {
    const nom = document.getElementById("editNom").value.trim();
    const prenom = document.getElementById("editPrenom").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const classe = document.getElementById("editClasse").value.trim();
    const note = parseFloat(document.getElementById("editNote").value);

    if (!nom || !prenom || !email || !classe || isNaN(note)) {
        alert("Veuillez remplir tous les champs correctement.");
        return;
    }

    etudiants[editIndex] = { nom, prenom, email, classe, note };

    sauvegarder();
    document.getElementById("modal").style.display = "none";
    afficherEtudiants();
    mettreAJourStats();
});

/* ==========================
   STATS
========================== */
function mettreAJourStats() {
    document.getElementById("totalEtudiants").textContent = etudiants.length;

    const somme = etudiants.reduce((total, e) => total + e.note, 0);
    const moyenne = etudiants.length > 0 ? (somme / etudiants.length).toFixed(2) : "0.00";
    document.getElementById("moyenneGenerale").textContent = moyenne + "/20";

    const admis = etudiants.filter(e => e.note >= 10).length;
    document.getElementById("etudiantsAdmis").textContent = admis;
}

/* ==========================
   RECHERCHE
========================== */
document.getElementById("search").addEventListener("keyup", function() {
    const valeur = this.value.toLowerCase();
    const lignes = document.querySelectorAll("#tableBody tr");

    lignes.forEach(ligne => {
        const texte = ligne.textContent.toLowerCase();
        ligne.style.display = texte.includes(valeur) ? "" : "none";
    });
});

/* ==========================
   TRI
========================== */
function trierParNote() {
    etudiants.sort((a, b) => b.note - a.note);
    afficherEtudiants();
}

/* ==========================
   FILTRE
========================== */
document.getElementById("filtre").addEventListener("change", function() {
    const v = this.value;
    if (v === "all") {
        afficherEtudiants();
        return;
    }

    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";


   const filtered = etudiants.filter(e => v === "admis" ? e.note >= 10 : e.note < 10);

    filtered.forEach((etud) => {
        tbody.innerHTML += `
            <tr>
                <td>${etud.nom} ${etud.prenom}</td>
                <td>${etud.email}</td>
                <td>${etud.classe}</td>
                <td>${etud.note}/20</td>
                <td>${etud.note >= 10 ? '<span class="admis">Admis</span>' : '<span class="echec">Échec</span>'}</td>
                <td></td>
            </tr>
        `;
    });
});

/* ==========================
   MODE SOMBRE
========================== */
document.getElementById("themeBtn").addEventListener("click", function() {
    document.body.classList.toggle("dark");
});

/* ==========================
   EXPORT CSV
========================== */
function exportCSV() {
    let csv = "Nom,Prenom,Email,Classe,Note\n";
    etudiants.forEach(e => {
        csv += `${e.nom},${e.prenom},${e.email},${e.classe},${e.note}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "etudiants.csv";
    a.click();
}

/* ==========================
   LOCAL STORAGE & FORM
========================== */
function sauvegarder() {
    localStorage.setItem("etudiants", JSON.stringify(etudiants));
}

function viderFormulaire() {
    document.getElementById("nom").value = "";
    document.getElementById("prenom").value = "";
    document.getElementById("email").value = "";
    document.getElementById("classe").value = "";
    document.getElementById("note").value = "";
}

/* ==========================
   INITIALISATION
========================== */
afficherEtudiants();
mettreAJourStats();
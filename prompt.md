# Prompt pour Claude Code : Application "Select.io" (BTS SIO)

## Skill : use vue skill

## Contexte
Développer une Single Page Application (SPA) pour l'évaluation et le classement des dossiers Parcoursup pour un BTS SIO. Le projet est déjà initialisé avec **Vue 3 (Composition API)**, **Vite** et **Tailwind CSS**.

## Objectif Technique
Créer un composant principal `CandidatManager.vue` performant permettant de manipuler des données issues d'un fichier Excel (.xlsx).

## Fonctionnalités Requises
1. **Importation :**
   - Zone de Drag & Drop pour charger le fichier XLSX.
   - Parsing via la bibliothèque `xlsx` (SheetJS).

2. **Interface Layout (Tailwind CSS) :**
   - **Sidebar (Gauche) :** Liste verticale de tous les candidats (Nom, Prénom, Série de diplôme). Indication visuelle du candidat sélectionné.
   - **Vue Détail (Centre) :** Dashboard affichant les informations du candidat actif.
   - **Navigation :** Boutons "Suivant" et "Précédent" + support des flèches directionnelles du clavier.

3. **Évaluation (Édition des colonnes) :**
   - Formulaire permettant d'éditer les champs spécifiques :
     - **Note de Niveau** (Colonne AA / index 26)
     - **Note de Comportement** (Colonne AB / index 27)
     - **Note de Motivation** (Colonne AC / index 28)
     - **Remarque** (Colonne AD / index 29)
   - La mise à jour doit être réactive dans la liste de gauche.

4. **Exportation :**
   - Bouton "Sauvegarder / Exporter" générant un nouveau fichier XLSX contenant toutes les données d'origine plus les modifications effectuées.

5. **Évolutivité :**
   - Prévoir une zone (placeholder) pour l'affichage futur d'un PDF correspondant au candidat.

## Contraintes de Code
- **Performance :** Ne pas faire de `console.log` pour économiser les tokens.
- **Syntaxe :** Utiliser `<script setup>`.
- **Design :** Look "Dashboard" moderne, palette de couleurs professionnelles (Indigo/Slate).
- **Dépendances :** Utiliser `xlsx` pour la gestion des fichiers.

## Mapping des Données (Structure du fichier)
Le fichier CSV/XLSX source suit cette structure :
- Colonnes 0 à 25 : Données d'identité et scolaires (Lecture seule).
- Colonne 26 (AA) : Note de niveau.
- Colonne 27 (AB) : Note de comportement.
- Colonne 28 (AC) : Note de motivation.
- Colonne 29 (AD) : Remarque.
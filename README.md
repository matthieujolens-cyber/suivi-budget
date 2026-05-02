# Budget Hyperfluid

Petite application locale pour suivre les dépenses mensuelles des projets Hyperfluid et comparer le budget prévisionnel au réel.

## Ouvrir l'application

Double-clique sur `index.html`.

L'application fonctionne sans installation et sans compte. Les données sont sauvegardées dans le navigateur avec `localStorage`.

## Ce que tu peux faire

- choisir un mois ;
- choisir un projet ;
- créer, archiver ou supprimer un projet ;
- voir une consolidation globale du projet : budget total, réel total, écart, reste à consommer et taux de consommation ;
- créer des lots projet avec dates, statut, description et budget prévu ;
- saisir un budget prévu par catégorie ;
- détailler une catégorie avec plusieurs lignes, par exemple `UX/UI`, `Dev Full Stack` et `Dev IA` dans `Équipe` ;
- ajouter une ligne directement depuis le tableau et modifier son nom dans la cellule ;
- rattacher une ligne budget, une dépense ou une facture à un lot ;
- ajouter des dépenses réelles ;
- importer des factures PDF/JPG/PNG et valider manuellement les informations ;
- comparer prévu vs réel ;
- repérer les dépassements ;
- visualiser prévu vs réel mensuel, catégories, prestataires et lots ;
- copier le budget du mois précédent ;
- exporter le mois en CSV.

## Factures et OCR

L'import de facture sauvegarde le fichier dans le navigateur avec `localStorage`. Pour rester simple et local, l'OCR est préparé sous forme de prélecture : l'application tente de préremplir quelques champs depuis le nom du fichier, puis tu valides manuellement.

Une facture au statut `À valider` ne compte pas dans le réel. Une facture `Validée` compte dans le réel du projet.

## Mise en ligne

L'application est un site statique. Pour la publier, il suffit d'héberger le dossier contenant `index.html`, `styles.css`, `app.js` et `assets/`.

Options simples :

- GitHub Pages ;
- Netlify ;
- Vercel ;
- un hébergement web classique.

Important : les données restent dans le navigateur de chaque utilisateur. Si tu veux plusieurs utilisateurs avec les mêmes données, il faudra ajouter une vraie base de données.

## Projets disponibles

- Application V2 ;
- Application V3 ;
- Site internet Hyperfluid ;
- Marketing et communication ;
- Frais de commerce.

## Fichiers

- `index.html` : la page de l'application ;
- `styles.css` : l'apparence ;
- `app.js` : la logique et la sauvegarde locale.
- `assets/hyperfluid-logo.png` : le logo affiché dans la barre latérale.

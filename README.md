# Budget Hyperfluid

Petite application locale pour suivre les dépenses mensuelles des projets Hyperfluid et comparer le budget prévisionnel au réel.

## Ouvrir l'application

Double-clique sur `index.html`.

L'application fonctionne sans installation. Par défaut, les données sont sauvegardées dans le navigateur avec `localStorage`.

Si Supabase est configuré, tu peux te connecter avec un compte utilisateur et synchroniser les données dans une base cloud.

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

Important : sans Supabase, les données restent dans le navigateur de chaque utilisateur. Avec Supabase, elles sont synchronisées dans la base cloud du compte connecté.

## Comptes utilisateurs et base de données

Cette version prépare Supabase avec une synchronisation simple : chaque utilisateur possède un espace `Budget Hyperfluid` sauvegardé en JSON dans PostgreSQL.

Étapes :

1. Crée un projet sur Supabase.
2. Dans Supabase, ouvre `SQL Editor`.
3. Copie-colle le contenu de `supabase-schema.sql`, puis exécute-le.
4. Dans Supabase, va dans `Project Settings` puis `API`.
5. Copie l'URL du projet et la clé publique `anon`.
6. Ouvre `supabase-config.js` et renseigne :

```js
window.BUDGET_HYPERFLUID_SUPABASE = {
  url: "https://TON-PROJET.supabase.co",
  anonKey: "TA-CLE-ANON",
};
```

Après ça, recharge l'application. Le bloc `Compte` dans la barre latérale permettra de créer un compte, se connecter, se déconnecter et synchroniser.

La table cloud est protégée par Row Level Security : chaque utilisateur ne lit et ne modifie que ses propres données.

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
- `supabase-config.js` : configuration Supabase.
- `supabase-schema.sql` : schéma SQL à exécuter dans Supabase.
- `assets/hyperfluid-logo.png` : le logo affiché dans la barre latérale.

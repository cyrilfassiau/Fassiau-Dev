# fassiau-dev.com

Site vitrine de Cyril Fassiau, développeur web indépendant à Fleurus (Belgique).

Site **statique**, écrit à la main en HTML / CSS / JavaScript. **Aucun framework, aucune dépendance, aucune étape de build.** Les fichiers sont servis tels quels par Netlify. C'est volontaire : le site doit rester modifiable dans six mois sans avoir à réinstaller une chaîne d'outils.

---

## Structure

```
.
├── index.html                              Page d'accueil (toutes les sections)
├── projects.html                           Réalisations & démonstrations
├── creation-site-internet-charleroi.html   Page d'atterrissage SEO locale
├── mentions-legales.html                   Mentions légales (noindex)
├── 404.html                                Page d'erreur (servie par Netlify)
├── styles.css                              Feuille de style unique, partagée
├── script.js                               JavaScript unique, partagé
├── netlify.toml                            Redirections (URL sans extension)
├── robots.txt                              Autorise tout + déclare le sitemap
├── sitemap.xml                             3 URL indexables
├── favicon.svg / favicon-32.png            Favicons
├── favicon-512.png / apple-touch-icon.png
├── fonts/                                  Polices auto-hébergées (.woff2)
├── images/                                 Visuels des projets + image de partage
└── .gitignore                              .DS_Store, dossiers d'éditeurs
```

### Points importants sur l'architecture

- **Le contenu est écrit en dur dans le HTML.** Il n'y a pas de fichier de données ni de générateur : pour changer un texte, on modifie le HTML.
- **L'en-tête, le pied de page et le sprite d'icônes SVG sont dupliqués dans les 4 pages.** Une modification de navigation doit donc être répercutée 4 fois. C'est le principal coût de maintenance du dépôt.
- **Les cartes de projets sont dupliquées** entre `index.html`, `projects.html` et la page Charleroi. Une correction de texte ou d'`alt` est à faire dans chaque fichier.

---

## Lancer le site en local

Le site n'a pas de build : il suffit de servir le dossier en HTTP.

```bash
python3 -m http.server 4321
```

Puis ouvrir <http://localhost:4321>.

> **Ne pas ouvrir les fichiers en double-cliquant** (`file://`). Les URL absolues (`/favicon.svg`) et le formulaire ne fonctionnent pas dans ce mode.

Alternatives : l'extension **Live Server** de VS Code, ou `npx serve` si Node est installé.

Pour tester les redirections de `netlify.toml` et le formulaire :

```bash
npx netlify-cli dev
```

---

## Ajouter un projet au portfolio

### 1. Préparer l'image

**1600 px de large maximum** (les cartes s'affichent en 800 px ; au-delà on alourdit la page pour rien). Il faut **deux fichiers** : un WebP, servi en priorité, et un JPEG de repli.

Nom de fichier : minuscules, tirets, sans accent ni espace, descriptif.
Exemple : `site-boulangerie-gosselies.jpg`.

```bash
npx --yes sharp-cli -i source.png -o images/ resize 1600 --withoutEnlargement -- jpeg --quality 82
```

```bash
npx --yes sharp-cli -i source.png -o images/ resize 1600 --withoutEnlargement -- webp --quality 78
```

Sans installer quoi que ce soit, [squoosh.app](https://squoosh.app) fait la même chose dans le navigateur : redimensionner à 1600 px, exporter une fois en WebP (qualité ~78) et une fois en JPEG (qualité ~82).

`sips`, livré avec macOS, sait redimensionner mais **ne sait pas écrire le WebP**.

> Repère : le visuel du salon de coiffure pesait 5,8 Mo en 6000 px avant optimisation. Après : 94 Ko en JPEG, 55 Ko en WebP, sans perte visible.

### 2. Copier une carte existante

Reprendre un bloc `<article class="project-card">` complet dans `projects.html` et l'adapter :

```html
<article class="project-card">
    <div class="project-image-wrapper">
        <!-- Uniquement pour une démonstration, pas pour un vrai client : -->
        <span class="project-badge">Démonstration</span>
        <picture>
            <source srcset="images/mon-image.webp" type="image/webp">
            <img class="project-image" src="images/mon-image.jpg"
                 width="1600" height="1200" loading="lazy" decoding="async"
                 alt="Description honnête de ce que montre l'image">
        </picture>
    </div>
    <div class="project-body">
        <h3 class="project-heading">Nom du projet</h3>
        <p class="project-text">Une phrase sur ce qu'est le site.</p>
        <p class="project-benefits">Site vitrine 5 pages · Mobile · Référencement local</p>
        <a href="https://…" class="project-link" target="_blank" rel="noopener">
            Voir le site en ligne
            <svg class="icon" aria-hidden="true"><use href="#i-arrow-up-right"></use></svg>
        </a>
    </div>
</article>
```

### 3. Choisir la bonne section

| Section | Contenu | Badge | Libellé du lien |
|---|---|---|---|
| **Sites en ligne** | Sites commandés par un vrai client | aucun | « Voir le site en ligne » |
| **Démonstrations & concepts** | Sites créés de ma propre initiative | `project-badge` | « Voir la démonstration » |

**Cette distinction est la raison d'être de la structure du portfolio. Ne jamais placer une démonstration dans « Sites en ligne ».**

### 4. Répercuter dans les autres pages

- `projects.html` — la liste complète (obligatoire)
- `index.html` — seulement si le projet doit figurer dans la sélection de l'accueil
- `creation-site-internet-charleroi.html` — seulement pour les démonstrations

### 5. Attention à la mise en page

La grille applique un motif par groupes de trois cartes :
`nth-child(3n+1)` = 7 colonnes, `nth-child(3n+2)` = 5 colonnes, `nth-child(3n)` = pleine largeur.
**Ajouter ou retirer une carte réagence donc toutes les suivantes.** Vérifier le rendu après coup.

### 6. Textes alternatifs

L'`alt` doit décrire **ce que montre réellement l'image**, pas le projet. Trois `alt` sur cinq décrivaient une autre image dans une version précédente du site : c'est le genre de détail qu'un prospect attentif repère.

---

## Ajouter une page

1. Dupliquer la page existante la plus proche (`projects.html` est la plus simple).
2. Adapter `<title>`, `<meta name="description">`, `<link rel="canonical">` et les balises `og:` / `twitter:` — **elles doivent être uniques par page**.
3. Ajouter l'URL dans `sitemap.xml`.
4. Ajouter un lien dans le pied de page des **4** pages si la page doit être atteignable partout.
5. Pour une URL sans `.html`, ajouter une redirection dans `netlify.toml` :

```toml
[[redirects]]
  from = "/ma-page"
  to = "/ma-page.html"
  status = 200
```

⚠️ Si la page reprend l'en-tête d'une autre, **vérifier les références d'icônes** : elles doivent rester `<use href="#i-sun">` et jamais `<use href="autre-page.html#i-sun">`. Une référence SVG vers un autre document est ignorée par les navigateurs et l'icône disparaît.

---

## Déployer

Le déploiement est **automatique** : Netlify est branché sur la branche `main` du dépôt GitHub.

```bash
git add -A
git commit -m "Description du changement"
git push
```

Netlify reconstruit et met en ligne en une minute environ. Suivi sur le tableau de bord Netlify.

### Avant chaque déploiement

1. **Chercher les placeholders restants** — ils ne doivent jamais partir en production :

   ```bash
   grep -rn "\[\[" --include="*.html" .
   ```

2. Vérifier le rendu en local sur mobile et sur desktop.
3. Vérifier qu'aucun lien n'est cassé.

### Le formulaire de contact

Il utilise **Netlify Forms** : l'attribut `data-netlify="true"` suffit, Netlify détecte le formulaire au déploiement. Les messages arrivent dans **Forms** sur le tableau de bord Netlify.

Le champ `bot-field` est un piège anti-spam : le laisser masqué et ne jamais le remplir.

Ajouter un champ au formulaire = ajouter un `<input name="…">`. Il apparaîtra dans les soumissions au déploiement suivant.

---

## Conventions

**CSS** — variables de thème dans `:root`, `clamp()` pour toutes les tailles, classes en kebab-case, modificateurs façon BEM (`.btn--solid`). **Toute nouvelle couleur doit être déclarée dans les deux palettes** : `:root` (clair) et les deux blocs sombres (`@media (prefers-color-scheme: dark)` et `:root[data-theme="dark"]`).

**JavaScript** — un seul fichier partagé, en ES5 (`var`, pas de flèches), enveloppé dans une IIFE. Chaque bloc est protégé par un `if (element)` puisque le script est chargé sur toutes les pages.

**Typographie française** — espace insécable fine `&#8239;` avant `? ! : ;` et à l'intérieur des guillemets `«&#8239;…&#8239;»`. Dans le JavaScript, utiliser l'échappement `\u202F` (une entité HTML ne fonctionne pas dans une chaîne JS).

**Placeholders** — les informations à compléter sont notées `[[EN MAJUSCULES]]` dans le HTML. Elles sont souvent répétées dans plusieurs fichiers (carte, réponse FAQ, JSON-LD) : les remplacer partout d'un coup.

**Images** — toujours dans un `<picture>` avec une source WebP et un `<img>` JPEG de repli. `width` et `height` doivent correspondre aux **dimensions réelles du fichier** (évite le décalage de mise en page au chargement). `loading="lazy"` sauf si l'image est visible dès l'ouverture de la page — ce qui n'est le cas d'aucune image aujourd'hui, le héros étant en texte.

**Polices** — auto-hébergées dans `fonts/`, déclarées en `@font-face` dans `styles.css`. Deux règles à respecter : une police utilisée par une variable `--font-*` **doit** avoir un `@font-face`, et seules les polices réellement rendues au premier écran (`Public Sans` pour le corps de texte, `Oswald` pour les titres) méritent un `<link rel="preload">`. Précharger une police non utilisée coûte du temps de chargement et déclenche un avertissement dans la console.

---

## Données structurées (SEO)

`index.html` contient deux blocs JSON-LD :

- **`ProfessionalService`** — identité de l'entreprise, adresse, TVA, zone desservie.
- **`FAQPage`** — les 10 questions de la FAQ.

Le texte du `FAQPage` **doit rester identique** à celui affiché à l'écran : c'est une exigence de Google. Si une réponse est modifiée dans le HTML, la modifier aussi dans le JSON-LD.

Ne pas dupliquer le bloc `FAQPage` sur une autre page : des données structurées identiques sur plusieurs URL sont traitées comme du contenu dupliqué.

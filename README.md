# Mes 3 Telegram Mini Apps

Ce dépôt regroupe **3 Mini Apps Telegram** construites avec **React + Vite + Tailwind CSS** et prêtes pour un déploiement automatique sur **GitHub Pages** :

1. **Notes, Tâches & Habitudes** (`/notes/`)
2. **Budget & Mini-Devis** (`/budget/`)
3. **Focus Pomodoro & QR Code** (`/outils/`)

Chaque application sauvegarde les données dans `Telegram.WebApp.CloudStorage` (avec repli automatique sur `localStorage` lors des tests sur navigateur).

## Tester en local

```bash
npm install
npm run dev
```

Puis ouvrir l’URL locale affichée dans le terminal (par ex. `http://localhost:5173`).

## Déployer sur GitHub Pages (automatique)

1. Créer un dépôt public sur GitHub (ex. `telegram-mini-apps`).
2. Pousser ce dossier sur la branche `main`.
3. Sur GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
4. À la fin du workflow, tes URLs sont :
   - `https://<ton-pseudo>.github.io/<nom-du-repo>/notes/`
   - `https://<ton-pseudo>.github.io/<nom-du-repo>/budget/`
   - `https://<ton-pseudo>.github.io/<nom-du-repo>/outils/`

## Relier chaque app à un bot dans `@BotFather`

Répéter ces étapes **3 fois** (une par appli) dans Telegram avec `@BotFather` :

1. Envoyer `/newbot` → choisir le nom du bot et son `@username_bot`.
2. Envoyer `/mybots` → sélectionner le bot → **Bot Settings** → **Menu Button** → **Configure menu button**.
3. Coller l’URL HTTPS correspondante (`/notes/`, `/budget/` ou `/outils/`) et donner un titre au bouton (ex. `Ouvrir`).
4. *(Optionnel)* Utiliser `/newapp` pour générer aussi un lien direct `t.me/ton_bot/app`.

# 🐠 Fish Tracker

Une application web moderne de gestion d'aquarium développée avec **Meteor.js** et **React**. Ce projet pédagogique permet d'apprendre concrètement le développement full-stack tout en construisant une application utile et complète.

## 🎯 Objectif pédagogique

Ce projet fait partie d'une reconversion professionnelle vers le développement web. Il permet d'acquérir une expertise pratique sur :

- **React** : Composants, hooks, state management, patterns modernes
- **Meteor.js** : Publications/souscriptions, méthodes, comptes utilisateurs, réactivité
- **MongoDB** : Collections, requêtes, indexation
- **Architecture** : Structure projet, séparation des responsabilités, bonnes pratiques

## ✨ Fonctionnalités

### 🔐 Authentification sécurisée
- Inscription avec validation d'email
- Connexion/déconnexion
- Vérification d'email obligatoire
- Interface personnalisée (sans `accounts-ui`)

### 🐠 Gestion des poissons
- **CRUD complet** : Ajouter, modifier, supprimer, consulter
- **Photos** : Upload d'images avec aperçu (JPEG, PNG, WebP)
- **Informations détaillées** : Espèce, couleur, taille, type d'aquarium, notes
- **Calcul d'ancienneté** : Suivi automatique depuis l'introduction
- **Vue liste et détail** : Navigation fluide entre les vues

### 📅 Système d'événements
- **Types d'événements** : Nourrissage, nettoyage, changement d'eau, traitement, autre
- **Planification** : Événements ponctuels ou récurrents
- **Priorités** : Basse, normale, haute, critique
- **Rappels** : Notifications pour les événements en retard
- **Suivi** : Marquer les événements comme terminés

### 📊 Analytics et statistiques
- **Tableaux de bord** : Vue d'ensemble de l'aquarium
- **Compteurs** : Poissons, événements, statistiques temporelles
- **Graphiques** : Répartition par types, évolution dans le temps
- **Alertes** : Événements urgents et rappels

### 🖼️ Système d'upload d'images
- **Upload sécurisé** : Validation côté client et serveur
- **Formats supportés** : JPEG, PNG, WebP (5-10MB max)
- **Serveur personnalisé** : Route `/api/images/` pour servir les fichiers
- **Nommage intelligent** : `fish-userId-timestamp-randomId.extension`
- **Stockage optimisé** : Dossier `uploads/` hors surveillance Meteor

## 🏗️ Architecture technique

### Stack technologique
- **Frontend** : React 18, Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend** : Meteor.js, Node.js
- **Base de données** : MongoDB (intégrée Meteor)
- **Authentification** : Meteor Accounts
- **Build** : Webpack (intégré Meteor), PostCSS, Autoprefixer

### Structure du projet
```
fish-tracker/
├── client/                 # Point d'entrée client
│   ├── main.jsx           # Bootstrap React + configuration globale
│   └── main.css           # Styles Tailwind + personnalisations
├── imports/
│   ├── api/               # Logique métier (serveur)
│   │   ├── fish/          # Collection et méthodes poissons
│   │   ├── events/        # Collection et méthodes événements
│   │   ├── images/        # Gestion upload d'images
│   │   └── users/         # Extensions utilisateurs
│   └── ui/                # Interface utilisateur (client)
│       ├── components/    # Composants React
│       │   ├── auth/      # Authentification
│       │   ├── ui/        # Composants de base (shadcn/ui)
│       │   └── layout/    # Composants de mise en page
│       └── hooks/         # Hooks personnalisés
├── server/                # Configuration serveur
├── public/                # Assets statiques
├── uploads/               # Images uploadées (hors surveillance)
└── tests/                 # Tests automatisés
```

### Patterns et concepts mis en œuvre

#### 🎣 Hooks personnalisés
- `useFish()` : Gestion réactive des poissons
- `useEvents()` : Gestion des événements et statistiques  
- `useImageUpload()` : Upload et gestion d'images

#### 🔄 Réactivité Meteor
- **Publications** : `userFish`, `userEvents`, `eventStats`
- **Souscriptions** : Données synchronisées en temps réel
- **Méthodes** : Actions sécurisées côté serveur

#### 🧩 Composants modulaires
- **Dashboards** : `FishDashboard`, `EventsDashboard`, `AnalyticsDashboard`
- **Formulaires** : `FishForm`, `EventForm` (modes ajout/édition)
- **Modales** : `EventDetailsModal`, composants de confirmation
- **UI réutilisables** : Système de design cohérent

## 🚀 Installation et démarrage

### Prérequis
- **Node.js** 14+ 
- **Meteor** 2.8+
- **Git**

### Installation
```bash
# Cloner le projet
git clone <url-du-repo>
cd fish-tracker

# Installer Meteor (si pas déjà fait)
curl https://install.meteor.com/ | sh

# Installer les dépendances
meteor npm install

# Démarrer l'application
meteor run
```

L'application sera accessible sur `http://localhost:3000`

### Configuration
```bash
# Optionnel : Personnaliser les paramètres
cp settings.json.example settings.json
meteor run --settings settings.json
```

## 📱 Utilisation

### Premier démarrage
1. **S'inscrire** avec une adresse email valide
2. **Vérifier l'email** (lien envoyé automatiquement)
3. **Se connecter** avec les identifiants

### Gestion des poissons
1. **Ajouter un poisson** : Bouton "+" → Remplir le formulaire → Upload photo (optionnel)
2. **Voir les détails** : Cliquer sur l'icône "œil" sur une carte
3. **Modifier** : Bouton "crayon" depuis la liste ou le détail
4. **Supprimer** : Bouton "poubelle" avec confirmation

### Planification d'événements
1. **Créer un événement** : Onglet "Événements" → "Ajouter un événement"
2. **Choisir le type** : Nourrissage, nettoyage, traitement, etc.
3. **Définir la récurrence** : Ponctuel ou répétitif
4. **Suivre les rappels** : Notifications automatiques pour les retards

## 🎨 Design et UX

### Responsive design
- **Mobile-first** : Interface optimisée pour smartphones
- **Tablettes** : Adaptation automatique des layouts
- **Desktop** : Exploitation de l'espace disponible

### Système de couleurs
- **Poissons** : Bleu (🐠)
- **Événements** : Orange/Rouge selon urgence (📅)
- **Analytics** : Violet (📊)
- **Succès** : Vert, **Erreurs** : Rouge, **Infos** : Bleu

### Interactions
- **Animations** : Transitions fluides, loading states
- **Feedback** : Toasts, confirmations, états de chargement
- **Navigation** : Onglets avec badges intelligents

## 🔧 Développement

### Scripts disponibles
```bash
meteor run              # Démarrage en développement
meteor run --production # Build de production
meteor test             # Tests unitaires
meteor reset            # Reset base de données
```

### Bonnes pratiques appliquées
- **Commentaires pédagogiques** : Code explicité pour l'apprentissage
- **Validation double** : Client + serveur pour la sécurité
- **Gestion d'erreurs** : Feedback utilisateur systématique
- **Performance** : Hooks optimisés, lazy loading
- **Accessibilité** : Labels, contrastes, navigation clavier

### Ajout de fonctionnalités
1. **Créer la collection** (si nouvelle entité)
2. **Définir les méthodes** serveur avec validation
3. **Créer les publications** pour la réactivité
4. **Développer le hook** personnalisé
5. **Implémenter les composants** UI
6. **Ajouter la navigation** dans `MainApp.jsx`

## 🎓 Apprentissages clés

### Concepts React maîtrisés
- **Hooks** : useState, useEffect, useCallback, hooks personnalisés
- **Composants** : Fonctionnels, props, composition
- **État** : Local vs global, lifting state up
- **Événements** : Gestion des formulaires, interactions

### Concepts Meteor maîtrisés  
- **Réactivité** : Publications/souscriptions temps réel
- **Sécurité** : Méthodes serveur, validation, authentification
- **Collections** : MongoDB avec Meteor, requêtes optimisées
- **Comptes** : Système d'authentification intégré

### Patterns architecturaux
- **Séparation des responsabilités** : API/UI/Logic
- **Hooks personnalisés** : Logique métier réutilisable
- **Composants contrôlés** : Formulaires avec validation
- **Modularité** : Code organisé et maintenable

## 📈 Évolutions futures

### Fonctionnalités prévues
- **Communauté** : Base de données partagée d'espèces
- **Messagerie** : Communication entre aquariophiles  
- **Export** : Rapports PDF, sauvegarde données
- **API** : Ouverture pour applications tierces

### Améliorations techniques
- **Tests** : Couverture complète (Jest + Cypress)
- **PWA** : Application web progressive
- **Performance** : Optimisations bundle, cache
- **Monitoring** : Logs, métriques, alertes

## 🤝 Contribution

Ce projet étant pédagogique, les contributions sont les bienvenues pour :
- **Corrections** : Bugs, optimisations
- **Documentation** : Amélioration des explications
- **Fonctionnalités** : Nouvelles idées d'apprentissage
- **Tests** : Couverture et robustesse

## 📄 Licence

Projet pédagogique - Libre d'utilisation pour l'apprentissage

---

**Développé avec ❤️ dans le cadre d'une reconversion vers le développement web**

*Stack : Meteor.js + React + MongoDB + Tailwind CSS*

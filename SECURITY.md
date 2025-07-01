# 🔒 Guide de Sécurité - Fish Tracker

## ⚠️ Configuration des variables sensibles

Ce projet utilise des données sensibles qui ne doivent **JAMAIS** être commitées dans Git.

### 📋 Fichiers de configuration

#### `settings.json` (NON committé)
Contient les vraies credentials de production et développement.
**⚠️ Ce fichier est dans .gitignore et ne doit jamais être ajouté à Git.**

#### `settings.json.example` (Committé)
Template avec des placeholders pour guider la configuration.

### 🔑 Variables sensibles à configurer

#### 1. MongoDB Atlas
```json
"MONGO_URL": "mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/database"
```
- Remplacez `USERNAME` et `PASSWORD` par vos credentials MongoDB
- Obtenez ces informations depuis votre dashboard MongoDB Atlas

#### 2. Brevo (Email SMTP)
```json
"MAIL_URL": "smtp://LOGIN:API_KEY@smtp-relay.brevo.com:587"
```
- `LOGIN` : Votre identifiant Brevo (généralement votre email)
- `API_KEY` : Clé API SMTP générée dans votre compte Brevo

### 🚀 Configuration initiale

1. **Copiez le template** :
   ```bash
   cp settings.json.example settings.json
   ```

2. **Configurez MongoDB** :
   - Connectez-vous à MongoDB Atlas
   - Créez un utilisateur avec accès à votre base
   - Copiez l'URL de connexion complète

3. **Configurez Brevo** :
   - Connectez-vous à votre compte Brevo
   - Allez dans "SMTP & API" > "SMTP"
   - Générez une nouvelle clé API
   - Utilisez votre login et cette clé

4. **Testez la configuration** :
   ```bash
   meteor run --settings settings.json
   ```

### 🛡️ Bonnes pratiques

- ✅ **settings.json** est dans `.gitignore`
- ✅ Utilisez des mots de passe forts
- ✅ Régénérez les clés API régulièrement
- ✅ Ne partagez jamais vos credentials
- ❌ Ne commitez jamais `settings.json`
- ❌ Ne mettez pas de credentials dans le code

### 🚨 En cas de fuite

Si des credentials sont accidentellement commitées :

1. **Changez immédiatement** tous les mots de passe/clés exposés
2. **Nettoyez l'historique Git** avec `git filter-branch`
3. **Forcez le push** pour réécrire l'historique distant
4. **Vérifiez** que les anciennes credentials sont révoquées

### 📞 Contact

En cas de problème de sécurité, contactez immédiatement l'administrateur du projet. 
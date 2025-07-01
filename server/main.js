import { Meteor } from 'meteor/meteor';

// 📦 IMPORTS DES MODULES
// Chaque module a une responsabilité unique et bien définie
import { initializeEmailConfig } from './config/email.js';
import { registerUserMethods } from '../imports/api/users/userMethods.js';
import { registerFishMethods } from '../imports/api/fish/FishMethods.js';
import { registerFishPublications } from '../imports/api/fish/FishPublications.js';
import { initializeImageUpload, registerImageMethods } from '../imports/api/images/ImageMethods.js';
import { setupImageServer, updateImageBaseUrl } from '../imports/api/images/ImageServer.js';
import { registerEventMethods } from '../imports/api/events/EventsMethods.js';
import { registerEventPublications } from '../imports/api/events/EventsPublications.js';

/**
 * 🚀 POINT D'ENTRÉE PRINCIPAL DU SERVEUR FISH TRACKER
 * 
 * Ce fichier est maintenant un "orchestrateur" qui :
 * - Importe les modules spécialisés
 * - Les initialise dans le bon ordre
 * - Reste simple et lisible (< 50 lignes)
 * 
 * Avantages de cette approche :
 * ✅ Séparation des responsabilités
 * ✅ Code modulaire et réutilisable
 * ✅ Facile à tester et maintenir
 * ✅ Évolutif (on peut ajouter de nouveaux modules facilement)
 */

Meteor.startup(() => {
  console.log('🐠 === DÉMARRAGE SERVEUR FISH TRACKER ===');

  // 📧 ÉTAPE 1 : Configuration des emails
  // Configure SMTP, templates et paramètres Accounts
  initializeEmailConfig();

  // 🔐 ÉTAPE 2 : Enregistrement des méthodes utilisateur
  // Rend disponibles les méthodes côté client
  registerUserMethods();

  // 🐠 ÉTAPE 3 : Enregistrement des méthodes de gestion des poissons
  // Rend disponibles les méthodes CRUD pour les poissons
  registerFishMethods();

  // 📡 ÉTAPE 4 : Enregistrement des publications de poissons
  // Active la synchronisation temps réel des données
  registerFishPublications();

  // 📸 ÉTAPE 5 : Initialisation du système d'upload d'images
  // Configure le dossier d'upload et les méthodes serveur
  initializeImageUpload();

  // 🔍 ÉTAPE 6 : Vérification des méthodes d'images
  // Confirme que les méthodes sont bien disponibles
  registerImageMethods();

  // 🖼️ ÉTAPE 7 : Configuration du serveur d'images personnalisé
  // Crée une route /api/images/ pour servir les images uploadées
  setupImageServer();

  // 🔄 ÉTAPE 8 : Mise à jour de l'URL de base des images
  // Configure l'URL pour utiliser le serveur personnalisé
  updateImageBaseUrl();

  // 📅 ÉTAPE 9 : Enregistrement des méthodes d'événements
  // Rend disponibles les méthodes CRUD pour les événements
  registerEventMethods();

  // 📅 ÉTAPE 10 : Enregistrement des publications d'événements
  // Active la synchronisation temps réel des données
  registerEventPublications();

  console.log('✅ === SERVEUR FISH TRACKER PRÊT ===');
});

import { Meteor } from 'meteor/meteor';
import { FishCollection } from './FishCollection.js';

/**
 * 📡 PUBLICATIONS METEOR - SYNCHRONISATION DES DONNÉES
 * 
 * Les publications définissent quelles données le serveur envoie au client.
 * Elles garantissent la sécurité : chaque utilisateur ne voit que SES données.
 * 
 * 📚 Concepts Meteor appris :
 * - Meteor.publish() pour définir les données à envoyer
 * - Sécurité par utilisateur (this.userId)
 * - Réactivité automatique (les données se mettent à jour en temps réel)
 * - Optimisation des requêtes (seuls les champs nécessaires)
 */

/**
 * 🐠 PUBLICATION : POISSONS DE L'UTILISATEUR CONNECTÉ
 * 
 * Cette publication envoie tous les poissons de l'utilisateur connecté
 * au client pour affichage réactif.
 */
Meteor.publish('userFish', function publishUserFish() {

    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        return this.ready(); // Retourne une publication vide
    }

    try {
        // 📊 Publier tous les poissons de l'utilisateur connecté
        const cursor = FishCollection.find(
            { ownerId: this.userId }, // Filtre de sécurité
            {
                // Optimisation : on peut limiter les champs si nécessaire
                // fields: { name: 1, species: 1, color: 1, ... }
                sort: { createdAt: -1 } // Tri par date de création (plus récent en premier)
            }
        );

        return cursor;

    } catch (error) {
        console.error('❌ [PUBLICATION] Erreur userFish:', error);
        return this.ready(); // Retourne une publication vide en cas d'erreur
    }
});

/**
 * 📊 PUBLICATION : STATISTIQUES DES POISSONS
 * 
 * Cette publication pourrait être utilisée pour des statistiques en temps réel
 * (pour l'instant, nous utilisons une méthode, mais c'est une alternative)
 */
Meteor.publish('userFishStats', function publishUserFishStats() {

    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        return this.ready();
    }

    // Pour les statistiques, on peut utiliser une approche différente
    // ou simplement compter côté client avec les données déjà publiées
    return this.ready();
});

/**
 * 🌐 ENREGISTREMENT DES PUBLICATIONS
 * 
 * Cette fonction sera appelée depuis server/main.js pour activer les publications
 */
export const registerFishPublications = () => {
}; 
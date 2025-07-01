import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EventsCollection } from './EventsCollection.js';

/**
 * 📡 PUBLICATIONS DES ÉVÉNEMENTS
 * 
 * Ce module expose les données d'événements au client de façon sécurisée.
 * Les publications permettent la synchronisation temps réel entre serveur et client.
 * 
 * 🔒 Sécurité :
 * - Chaque publication vérifie les droits utilisateur
 * - Seules les données autorisées sont exposées
 * - Filtrage automatique par propriétaire (ownerId)
 * 
 * 📚 Concepts Meteor appris :
 * - Publications réactives (mise à jour automatique)
 * - Filtrage sécurisé des données
 * - Optimisation des requêtes
 * - Gestion des paramètres de publication
 */

/**
 * 📋 PUBLICATION GÉNÉRALE - TOUS LES ÉVÉNEMENTS DE L'UTILISATEUR
 * 
 * Expose tous les événements de l'utilisateur connecté, triés par date prévue
 * Utilisée pour les vues générales et les listes complètes
 */
Meteor.publish('events.all', function () {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        return this.ready(); // Pas de données pour les utilisateurs non connectés
    }

    // 📊 RETOURNER LES ÉVÉNEMENTS DE L'UTILISATEUR
    return EventsCollection.find(
        {
            ownerId: this.userId // Filtrage sécurisé : seuls les événements de l'utilisateur
        },
        {
            sort: { scheduledAt: -1 }, // Tri par date prévue (plus récent en premier)
            fields: {
                // Optimisation : exclure les champs sensibles si nécessaire
                // Ici on expose tous les champs car l'utilisateur est propriétaire
            }
        }
    );
});

/**
 * 🐠 PUBLICATION PAR POISSON - ÉVÉNEMENTS D'UN POISSON SPÉCIFIQUE
 * 
 * Expose les événements liés à un poisson particulier
 * Utilisée pour les vues détaillées de poisson
 * 
 * @param {String} fishId - ID du poisson
 */
Meteor.publish('events.byFish', function (fishId) {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        return this.ready();
    }

    // 📋 VALIDATION DU PARAMÈTRE
    check(fishId, String);

    // 📊 RETOURNER LES ÉVÉNEMENTS DU POISSON
    return EventsCollection.find(
        {
            fishId: fishId,
            ownerId: this.userId // Double sécurité : poisson ET utilisateur
        },
        {
            sort: { scheduledAt: -1 } // Tri chronologique inverse
        }
    );
});

/**
 * 📅 PUBLICATION DU JOUR - ÉVÉNEMENTS D'AUJOURD'HUI
 * 
 * Expose uniquement les événements prévus pour aujourd'hui
 * Utilisée pour les tableaux de bord et vues quotidiennes
 */
Meteor.publish('events.today', function () {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        return this.ready();
    }

    // 📅 CALCULER LES BORNES DU JOUR ACTUEL
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0); // Début de journée : 00:00:00

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999); // Fin de journée : 23:59:59

    // 📊 RETOURNER LES ÉVÉNEMENTS DU JOUR
    return EventsCollection.find(
        {
            ownerId: this.userId,
            scheduledAt: {
                $gte: startOfDay, // Supérieur ou égal au début de journée
                $lte: endOfDay    // Inférieur ou égal à la fin de journée
            }
        },
        {
            sort: { scheduledAt: 1 } // Tri chronologique (plus ancien en premier pour la journée)
        }
    );
});

/**
 * ⚠️ PUBLICATION EN RETARD - ÉVÉNEMENTS NON TERMINÉS ET DÉPASSÉS
 * 
 * Expose les événements en retard (non terminés avec date dépassée)
 * Utilisée pour les alertes et notifications
 */
Meteor.publish('events.overdue', function () {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        return this.ready();
    }

    const now = new Date();

    // 📊 RETOURNER LES ÉVÉNEMENTS EN RETARD
    return EventsCollection.find(
        {
            ownerId: this.userId,
            isCompleted: false,           // Non terminés
            scheduledAt: { $lt: now }     // Date prévue < maintenant
        },
        {
            sort: { scheduledAt: 1 } // Tri chronologique (plus ancien en premier = plus urgent)
        }
    );
});

/**
 * 📊 PUBLICATION AVEC FILTRES - ÉVÉNEMENTS FILTRÉS PAR CRITÈRES
 * 
 * Publication flexible avec filtres multiples
 * Utilisée pour les recherches et vues personnalisées
 * 
 * @param {Object} filters - Critères de filtrage
 * @param {Object} options - Options de tri et pagination
 */
Meteor.publish('events.filtered', function (filters = {}, options = {}) {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        return this.ready();
    }

    // 📋 VALIDATION DES PARAMÈTRES
    check(filters, Object);
    check(options, Object);

    // 🔍 CONSTRUIRE LA REQUÊTE DE BASE (SÉCURISÉE)
    const query = {
        ownerId: this.userId // Toujours filtrer par utilisateur
    };

    // 📝 AJOUTER LES FILTRES AUTORISÉS
    if (filters.type && typeof filters.type === 'string') {
        query.type = filters.type;
    }

    if (filters.isCompleted !== undefined && typeof filters.isCompleted === 'boolean') {
        query.isCompleted = filters.isCompleted;
    }

    if (filters.priority && typeof filters.priority === 'string') {
        query.priority = filters.priority;
    }

    if (filters.fishId && typeof filters.fishId === 'string') {
        query.fishId = filters.fishId;
    }

    // 📅 FILTRES DE DATE
    if (filters.dateFrom || filters.dateTo) {
        query.scheduledAt = {};

        if (filters.dateFrom && filters.dateFrom instanceof Date) {
            query.scheduledAt.$gte = filters.dateFrom;
        }

        if (filters.dateTo && filters.dateTo instanceof Date) {
            query.scheduledAt.$lte = filters.dateTo;
        }
    }

    // ⚙️ CONSTRUIRE LES OPTIONS DE REQUÊTE
    const queryOptions = {
        sort: options.sort || { scheduledAt: -1 }, // Tri par défaut
        limit: Math.min(options.limit || 50, 100)  // Limite max de 100 pour les performances
    };

    // 📊 RETOURNER LES ÉVÉNEMENTS FILTRÉS
    return EventsCollection.find(query, queryOptions);
});

/**
 * 📈 PUBLICATION DES STATISTIQUES - COMPTEURS ET MÉTRIQUES
 * 
 * Expose des statistiques calculées en temps réel
 * Utilisée pour les tableaux de bord et indicateurs
 * 
 * Note : Cette publication utilise une approche différente car elle ne retourne pas
 * directement des documents de collection, mais des données calculées
 */
Meteor.publish('events.stats', function () {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        return this.ready();
    }

    // 📊 PUBLICATION RÉACTIVE DES STATISTIQUES
    const self = this;
    let initializing = true;

    // 🔄 OBSERVER LES CHANGEMENTS DANS LA COLLECTION
    const handle = EventsCollection.find({ ownerId: this.userId }).observe({
        added: function () {
            if (!initializing) {
                self.changed('eventStats', 'user-' + self.userId, calculateStats(self.userId));
            }
        },
        changed: function () {
            self.changed('eventStats', 'user-' + self.userId, calculateStats(self.userId));
        },
        removed: function () {
            self.changed('eventStats', 'user-' + self.userId, calculateStats(self.userId));
        }
    });

    // 📈 ENVOYER LES STATISTIQUES INITIALES
    self.added('eventStats', 'user-' + this.userId, calculateStats(this.userId));
    initializing = false;
    self.ready();

    // 🧹 NETTOYAGE À LA DÉCONNEXION
    self.onStop(function () {
        handle.stop();
    });
});

/**
 * 🧮 FONCTION HELPER : CALCULER LES STATISTIQUES
 * 
 * Calcule les statistiques pour un utilisateur donné
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} - Statistiques calculées
 */
function calculateStats(userId) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // 📊 CALCULS SYNCHRONES POUR LES STATISTIQUES
    const total = EventsCollection.find({ ownerId: userId }).count();
    const completed = EventsCollection.find({ ownerId: userId, isCompleted: true }).count();
    const pending = EventsCollection.find({ ownerId: userId, isCompleted: false }).count();
    const overdue = EventsCollection.find({
        ownerId: userId,
        isCompleted: false,
        scheduledAt: { $lt: now }
    }).count();

    const todayTotal = EventsCollection.find({
        ownerId: userId,
        scheduledAt: { $gte: startOfDay, $lte: endOfDay }
    }).count();

    const todayCompleted = EventsCollection.find({
        ownerId: userId,
        isCompleted: true,
        scheduledAt: { $gte: startOfDay, $lte: endOfDay }
    }).count();

    return {
        total,
        completed,
        pending,
        overdue,
        today: {
            total: todayTotal,
            completed: todayCompleted,
            remaining: todayTotal - todayCompleted
        },
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        lastUpdated: new Date()
    };
}

/**
 * 📡 ENREGISTREMENT DES PUBLICATIONS
 * 
 * Fonction pour activer toutes les publications
 * À appeler dans server/main.js
 */
export const registerEventPublications = () => {
    // Les publications sont automatiquement enregistrées par les appels Meteor.publish() ci-dessus
}; 
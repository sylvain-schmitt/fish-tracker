import { Mongo } from 'meteor/mongo';

/**
 * 📅 COLLECTION DES ÉVÉNEMENTS - SUIVI DES ACTIVITÉS
 * 
 * Cette collection stocke tous les événements liés aux poissons :
 * - Nourrissage planifié et réalisé
 * - Nettoyage d'aquarium
 * - Soins vétérinaires
 * - Observations comportementales
 * 
 * 📚 Concepts Meteor appris :
 * - Relations entre collections (Events ↔ Fish)
 * - Gestion des dates et planification
 * - États des tâches (planifié, en cours, terminé)
 * - Requêtes complexes avec filtres temporels
 */

// Création de la collection MongoDB
export const EventsCollection = new Mongo.Collection('events');

/**
 * 📋 SCHÉMA DE DONNÉES D'UN ÉVÉNEMENT
 * 
 * Structure d'un document événement dans MongoDB :
 * {
 *   _id: "event123",                    // ID unique généré par MongoDB
 *   fishId: "fish456",                  // ID du poisson concerné (null pour événements d'aquarium)
 *   targetType: "fish",                 // Type de cible : "fish" ou "aquarium"
 *   aquariumId: null,                   // ID de l'aquarium (futur) ou null
 *   type: "feeding",                    // Type d'événement (voir EVENT_TYPES)
 *   title: "Nourrissage matin",         // Titre personnalisable
 *   description: "2 granulés + vitamines", // Description détaillée (optionnelle)
 *   scheduledAt: Date,                  // Date/heure prévue
 *   completedAt: Date,                  // Date/heure de réalisation (null si pas fait)
 *   isCompleted: false,                 // Statut de l'événement
 *   priority: "medium",                 // Priorité (low, medium, high)
 *   recurrence: null,                   // Récurrence (daily, weekly, monthly, null)
 *   nextOccurrence: Date,               // Prochaine occurrence si récurrent
 *   notes: "Poisson très actif",        // Notes après réalisation
 *   ownerId: "user789",                 // ID du propriétaire
 *   createdAt: Date,                    // Date de création
 *   updatedAt: Date                     // Date de dernière modification
 * }
 */

/**
 * 🔧 VALIDATION DES DONNÉES D'ÉVÉNEMENT
 * 
 * Valide les données avant insertion/modification
 * @param {Object} eventData - Données de l'événement à valider
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateEventData = (eventData) => {
    const errors = [];

    // Validation du targetType (obligatoire)
    const validTargetTypes = ['fish', 'aquarium'];
    if (!eventData.targetType || !validTargetTypes.includes(eventData.targetType)) {
        errors.push(`Le type de cible doit être : ${validTargetTypes.join(', ')}`);
    }

    // Validation du fishId (obligatoire seulement pour targetType = 'fish')
    if (eventData.targetType === 'fish') {
        if (!eventData.fishId || typeof eventData.fishId !== 'string') {
            errors.push('L\'ID du poisson est obligatoire pour les événements de poisson');
        }
    }

    // Validation du type (obligatoire, valeurs prédéfinies)
    const validTypes = Object.keys(EVENT_TYPES);
    if (!eventData.type || !validTypes.includes(eventData.type)) {
        errors.push(`Le type d'événement doit être : ${validTypes.join(', ')}`);
    }

    // Validation de cohérence : aquarium_medication doit avoir targetType = 'aquarium'
    if (eventData.type === 'aquarium_medication' && eventData.targetType !== 'aquarium') {
        errors.push('Les traitements d\'aquarium doivent avoir targetType = "aquarium"');
    }

    // Validation du titre (obligatoire, 2-100 caractères)
    if (!eventData.title || typeof eventData.title !== 'string') {
        errors.push('Le titre de l\'événement est obligatoire');
    } else if (eventData.title.trim().length < 2) {
        errors.push('Le titre doit contenir au moins 2 caractères');
    } else if (eventData.title.trim().length > 100) {
        errors.push('Le titre ne peut pas dépasser 100 caractères');
    }

    // Validation de la date prévue (obligatoire)
    if (!eventData.scheduledAt || !(eventData.scheduledAt instanceof Date)) {
        errors.push('La date prévue est obligatoire');
    } else if (eventData.scheduledAt < new Date('2020-01-01')) {
        errors.push('La date prévue ne peut pas être antérieure à 2020');
    }

    // Validation de la priorité (valeurs prédéfinies)
    const validPriorities = Object.keys(EVENT_PRIORITIES);
    if (eventData.priority && !validPriorities.includes(eventData.priority)) {
        errors.push(`La priorité doit être : ${validPriorities.join(', ')}`);
    }

    // Validation de la récurrence (valeurs prédéfinies ou null)
    if (eventData.recurrence) {
        const validRecurrences = Object.keys(EVENT_RECURRENCES);
        if (!validRecurrences.includes(eventData.recurrence)) {
            errors.push(`La récurrence doit être : ${validRecurrences.join(', ')}`);
        }
    }

    // Validation de la description (optionnelle, max 500 caractères)
    if (eventData.description && typeof eventData.description === 'string' && eventData.description.length > 500) {
        errors.push('La description ne peut pas dépasser 500 caractères');
    }

    // Validation des notes (optionnelles, max 500 caractères)
    if (eventData.notes && typeof eventData.notes === 'string' && eventData.notes.length > 500) {
        errors.push('Les notes ne peuvent pas dépasser 500 caractères');
    }

    // Validation de cohérence : completedAt doit être après scheduledAt
    if (eventData.completedAt && eventData.scheduledAt) {
        if (eventData.completedAt < eventData.scheduledAt) {
            errors.push('La date de réalisation ne peut pas être antérieure à la date prévue');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * 🏷️ CONSTANTES POUR LES TYPES D'ÉVÉNEMENTS
 * Utilisées dans les formulaires et validations
 */
export const EVENT_TYPES = {
    feeding: {
        label: 'Nourrissage',
        icon: '🍽️',
        color: 'bg-green-100 text-green-800',
        description: 'Distribution de nourriture'
    },
    cleaning: {
        label: 'Nettoyage',
        icon: '🧽',
        color: 'bg-blue-100 text-blue-800',
        description: 'Nettoyage de l\'aquarium'
    },
    water_change: {
        label: 'Changement d\'eau',
        icon: '💧',
        color: 'bg-cyan-100 text-cyan-800',
        description: 'Renouvellement partiel de l\'eau'
    },
    medication: {
        label: 'Traitement',
        icon: '💊',
        color: 'bg-red-100 text-red-800',
        description: 'Administration de médicaments'
    },
    aquarium_medication: {
        label: 'Traitement aquarium',
        icon: '🏥',
        color: 'bg-red-200 text-red-900',
        description: 'Traitement médicamenteux de tout l\'aquarium'
    },
    observation: {
        label: 'Observation',
        icon: '👁️',
        color: 'bg-purple-100 text-purple-800',
        description: 'Observation comportementale'
    },
    maintenance: {
        label: 'Maintenance',
        icon: '🔧',
        color: 'bg-orange-100 text-orange-800',
        description: 'Maintenance équipement'
    },
    other: {
        label: 'Autre',
        icon: '📝',
        color: 'bg-gray-100 text-gray-800',
        description: 'Autre activité'
    }
};

/**
 * 🏷️ CONSTANTES POUR LES PRIORITÉS
 */
export const EVENT_PRIORITIES = {
    low: {
        label: 'Faible',
        color: 'bg-gray-100 text-gray-800',
        order: 1
    },
    medium: {
        label: 'Moyenne',
        color: 'bg-yellow-100 text-yellow-800',
        order: 2
    },
    high: {
        label: 'Élevée',
        color: 'bg-red-100 text-red-800',
        order: 3
    }
};

/**
 * 🏷️ CONSTANTES POUR LES RÉCURRENCES
 */
export const EVENT_RECURRENCES = {
    daily: {
        label: 'Quotidien',
        description: 'Tous les jours'
    },
    weekly: {
        label: 'Hebdomadaire',
        description: 'Toutes les semaines'
    },
    monthly: {
        label: 'Mensuel',
        description: 'Tous les mois'
    }
};

/**
 * 🔍 REQUÊTES PRÉDÉFINIES
 * Fonctions helper pour les requêtes courantes
 */

/**
 * Récupère tous les événements d'un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @returns {Cursor} - Curseur MongoDB
 */
export const getUserEvents = (userId) => {
    return EventsCollection.find(
        { ownerId: userId },
        { sort: { scheduledAt: -1 } } // Tri par date prévue (plus récent en premier)
    );
};

/**
 * Récupère les événements d'un poisson spécifique
 * @param {String} fishId - ID du poisson
 * @param {String} userId - ID de l'utilisateur (sécurité)
 * @returns {Cursor} - Curseur MongoDB
 */
export const getFishEvents = (fishId, userId) => {
    return EventsCollection.find(
        {
            fishId: fishId,
            ownerId: userId
        },
        { sort: { scheduledAt: -1 } }
    );
};

/**
 * Récupère les événements en retard (non complétés et date dépassée)
 * @param {String} userId - ID de l'utilisateur
 * @returns {Cursor} - Curseur MongoDB
 */
export const getOverdueEvents = (userId) => {
    return EventsCollection.find({
        ownerId: userId,
        isCompleted: false,
        scheduledAt: { $lt: new Date() } // Date prévue < maintenant
    }, {
        sort: { scheduledAt: 1 } // Plus ancien en premier
    });
};

/**
 * Récupère les événements du jour
 * @param {String} userId - ID de l'utilisateur
 * @param {Date} targetDate - Date cible (par défaut aujourd'hui)
 * @returns {Cursor} - Curseur MongoDB
 */
export const getTodayEvents = (userId, targetDate = new Date()) => {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return EventsCollection.find({
        ownerId: userId,
        scheduledAt: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }, {
        sort: { scheduledAt: 1 } // Chronologique
    });
};

/**
 * Compte les événements par statut pour un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} - Statistiques des événements
 */
export const getEventStats = (userId) => {
    // Cette fonction sera utilisée côté serveur pour calculer les stats
    // Elle retourne un objet avec les compteurs par statut
    return {
        total: EventsCollection.find({ ownerId: userId }).count(),
        completed: EventsCollection.find({ ownerId: userId, isCompleted: true }).count(),
        pending: EventsCollection.find({ ownerId: userId, isCompleted: false }).count(),
        overdue: EventsCollection.find({
            ownerId: userId,
            isCompleted: false,
            scheduledAt: { $lt: new Date() }
        }).count()
    };
}; 
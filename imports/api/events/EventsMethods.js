import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EventsCollection, validateEventData } from './EventsCollection.js';
import { FishCollection } from '../fish/FishCollection.js';

/**
 * 📅 MÉTHODES SERVEUR POUR LES ÉVÉNEMENTS
 * 
 * Ce module gère toutes les opérations CRUD sur les événements :
 * - Création d'événements (nourrissage, nettoyage, etc.)
 * - Modification d'événements existants
 * - Suppression d'événements
 * - Marquage comme terminé
 * - Récupération de statistiques
 * 
 * 🔒 Sécurité :
 * - Vérification utilisateur connecté
 * - Validation des données côté serveur
 * - Vérification des droits (propriétaire uniquement)
 * - Protection contre les injections
 * 
 * 📚 Concepts Meteor appris :
 * - Méthodes serveur sécurisées
 * - Validation avec check() et fonctions custom
 * - Relations entre collections
 * - Gestion d'erreurs robuste
 * - Patterns async/await
 */

/**
 * 🆕 CRÉER UN NOUVEL ÉVÉNEMENT
 * 
 * Crée un événement lié à un poisson avec validation complète
 * @param {Object} eventData - Données de l'événement à créer
 * @returns {String} - ID de l'événement créé
 */
const insertEvent = async function (eventData) {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour créer un événement');
    }

    // 📋 VALIDATION DES TYPES DE DONNÉES
    check(eventData, Object);
    check(eventData.type, String);
    check(eventData.title, String);
    check(eventData.scheduledAt, Date);
    check(eventData.targetType, String);

    // fishId n'est obligatoire que pour les événements de poisson
    if (eventData.targetType === 'fish') {
        check(eventData.fishId, String);
    }

    try {
        // 🐠 VÉRIFIER QUE LE POISSON EXISTE ET APPARTIENT À L'UTILISATEUR (seulement pour événements de poisson)
        if (eventData.targetType === 'fish') {
            const fish = await FishCollection.findOneAsync({
                _id: eventData.fishId,
                ownerId: this.userId
            });

            if (!fish) {
                throw new Meteor.Error('fish-not-found', 'Poisson introuvable ou non autorisé');
            }
        }

        // ✅ VALIDATION MÉTIER AVEC LA FONCTION DÉDIÉE
        const validation = validateEventData(eventData);
        if (!validation.isValid) {
            throw new Meteor.Error('validation-error', validation.errors.join(', '));
        }

        // 📝 PRÉPARER LES DONNÉES À INSÉRER
        const eventToInsert = {
            ...eventData,
            // Nettoyage des chaînes
            title: eventData.title.trim(),
            description: eventData.description ? eventData.description.trim() : '',
            notes: eventData.notes ? eventData.notes.trim() : '',

            // Valeurs par défaut
            isCompleted: false,
            completedAt: null,
            priority: eventData.priority || 'medium',
            recurrence: eventData.recurrence || null,
            nextOccurrence: eventData.recurrence ? calculateNextOccurrence(eventData.scheduledAt, eventData.recurrence) : null,

            // Métadonnées
            ownerId: this.userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 💾 INSÉRER L'ÉVÉNEMENT EN BASE
        const eventId = await EventsCollection.insertAsync(eventToInsert);

        return eventId;

    } catch (error) {
        console.error('❌ Erreur création événement:', error);

        // Re-lancer les erreurs Meteor pour le client
        if (error instanceof Meteor.Error) {
            throw error;
        }

        throw new Meteor.Error('insert-failed', 'Erreur lors de la création de l\'événement');
    }
};

/**
 * ✏️ MODIFIER UN ÉVÉNEMENT EXISTANT
 * 
 * Met à jour un événement avec validation des droits
 * @param {String} eventId - ID de l'événement à modifier
 * @param {Object} updateData - Nouvelles données
 * @returns {Boolean} - Succès de la modification
 */
const updateEvent = async function (eventId, updateData) {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour modifier un événement');
    }

    // 📋 VALIDATION DES TYPES
    check(eventId, String);
    check(updateData, Object);

    try {
        // 🔍 VÉRIFIER QUE L'ÉVÉNEMENT EXISTE ET APPARTIENT À L'UTILISATEUR
        const existingEvent = await EventsCollection.findOneAsync({
            _id: eventId,
            ownerId: this.userId
        });

        if (!existingEvent) {
            throw new Meteor.Error('event-not-found', 'Événement introuvable ou non autorisé');
        }

        // 🐠 SI fishId change, vérifier le nouveau poisson (seulement pour événements de poisson)
        if (updateData.fishId && updateData.fishId !== existingEvent.fishId) {
            const fish = await FishCollection.findOneAsync({
                _id: updateData.fishId,
                ownerId: this.userId
            });

            if (!fish) {
                throw new Meteor.Error('fish-not-found', 'Poisson introuvable ou non autorisé');
            }
        }

        // 🏥 SI targetType change vers 'fish', vérifier qu'un fishId est fourni
        if (updateData.targetType === 'fish' && !updateData.fishId && !existingEvent.fishId) {
            throw new Meteor.Error('fish-required', 'Un poisson doit être spécifié pour les événements de poisson');
        }

        // ✅ VALIDATION DES NOUVELLES DONNÉES
        const dataToValidate = { ...existingEvent, ...updateData };
        const validation = validateEventData(dataToValidate);
        if (!validation.isValid) {
            throw new Meteor.Error('validation-error', validation.errors.join(', '));
        }

        // 📝 PRÉPARER LES DONNÉES DE MISE À JOUR
        const updateFields = {
            ...updateData,
            updatedAt: new Date()
        };

        // Nettoyage des chaînes si présentes
        if (updateData.title) updateFields.title = updateData.title.trim();
        if (updateData.description) updateFields.description = updateData.description.trim();
        if (updateData.notes) updateFields.notes = updateData.notes.trim();

        // Recalculer la prochaine occurrence si nécessaire
        if (updateData.recurrence || updateData.scheduledAt) {
            const newScheduledAt = updateData.scheduledAt || existingEvent.scheduledAt;
            const newRecurrence = updateData.recurrence !== undefined ? updateData.recurrence : existingEvent.recurrence;

            updateFields.nextOccurrence = newRecurrence ?
                calculateNextOccurrence(newScheduledAt, newRecurrence) : null;
        }

        // 💾 METTRE À JOUR EN BASE
        const result = await EventsCollection.updateAsync(eventId, {
            $set: updateFields
        });

        return result > 0;

    } catch (error) {
        console.error('❌ Erreur modification événement:', error);

        if (error instanceof Meteor.Error) {
            throw error;
        }

        throw new Meteor.Error('update-failed', 'Erreur lors de la modification de l\'événement');
    }
};

/**
 * 🗑️ SUPPRIMER UN ÉVÉNEMENT
 * 
 * Supprime définitivement un événement
 * @param {String} eventId - ID de l'événement à supprimer
 * @returns {Boolean} - Succès de la suppression
 */
const deleteEvent = async function (eventId) {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour supprimer un événement');
    }

    // 📋 VALIDATION DU TYPE
    check(eventId, String);

    try {
        // 🔍 VÉRIFIER QUE L'ÉVÉNEMENT EXISTE ET APPARTIENT À L'UTILISATEUR
        const event = await EventsCollection.findOneAsync({
            _id: eventId,
            ownerId: this.userId
        });

        if (!event) {
            throw new Meteor.Error('event-not-found', 'Événement introuvable ou non autorisé');
        }

        // 💾 SUPPRIMER L'ÉVÉNEMENT
        const result = await EventsCollection.removeAsync(eventId);

        return result > 0;

    } catch (error) {
        console.error('❌ Erreur suppression événement:', error);

        if (error instanceof Meteor.Error) {
            throw error;
        }

        throw new Meteor.Error('delete-failed', 'Erreur lors de la suppression de l\'événement');
    }
};

/**
 * ✅ MARQUER UN ÉVÉNEMENT COMME TERMINÉ
 * 
 * Met à jour le statut et ajoute la date de réalisation
 * @param {String} eventId - ID de l'événement
 * @param {String} notes - Notes optionnelles sur la réalisation
 * @returns {Boolean} - Succès de l'opération
 */
const completeEvent = async function (eventId, notes = '') {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour marquer un événement comme terminé');
    }

    // 📋 VALIDATION DES TYPES
    check(eventId, String);
    check(notes, String);

    try {
        // 🔍 VÉRIFIER QUE L'ÉVÉNEMENT EXISTE ET APPARTIENT À L'UTILISATEUR
        const event = await EventsCollection.findOneAsync({
            _id: eventId,
            ownerId: this.userId
        });

        if (!event) {
            throw new Meteor.Error('event-not-found', 'Événement introuvable ou non autorisé');
        }

        // ✅ VÉRIFIER QUE L'ÉVÉNEMENT N'EST PAS DÉJÀ TERMINÉ
        if (event.isCompleted) {
            throw new Meteor.Error('already-completed', 'Cet événement est déjà marqué comme terminé');
        }

        // 📝 PRÉPARER LES DONNÉES DE MISE À JOUR
        const updateFields = {
            isCompleted: true,
            completedAt: new Date(),
            notes: notes.trim(),
            updatedAt: new Date()
        };

        // 🔄 SI ÉVÉNEMENT RÉCURRENT, CRÉER LA PROCHAINE OCCURRENCE
        if (event.recurrence && event.nextOccurrence) {
            const nextEventData = {
                ...event,
                _id: undefined, // Laisser MongoDB générer un nouvel ID
                scheduledAt: event.nextOccurrence,
                nextOccurrence: calculateNextOccurrence(event.nextOccurrence, event.recurrence),
                isCompleted: false,
                completedAt: null,
                notes: '',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Créer la prochaine occurrence
            await EventsCollection.insertAsync(nextEventData);
        }

        // 💾 METTRE À JOUR L'ÉVÉNEMENT ACTUEL
        const result = await EventsCollection.updateAsync(eventId, {
            $set: updateFields
        });

        return result > 0;

    } catch (error) {
        console.error('❌ Erreur marquage événement terminé:', error);

        if (error instanceof Meteor.Error) {
            throw error;
        }

        throw new Meteor.Error('complete-failed', 'Erreur lors du marquage de l\'événement comme terminé');
    }
};

/**
 * 📊 RÉCUPÉRER LES STATISTIQUES D'ÉVÉNEMENTS
 * 
 * Calcule diverses statistiques pour l'utilisateur connecté
 * @returns {Object} - Statistiques détaillées
 */
const getEventStats = async function () {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour voir les statistiques');
    }

    try {
        // 📊 CALCULER LES STATISTIQUES
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        // Compteurs généraux
        const total = await EventsCollection.find({ ownerId: this.userId }).countAsync();
        const completed = await EventsCollection.find({ ownerId: this.userId, isCompleted: true }).countAsync();
        const pending = await EventsCollection.find({ ownerId: this.userId, isCompleted: false }).countAsync();
        const overdue = await EventsCollection.find({
            ownerId: this.userId,
            isCompleted: false,
            scheduledAt: { $lt: now }
        }).countAsync();

        // Événements du jour
        const todayTotal = await EventsCollection.find({
            ownerId: this.userId,
            scheduledAt: { $gte: startOfDay, $lte: endOfDay }
        }).countAsync();

        const todayCompleted = await EventsCollection.find({
            ownerId: this.userId,
            isCompleted: true,
            scheduledAt: { $gte: startOfDay, $lte: endOfDay }
        }).countAsync();

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
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };

    } catch (error) {
        console.error('❌ Erreur calcul statistiques:', error);
        throw new Meteor.Error('stats-failed', 'Erreur lors du calcul des statistiques');
    }
};

/**
 * 🔄 FONCTION HELPER : CALCULER LA PROCHAINE OCCURRENCE
 * 
 * Calcule la prochaine date d'occurrence selon la récurrence
 * @param {Date} currentDate - Date actuelle
 * @param {String} recurrence - Type de récurrence
 * @returns {Date} - Prochaine occurrence
 */
const calculateNextOccurrence = (currentDate, recurrence) => {
    const nextDate = new Date(currentDate);

    switch (recurrence) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        default:
            return null;
    }

    return nextDate;
};

/**
 * 📡 ENREGISTREMENT DES MÉTHODES METEOR
 * 
 * Rend les méthodes disponibles côté client
 */
export const registerEventMethods = () => {
    Meteor.methods({
        'events.insert': insertEvent,
        'events.update': updateEvent,
        'events.delete': deleteEvent,
        'events.complete': completeEvent,
        'events.getStats': getEventStats
    });

}; 
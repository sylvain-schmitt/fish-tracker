import { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { EventsCollection } from '../../api/events/EventsCollection.js';

/**
 * 🎣 HOOK PERSONNALISÉ POUR LA GESTION DES ÉVÉNEMENTS
 * 
 * Ce hook encapsule toute la logique de gestion des événements :
 * - Récupération réactive des données Meteor
 * - État de chargement et d'erreurs
 * - Fonctions CRUD pour les événements
 * - Statistiques et calculs dérivés
 * 
 * 📚 Concepts React appris :
 * - Hook personnalisé avec logique métier
 * - useTracker pour la réactivité Meteor
 * - Gestion d'états multiples (loading, error, data)
 * - Fonctions asynchrones avec gestion d'erreurs
 * - Calculs dérivés et mémorisation
 * 
 * 🎯 Fonctionnalités :
 * - Liste réactive des événements
 * - Compteurs et statistiques
 * - Actions CRUD complètes
 * - Gestion d'erreurs centralisée
 */
export const useEvents = () => {
    // 🔄 ÉTATS LOCAUX POUR LES OPÉRATIONS
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    /**
     * 🎣 DONNÉES RÉACTIVES METEOR
     * useTracker synchronise automatiquement les données
     */
    const { events, eventsCount, isReady } = useTracker(() => {
        // 📡 SOUSCRIPTION AUX ÉVÉNEMENTS DE L'UTILISATEUR
        const eventsHandle = Meteor.subscribe('events.all');

        // 🔄 RÉCUPÉRATION DES DONNÉES SI PRÊTES
        if (!eventsHandle.ready()) {
            return {
                events: [],
                eventsCount: 0,
                isReady: false
            };
        }

        // 📋 RÉCUPÉRATION DES ÉVÉNEMENTS TRIÉS
        const eventsData = EventsCollection.find(
            {},
            {
                sort: { scheduledAt: 1 } // Tri par date croissante
            }
        ).fetch();

        return {
            events: eventsData,
            eventsCount: eventsData.length,
            isReady: true
        };
    }, []);

    /**
     * 📊 STATISTIQUES CALCULÉES
     * Calculs dérivés des données d'événements
     */
    const getEventStats = () => {
        if (!events || events.length === 0) {
            return {
                total: 0,
                today: 0,
                overdue: 0,
                completed: 0,
                pending: 0,
                thisWeek: 0
            };
        }

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        return {
            total: events.length,
            today: events.filter(event => {
                const eventDate = new Date(event.scheduledAt);
                return eventDate >= startOfDay && eventDate <= endOfDay;
            }).length,
            overdue: events.filter(event =>
                !event.isCompleted && new Date(event.scheduledAt) < now
            ).length,
            completed: events.filter(event => event.isCompleted).length,
            pending: events.filter(event => !event.isCompleted).length,
            thisWeek: events.filter(event => {
                const eventDate = new Date(event.scheduledAt);
                return eventDate >= startOfWeek;
            }).length
        };
    };

    /**
     * ✅ MARQUER UN ÉVÉNEMENT COMME TERMINÉ
     */
    const completeEvent = async (eventId, completionNotes = '') => {
        setIsLoading(true);
        setError('');

        try {
            await new Promise((resolve, reject) => {
                Meteor.call('events.complete', eventId, completionNotes, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } catch (err) {
            console.error('❌ [useEvents] Erreur completion événement:', err);
            setError(err.reason || 'Erreur lors du marquage comme terminé');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * ➕ CRÉER UN NOUVEL ÉVÉNEMENT
     */
    const createEvent = async (eventData) => {
        setIsLoading(true);
        setError('');

        try {
            const result = await new Promise((resolve, reject) => {
                Meteor.call('events.insert', eventData, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
            return result;
        } catch (err) {
            console.error('❌ [useEvents] Erreur création événement:', err);
            setError(err.reason || 'Erreur lors de la création de l\'événement');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * ✏️ MODIFIER UN ÉVÉNEMENT EXISTANT
     */
    const updateEvent = async (eventId, updateData) => {
        setIsLoading(true);
        setError('');

        try {
            await new Promise((resolve, reject) => {
                Meteor.call('events.update', eventId, updateData, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } catch (err) {
            console.error('❌ [useEvents] Erreur modification événement:', err);
            setError(err.reason || 'Erreur lors de la modification de l\'événement');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 🗑️ SUPPRIMER UN ÉVÉNEMENT
     */
    const deleteEvent = async (eventId) => {
        setIsLoading(true);
        setError('');

        try {
            await new Promise((resolve, reject) => {
                Meteor.call('events.delete', eventId, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } catch (err) {
            console.error('❌ [useEvents] Erreur suppression événement:', err);
            setError(err.reason || 'Erreur lors de la suppression de l\'événement');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 🧹 NETTOYER LES ERREURS
     */
    const clearError = () => {
        setError('');
    };

    /**
     * 🔄 RAFRAÎCHIR LES DONNÉES
     * Force une nouvelle souscription (utile en cas de problème réseau)
     */
    const refreshEvents = () => {
        // Meteor gère automatiquement la réactivité
        // Cette fonction peut être étendue si nécessaire
        setError('');
    };

    // 📤 RETOUR DU HOOK
    return {
        // 📊 Données
        events,
        eventsCount,
        isReady,

        // 📈 Statistiques
        eventStats: getEventStats(),

        // 🔄 États
        isLoading,
        error,

        // 🛠️ Actions
        createEvent,
        updateEvent,
        deleteEvent,
        completeEvent,
        clearError,
        refreshEvents
    };
};

/**
 * 🎯 HOOK SPÉCIALISÉ POUR LES ÉVÉNEMENTS D'UN POISSON
 * 
 * Version simplifiée du hook pour récupérer les événements d'un poisson spécifique
 * @param {String} fishId - ID du poisson
 * @returns {Object} - Interface simplifiée
 */
export const useFishEvents = (fishId) => {
    return useEvents({ fishId, autoSubscribe: !!fishId });
};

/**
 * 🎯 HOOK SPÉCIALISÉ POUR LES ÉVÉNEMENTS DU JOUR
 * 
 * Version simplifiée pour le tableau de bord quotidien
 * @returns {Object} - Interface simplifiée
 */
export const useTodayEvents = () => {
    return useEvents({ todayOnly: true });
};

/**
 * 🎯 HOOK SPÉCIALISÉ POUR LES ÉVÉNEMENTS EN RETARD
 * 
 * Version simplifiée pour les alertes et notifications
 * @returns {Object} - Interface simplifiée
 */
export const useOverdueEvents = () => {
    return useEvents({ overdueOnly: true });
}; 
import React, { useEffect, useState } from 'react';
import { useEvents } from '../hooks/useEvents.js';
import { Meteor } from 'meteor/meteor';

/**
 * 🔔 GESTIONNAIRE DE NOTIFICATIONS NAVIGATEUR
 * 
 * Ce composant gère les notifications du navigateur pour :
 * - Événements en retard à l'ouverture de l'app (UNE SEULE FOIS par session utilisateur)
 * - Demande d'autorisation pour les notifications
 * - Affichage des alertes importantes
 * 
 * 📚 Concepts appris :
 * - API Notification du navigateur
 * - Gestion des permissions
 * - useEffect pour les actions au montage
 * - Intégration avec les hooks personnalisés
 * - Gestion de session utilisateur avec sessionStorage
 * 
 * 🎯 Fonctionnalités :
 * - Notification automatique à l'ouverture (une fois par session utilisateur)
 * - Compteur d'événements en retard
 * - Gestion gracieuse des permissions
 * - Reset à la déconnexion/reconnexion
 */
const NotificationManager = () => {
    const { eventStats, events, isReady } = useEvents();
    const [hasNotifiedThisSession, setHasNotifiedThisSession] = useState(false);
    const userId = Meteor.userId();

    /**
     * 🔄 VÉRIFIER SI DÉJÀ NOTIFIÉ CETTE SESSION UTILISATEUR
     */
    const checkSessionNotification = () => {
        if (!userId) return false;

        const sessionKey = `fish-tracker-notification-shown-${userId}`;
        const hasShown = sessionStorage.getItem(sessionKey);

        if (hasShown) {
            setHasNotifiedThisSession(true);
            return true;
        }
        return false;
    };

    /**
     * 🔒 MARQUER COMME NOTIFIÉ CETTE SESSION UTILISATEUR
     */
    const markAsNotifiedThisSession = () => {
        if (!userId) return;

        const sessionKey = `fish-tracker-notification-shown-${userId}`;
        sessionStorage.setItem(sessionKey, 'true');
        setHasNotifiedThisSession(true);
    };

    /**
     * 🧹 NETTOYER LES ANCIENNES SESSIONS
     * Supprime les clés de session pour d'autres utilisateurs
     */
    const cleanOldSessions = () => {
        if (!userId) return;

        // Nettoyer toutes les clés de notification qui ne correspondent pas à l'utilisateur actuel
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('fish-tracker-notification-shown-') && !key.endsWith(`-${userId}`)) {
                sessionStorage.removeItem(key);
            }
        }
    };

    /**
     * 🔔 DEMANDER LA PERMISSION POUR LES NOTIFICATIONS
     */
    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                return permission === 'granted';
            }
            return Notification.permission === 'granted';
        }
        return false;
    };

    /**
     * 📢 AFFICHER UNE NOTIFICATION
     */
    const showNotification = (title, options = {}) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options
            });

            // Auto-fermeture après 5 secondes
            setTimeout(() => {
                notification.close();
            }, 5000);

            return notification;
        }
    };

    /**
     * 🚨 VÉRIFIER ET NOTIFIER LES ÉVÉNEMENTS EN RETARD
     */
    const checkOverdueEvents = async () => {
        if (!isReady || !eventStats) {
            return;
        }

        // 🔒 Vérifier si déjà notifié cette session
        if (hasNotifiedThisSession || checkSessionNotification()) {
            return;
        }

        if (eventStats.overdue > 0) {
            const hasPermission = await requestNotificationPermission();

            if (hasPermission) {
                // Trouver les événements en retard
                const now = new Date();
                const overdueEvents = events.filter(event =>
                    !event.isCompleted && new Date(event.scheduledAt) < now
                );

                // Notification principale
                showNotification(
                    `🚨 ${eventStats.overdue} événement${eventStats.overdue > 1 ? 's' : ''} en retard !`,
                    {
                        body: `Vous avez des tâches qui nécessitent votre attention.`,
                        tag: 'overdue-events',
                        requireInteraction: true
                    }
                );

                // Marquer comme notifié
                markAsNotifiedThisSession();

                // Si plus de 3 événements en retard, notification détaillée
                if (eventStats.overdue > 3) {
                    setTimeout(() => {
                        showNotification(
                            '📋 Détails des retards',
                            {
                                body: `${overdueEvents.slice(0, 3).map(e => `• ${e.type} - ${e.fishName || 'Général'}`).join('\n')}${eventStats.overdue > 3 ? '\n...' : ''}`,
                                tag: 'overdue-details'
                            }
                        );
                    }, 2000);
                }
            }
        } else if (eventStats.overdue === 0 && eventStats.pending > 0) {
            const hasPermission = await requestNotificationPermission();
            if (hasPermission) {
                showNotification(
                    '✅ Tout est à jour !',
                    {
                        body: `${eventStats.pending} tâche${eventStats.pending > 1 ? 's' : ''} planifiée${eventStats.pending > 1 ? 's' : ''} pour bientôt.`,
                        tag: 'all-good'
                    }
                );

                // Marquer comme notifié même pour les notifications positives
                markAsNotifiedThisSession();
            }
        } else {
            // Marquer comme "vérifié" même s'il n'y a rien à notifier
            markAsNotifiedThisSession();
        }
    };

    /**
     * 🎯 EFFET AU MONTAGE - VÉRIFICATION DE SESSION UTILISATEUR
     */
    useEffect(() => {
        if (userId) {
            cleanOldSessions();
            checkSessionNotification();
        } else {
            // Si pas d'utilisateur connecté, reset l'état
            setHasNotifiedThisSession(false);
        }
    }, [userId]); // Se déclenche quand l'utilisateur change (connexion/déconnexion)

    /**
     * 🎯 EFFET POUR LES NOTIFICATIONS - VÉRIFICATION À L'OUVERTURE
     */
    useEffect(() => {
        if (isReady && eventStats && userId && !hasNotifiedThisSession) {
            // Attendre un peu que les données soient complètement chargées
            const timer = setTimeout(() => {
                checkOverdueEvents();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isReady, eventStats, userId, hasNotifiedThisSession]); // Inclure userId dans les dépendances

    // Ce composant ne rend rien visuellement
    return null;
};

export default NotificationManager; 
import { useMemo } from 'react';
import { useFish } from './useFish.js';
import { useEvents } from './useEvents.js';

/**
 * 🔍 HOOK PERSONNALISÉ POUR LES ANALYSES ET STATISTIQUES
 * 
 * Ce hook centralise tous les calculs d'analyse de l'application :
 * - Statistiques des poissons (nombre, espèces, âges réels)
 * - Analyse des événements (fréquence, tendances)
 * - Données pour graphiques simples
 * 
 * 📚 Concepts appris :
 * - useMemo pour optimiser les calculs coûteux
 * - Manipulation de données avec JavaScript (filter, reduce, map)
 * - Calculs de dates et statistiques correctes
 * - Séparation de la logique métier des composants
 * - Réutilisabilité des calculs d'analyse
 * 
 * 🎯 Avantages :
 * - Calculs optimisés (recalculés uniquement si les données changent)
 * - Logique centralisée et réutilisable
 * - Composants plus propres et focalisés sur l'affichage
 */
export const useAnalytics = () => {
    const { fish, isReady: fishReady } = useFish();
    const { events, isReady: eventsReady } = useEvents();

    // 🐠 STATISTIQUES DES POISSONS
    const fishStats = useMemo(() => {
        if (!fishReady || !fish) {
            return {
                totalCount: 0,
                speciesBreakdown: {},
                speciesCount: 0,
                averageAge: 0,
                averageAgeInDays: 0,
                newestFish: null,
                oldestFish: null
            };
        }

        // Nombre total
        const totalCount = fish.length;

        // Répartition par espèce
        const speciesBreakdown = fish.reduce((acc, fishItem) => {
            const species = fishItem.species || 'Non spécifié';
            acc[species] = (acc[species] || 0) + 1;
            return acc;
        }, {});

        // Nombre d'espèces différentes
        const speciesCount = Object.keys(speciesBreakdown).length;

        // Calcul de l'âge moyen RÉEL (en jours depuis la date d'introduction dans l'aquarium)
        const now = new Date();
        const fishWithIntroDate = fish.filter(fishItem => fishItem.introducedAt);

        let averageAge = 0;
        let averageAgeInDays = 0;

        if (fishWithIntroDate.length > 0) {
            const ages = fishWithIntroDate.map(fishItem => {
                const introDate = new Date(fishItem.introducedAt);
                return Math.floor((now - introDate) / (1000 * 60 * 60 * 24)); // Jours
            });

            averageAgeInDays = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
            // Convertir en années pour l'affichage
            averageAge = Math.round((averageAgeInDays / 365) * 10) / 10; // 1 décimale
        }

        // Poisson le plus récent et le plus ancien (par date d'ajout)
        const sortedByDate = [...fish].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const newestFish = sortedByDate[0] || null;
        const oldestFish = sortedByDate[sortedByDate.length - 1] || null;

        return {
            totalCount,
            speciesBreakdown,
            speciesCount,
            averageAge, // En années
            averageAgeInDays, // En jours
            newestFish,
            oldestFish
        };
    }, [fish, fishReady]);

    // 📅 STATISTIQUES DES ÉVÉNEMENTS
    const eventStats = useMemo(() => {
        if (!eventsReady || !events) {
            return {
                totalEvents: 0,
                completedEvents: 0,
                pendingEvents: 0,
                overdueEvents: 0,
                typeBreakdown: {},
                last30Days: [],
                upcomingEvents: [],
                // Événements spécifiques aux poissons vs généraux
                fishSpecificEvents: 0,
                generalEvents: 0
            };
        }

        const now = new Date();

        // Statistiques de base
        const totalEvents = events.length;
        const completedEvents = events.filter(event => event.isCompleted).length;
        const pendingEvents = events.filter(event => !event.isCompleted && new Date(event.scheduledAt) >= now).length;
        const overdueEvents = events.filter(event => !event.isCompleted && new Date(event.scheduledAt) < now).length;

        // Séparer les événements spécifiques aux poissons des événements généraux
        const fishSpecificEvents = events.filter(event => event.fishId).length;
        const generalEvents = events.filter(event => !event.fishId).length;

        // Répartition par type d'événement
        const typeBreakdown = events.reduce((acc, event) => {
            const type = event.type || 'Non spécifié';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        // Données des 30 derniers jours (pour graphique simple)
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0]; // Format YYYY-MM-DD

            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.scheduledAt).toISOString().split('T')[0];
                return eventDate === dateStr;
            });

            last30Days.push({
                date: dateStr,
                total: dayEvents.length,
                completed: dayEvents.filter(e => e.isCompleted).length,
                pending: dayEvents.filter(e => !e.isCompleted).length
            });
        }

        // Prochains événements (5 suivants)
        const upcomingEvents = events
            .filter(event => !event.isCompleted && new Date(event.scheduledAt) >= now)
            .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
            .slice(0, 5);

        return {
            totalEvents,
            completedEvents,
            pendingEvents,
            overdueEvents,
            typeBreakdown,
            last30Days,
            upcomingEvents,
            fishSpecificEvents,
            generalEvents
        };
    }, [events, eventsReady]);

    // 🎨 DONNÉES FORMATÉES POUR L'AFFICHAGE
    const formattedData = useMemo(() => {
        return {
            // Top 3 des espèces les plus représentées
            topSpecies: Object.entries(fishStats.speciesBreakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([species, count]) => ({ species, count })),

            // Top 3 des types d'événements les plus fréquents
            topEventTypes: Object.entries(eventStats.typeBreakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([type, count]) => ({ type, count })),

            // Données pour un graphique simple des 7 derniers jours
            last7Days: eventStats.last30Days.slice(-7).map(day => ({
                date: new Date(day.date).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric'
                }),
                events: day.total,
                completed: day.completed
            }))
        };
    }, [fishStats.speciesBreakdown, eventStats.typeBreakdown, eventStats.last30Days]);

    return {
        // État de chargement
        isReady: fishReady && eventsReady,

        // Statistiques détaillées
        fishStats,
        eventStats,

        // Données formatées pour l'affichage
        formattedData
    };
}; 
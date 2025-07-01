import { useState, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { FishCollection } from '../../api/fish/FishCollection.js';

/**
 * 🎣 HOOK PERSONNALISÉ - GESTION DES POISSONS
 * 
 * Ce hook encapsule toute la logique de gestion des poissons :
 * - Récupération réactive des données
 * - Opérations CRUD (Create, Read, Update, Delete)
 * - Gestion des états de chargement et d'erreurs
 * - Communication sécurisée avec le serveur
 * 
 * 📚 Concepts React appris :
 * - Hook personnalisé (use + nom)
 * - useCallback pour optimiser les performances
 * - useState pour l'état local
 * - useTracker pour la réactivité Meteor
 * - Gestion d'erreurs robuste
 */
export const useFish = () => {
    // 🔄 ÉTATS LOCAUX
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // 🔄 DONNÉES RÉACTIVES DEPUIS MONGODB
    // useTracker se reconnecte automatiquement quand les données changent
    const { fish, fishCount, isReady } = useTracker(() => {
        // 📡 SOUSCRIPTION À LA PUBLICATION 'userFish'
        // Ceci demande au serveur d'envoyer les données des poissons de l'utilisateur
        const subscription = Meteor.subscribe('userFish');

        const user = Meteor.user();

        if (!user) {
            return { fish: [], fishCount: 0, isReady: false };
        }

        // ✅ APPROCHE OPTIMISÉE : Souscription + Requête locale
        // Les données sont maintenant synchronisées depuis le serveur
        const fishData = FishCollection.find(
            { ownerId: user._id },
            { sort: { createdAt: -1 } }
        ).fetch();

        return {
            fish: fishData,
            fishCount: fishData.length,
            isReady: subscription.ready() // Attend que la souscription soit prête
        };
    }, []);

    // 🆕 CRÉER UN NOUVEAU POISSON
    const createFish = useCallback(async (fishData) => {

        setIsLoading(true);
        setError(null);

        try {
            // Appel sécurisé de la méthode serveur
            const fishId = await new Promise((resolve, reject) => {
                Meteor.call('fish.create', fishData, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });

            return fishId;

        } catch (err) {
            console.error('❌ [CLIENT] Erreur création poisson:', err);

            // Gestion des différents types d'erreurs
            if (err.error === 'validation-error') {
                setError(`Données invalides: ${err.details.join(', ')}`);
            } else if (err.error === 'not-authorized') {
                setError('Vous devez être connecté pour ajouter un poisson');
            } else {
                setError('Erreur lors de la création du poisson');
            }

            throw err; // Re-throw pour que le composant puisse aussi gérer l'erreur
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ✏️ MODIFIER UN POISSON EXISTANT
    const updateFish = useCallback(async (fishId, fishData) => {

        setIsLoading(true);
        setError(null);

        try {
            const result = await new Promise((resolve, reject) => {
                Meteor.call('fish.update', fishId, fishData, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });

            return result;

        } catch (err) {
            console.error('❌ [CLIENT] Erreur modification poisson:', err);

            if (err.error === 'validation-error') {
                setError(`Données invalides: ${err.details.join(', ')}`);
            } else if (err.error === 'not-found') {
                setError('Poisson non trouvé ou vous n\'avez pas les droits');
            } else {
                setError('Erreur lors de la modification du poisson');
            }

            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 🗑️ SUPPRIMER UN POISSON
    const deleteFish = useCallback(async (fishId) => {

        setIsLoading(true);
        setError(null);

        try {
            const result = await new Promise((resolve, reject) => {
                Meteor.call('fish.delete', fishId, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });

            return result;

        } catch (err) {
            console.error('❌ [CLIENT] Erreur suppression poisson:', err);

            if (err.error === 'not-found') {
                setError('Poisson non trouvé ou vous n\'avez pas les droits');
            } else {
                setError('Erreur lors de la suppression du poisson');
            }

            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 📊 RÉCUPÉRER LES STATISTIQUES
    const getFishStats = useCallback(async () => {

        setIsLoading(true);
        setError(null);

        try {
            const stats = await new Promise((resolve, reject) => {
                Meteor.call('fish.getStats', (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });

            return stats;

        } catch (err) {
            console.error('❌ [CLIENT] Erreur récupération statistiques:', err);
            setError('Erreur lors de la récupération des statistiques');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 🧹 FONCTION POUR NETTOYER LES ERREURS
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // 🎯 RETOUR DU HOOK
    // Toutes les données et fonctions dont les composants ont besoin
    return {
        // Données réactives
        fish,
        fishCount,
        isReady,

        // États
        isLoading,
        error,

        // Actions
        createFish,
        updateFish,
        deleteFish,
        getFishStats,
        clearError
    };
}; 
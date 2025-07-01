import { Meteor } from 'meteor/meteor';
import { FishCollection, validateFishData } from './FishCollection.js';

/**
 * 🔐 MÉTHODES SERVEUR - GESTION DES POISSONS
 * 
 * Ces méthodes s'exécutent côté SERVEUR uniquement.
 * Elles garantissent la sécurité et l'intégrité des données.
 * 
 * 📚 Concepts Meteor appris :
 * - Meteor.methods() pour appels sécurisés client → serveur
 * - Vérification d'authentification obligatoire
 * - Validation côté serveur (incontournable)
 * - Opérations MongoDB sécurisées
 * - Gestion d'erreurs robuste
 */

/**
 * 🆕 CRÉER UN NOUVEAU POISSON
 * 
 * @param {Object} fishData - Données du poisson à créer
 * @returns {String} - ID du poisson créé
 */
const createFish = async function (fishData) {

    // 🔒 SÉCURITÉ 1 : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour ajouter un poisson');
    }

    // 🔒 SÉCURITÉ 2 : Valider les données côté serveur
    const validation = validateFishData(fishData);
    if (!validation.isValid) {
        throw new Meteor.Error('validation-error', 'Données invalides', validation.errors);
    }

    // 🔒 SÉCURITÉ 3 : Préparer les données sécurisées avec filtrage explicite
    // (empêche un utilisateur de créer un poisson avec des champs non autorisés)
    const securedFishData = {
        name: fishData.name,
        species: fishData.species,
        color: fishData.color,
        size: fishData.size,
        aquariumType: fishData.aquariumType,
        notes: fishData.notes,
        photoUrl: fishData.photoUrl,
        photoFileId: fishData.photoFileId,
        introducedAt: fishData.introducedAt,  // 📅 Date d'introduction dans l'aquarium
        ownerId: this.userId,           // Force l'ID de l'utilisateur connecté
        createdAt: new Date(),          // Timestamp serveur (fiable)
        updatedAt: new Date()
    };

    try {
        // 💾 Insertion en base de données (VERSION ASYNCHRONE)
        const fishId = await FishCollection.insertAsync(securedFishData);

        return fishId;

    } catch (error) {
        console.error('❌ [SERVEUR] Erreur création poisson:', error);
        throw new Meteor.Error('creation-failed', 'Erreur lors de la création du poisson');
    }
};

/**
 * ✏️ MODIFIER UN POISSON EXISTANT
 * 
 * @param {String} fishId - ID du poisson à modifier
 * @param {Object} fishData - Nouvelles données du poisson
 * @returns {Number} - Nombre de documents modifiés (1 si succès)
 */
const updateFish = async function (fishId, fishData) {

    // 🔒 SÉCURITÉ 1 : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour modifier un poisson');
    }

    // 🔒 SÉCURITÉ 2 : Vérifier que le poisson existe ET appartient à l'utilisateur
    const existingFish = await FishCollection.findOneAsync({
        _id: fishId,
        ownerId: this.userId  // CRUCIAL : empêche de modifier le poisson d'un autre utilisateur
    });

    if (!existingFish) {
        throw new Meteor.Error('not-found', 'Poisson non trouvé ou vous n\'avez pas les droits pour le modifier');
    }

    // 🔒 SÉCURITÉ 3 : Valider les nouvelles données
    const validation = validateFishData(fishData);
    if (!validation.isValid) {
        throw new Meteor.Error('validation-error', 'Données invalides', validation.errors);
    }

    // 🔒 SÉCURITÉ 4 : Préparer les données sécurisées (sans ownerId modifiable)
    const securedUpdateData = {
        name: fishData.name,
        species: fishData.species,
        color: fishData.color,
        size: fishData.size,
        aquariumType: fishData.aquariumType,
        notes: fishData.notes,
        photoUrl: fishData.photoUrl,
        photoFileId: fishData.photoFileId,
        introducedAt: fishData.introducedAt,  // 📅 Date d'introduction dans l'aquarium
        updatedAt: new Date()
        // ownerId et createdAt ne sont PAS modifiables !
    };

    try {
        // 💾 Mise à jour en base de données (VERSION ASYNCHRONE)
        const result = await FishCollection.updateAsync(
            {
                _id: fishId,
                ownerId: this.userId  // Double sécurité
            },
            { $set: securedUpdateData }
        );

        return result;

    } catch (error) {
        console.error('❌ [SERVEUR] Erreur modification poisson:', error);
        throw new Meteor.Error('update-failed', 'Erreur lors de la modification du poisson');
    }
};

/**
 * 🗑️ SUPPRIMER UN POISSON
 * 
 * @param {String} fishId - ID du poisson à supprimer
 * @returns {Number} - Nombre de documents supprimés (1 si succès)
 */
const deleteFish = async function (fishId) {

    // 🔒 SÉCURITÉ 1 : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour supprimer un poisson');
    }

    // 🔒 SÉCURITÉ 2 : Vérifier que le poisson existe ET appartient à l'utilisateur
    const existingFish = await FishCollection.findOneAsync({
        _id: fishId,
        ownerId: this.userId
    });

    if (!existingFish) {
        throw new Meteor.Error('not-found', 'Poisson non trouvé ou vous n\'avez pas les droits pour le supprimer');
    }

    try {
        // 📸 NOUVEAU : Supprimer l'image associée si elle existe
        if (existingFish.photoUrl) {
            try {
                // Extraire le nom de fichier de l'URL
                const fileName = existingFish.photoUrl.split('/').pop();
                if (fileName && fileName.startsWith('fish-')) {
                    // Appeler la méthode de suppression d'image
                    await new Promise((resolve, reject) => {
                        Meteor.call('images.delete', fileName, this.userId, (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        });
                    });
                }
            } catch (imageError) {
                console.warn(`⚠️ [SERVEUR] Impossible de supprimer l'image : ${imageError.message}`);
                // Ne pas faire échouer la suppression du poisson pour ça
            }
        }

        // 💾 Suppression en base de données (VERSION ASYNCHRONE)
        const result = await FishCollection.removeAsync({
            _id: fishId,
            ownerId: this.userId  // Double sécurité
        });

        return result;

    } catch (error) {
        console.error('❌ [SERVEUR] Erreur suppression poisson:', error);
        throw new Meteor.Error('deletion-failed', 'Erreur lors de la suppression du poisson');
    }
};

/**
 * 📊 OBTENIR LES STATISTIQUES DES POISSONS D'UN UTILISATEUR
 * 
 * @returns {Object} - Statistiques détaillées
 */
const getFishStats = async function () {

    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour voir les statistiques');
    }

    try {
        // Récupération de tous les poissons de l'utilisateur (VERSION ASYNCHRONE)
        const userFish = await FishCollection.find({ ownerId: this.userId }).fetchAsync();

        // Calcul des statistiques
        const stats = {
            totalFish: userFish.length,

            // Répartition par taille
            sizeDistribution: {
                small: userFish.filter(fish => fish.size === 'small').length,
                medium: userFish.filter(fish => fish.size === 'medium').length,
                large: userFish.filter(fish => fish.size === 'large').length
            },

            // Répartition par type d'aquarium
            aquariumTypeDistribution: {
                tropical: userFish.filter(fish => fish.aquariumType === 'tropical').length,
                freshwater: userFish.filter(fish => fish.aquariumType === 'freshwater').length,
                saltwater: userFish.filter(fish => fish.aquariumType === 'saltwater').length
            },

            // Nombre de poissons avec photos
            fishWithPhotos: userFish.filter(fish => fish.photoUrl && fish.photoUrl.trim() !== '').length,

            // Date du dernier poisson ajouté
            lastFishAdded: userFish.length > 0 ?
                Math.max(...userFish.map(fish => fish.createdAt.getTime())) : null
        };

        return stats;

    } catch (error) {
        console.error('❌ [SERVEUR] Erreur calcul statistiques:', error);
        throw new Meteor.Error('stats-failed', 'Erreur lors du calcul des statistiques');
    }
};

/**
 * 🎉 OBTENIR LES RAPPELS D'ANNIVERSAIRE DES POISSONS
 * 
 * @returns {Array} - Liste des rappels d'anniversaire
 */
const getFishAnniversaryReminders = async function () {
    // 🔒 SÉCURITÉ : Vérifier que l'utilisateur est connecté
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour voir les rappels');
    }

    try {
        // Importer la fonction utilitaire
        const { getFishAnniversaryReminders: getReminders } = await import('./FishCollection.js');

        // Récupérer les rappels pour l'utilisateur connecté
        const reminders = await getReminders(this.userId);

        return reminders;

    } catch (error) {
        console.error('❌ [SERVEUR] Erreur récupération rappels:', error);
        throw new Meteor.Error('reminders-failed', 'Erreur lors de la récupération des rappels');
    }
};

/**
 * 🌐 ENREGISTREMENT DES MÉTHODES METEOR
 * 
 * Ces méthodes seront appelables depuis le client avec Meteor.call()
 */
export const registerFishMethods = () => {
    Meteor.methods({
        // Méthodes CRUD
        'fish.create': createFish,
        'fish.update': updateFish,
        'fish.delete': deleteFish,

        // Méthodes utilitaires
        'fish.getStats': getFishStats,
        'fish.getAnniversaryReminders': getFishAnniversaryReminders
    });

}; 
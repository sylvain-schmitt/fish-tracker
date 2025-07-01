import { Mongo } from 'meteor/mongo';

/**
 * 🐠 COLLECTION MONGODB - POISSONS
 * 
 * Cette collection stocke tous les poissons des utilisateurs.
 * 
 * 📚 Concepts Meteor appris :
 * - Collection MongoDB réactive
 * - Schéma de données structuré
 * - Sécurité côté serveur
 * - Indexation pour performance
 * - Gestion de fichiers/images
 */

// Création de la collection MongoDB
export const FishCollection = new Mongo.Collection('fish');

/**
 * 📋 SCHÉMA DE DONNÉES D'UN POISSON
 * 
 * Voici la structure d'un document poisson dans MongoDB :
 * {
 *   _id: "xyz123",                    // ID unique généré par MongoDB
 *   name: "Nemo",                     // Nom du poisson
 *   species: "Poisson-clown",         // Espèce
 *   color: "orange",                  // Couleur principale
 *   size: "small",                    // Taille (small, medium, large)
 *   aquariumType: "tropical",         // Type d'aquarium (tropical, freshwater, saltwater)
 *   notes: "Très actif le matin",     // Notes personnelles
 *   photoUrl: "/uploads/fish/nemo.jpg", // 📸 URL de la photo (optionnelle)
 *   photoFileId: "file123",           // ID du fichier dans le système de fichiers
 *   introducedAt: Date,               // 📅 Date d'introduction dans l'aquarium
 *   ownerId: "abc456",                // ID du propriétaire (utilisateur connecté)
 *   createdAt: Date,                  // Date de création
 *   updatedAt: Date                   // Date de dernière modification
 * }
 */

/**
 * 🔧 FONCTIONS UTILITAIRES POUR LA COLLECTION
 */

/**
 * Valide les données d'un poisson avant insertion/modification
 * @param {Object} fishData - Données du poisson à valider
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateFishData = (fishData) => {
    const errors = [];

    // Validation du nom (obligatoire, 2-50 caractères)
    if (!fishData.name || typeof fishData.name !== 'string') {
        errors.push('Le nom du poisson est obligatoire');
    } else if (fishData.name.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
    } else if (fishData.name.trim().length > 50) {
        errors.push('Le nom ne peut pas dépasser 50 caractères');
    }

    // Validation de l'espèce (obligatoire)
    if (!fishData.species || typeof fishData.species !== 'string') {
        errors.push('L\'espèce du poisson est obligatoire');
    } else if (fishData.species.trim().length < 2) {
        errors.push('L\'espèce doit contenir au moins 2 caractères');
    }

    // Validation de la couleur (obligatoire)
    if (!fishData.color || typeof fishData.color !== 'string') {
        errors.push('La couleur du poisson est obligatoire');
    }

    // Validation de la taille (valeurs prédéfinies)
    const validSizes = ['small', 'medium', 'large'];
    if (!fishData.size || !validSizes.includes(fishData.size)) {
        errors.push('La taille doit être : small, medium ou large');
    }

    // Validation du type d'aquarium (valeurs prédéfinies)
    const validAquariumTypes = ['tropical', 'freshwater', 'saltwater'];
    if (!fishData.aquariumType || !validAquariumTypes.includes(fishData.aquariumType)) {
        errors.push('Le type d\'aquarium doit être : tropical, freshwater ou saltwater');
    }

    // Validation des notes (optionnelles, max 500 caractères)
    if (fishData.notes && typeof fishData.notes === 'string' && fishData.notes.length > 500) {
        errors.push('Les notes ne peuvent pas dépasser 500 caractères');
    }

    // 📸 Validation de la photo (optionnelle)
    if (fishData.photoUrl && typeof fishData.photoUrl !== 'string') {
        errors.push('L\'URL de la photo doit être une chaîne de caractères');
    }

    // Validation de l'extension de fichier photo (sécurité)
    if (fishData.photoUrl) {
        const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const hasValidExtension = validImageExtensions.some(ext =>
            fishData.photoUrl.toLowerCase().endsWith(ext)
        );
        if (!hasValidExtension) {
            errors.push('La photo doit être au format : JPG, PNG, GIF ou WebP');
        }
    }

    // 📅 Validation de la date d'introduction (obligatoire)
    if (!fishData.introducedAt || !(fishData.introducedAt instanceof Date)) {
        errors.push('La date d\'introduction dans l\'aquarium est obligatoire');
    } else if (fishData.introducedAt > new Date()) {
        errors.push('La date d\'introduction ne peut pas être dans le futur');
    } else if (fishData.introducedAt < new Date('2000-01-01')) {
        errors.push('La date d\'introduction ne peut pas être antérieure à l\'an 2000');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * 🏷️ CONSTANTES POUR LES VALEURS PRÉDÉFINIES
 * Utilisées dans les formulaires et validations
 */
export const FISH_SIZES = [
    { value: 'small', label: 'Petit (< 5cm)' },
    { value: 'medium', label: 'Moyen (5-15cm)' },
    { value: 'large', label: 'Grand (> 15cm)' }
];

export const AQUARIUM_TYPES = [
    { value: 'tropical', label: 'Tropical (eau chaude)' },
    { value: 'freshwater', label: 'Eau douce' },
    { value: 'saltwater', label: 'Eau salée' }
];

/**
 * 📸 CONSTANTES POUR LA GESTION DES PHOTOS
 */
export const PHOTO_CONFIG = {
    // Taille maximale : 5MB (unifié)
    maxFileSize: 5 * 1024 * 1024,

    // Extensions autorisées
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],

    // Types MIME autorisés
    allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp'
    ],

    // Dimensions recommandées
    recommendedDimensions: {
        width: 800,
        height: 600
    }
};

/**
 * 🔍 REQUÊTES PRÉDÉFINIES
 * Fonctions helper pour les requêtes courantes
 */

/**
 * Récupère tous les poissons d'un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @returns {Cursor} - Curseur MongoDB
 */
export const getUserFish = (userId) => {
    return FishCollection.find(
        { ownerId: userId },
        { sort: { createdAt: -1 } } // Tri par date de création (plus récent en premier)
    );
};

/**
 * Compte le nombre de poissons d'un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @returns {Number} - Nombre de poissons
 */
export const getUserFishCount = (userId) => {
    return FishCollection.find({ ownerId: userId }).count();
};

/**
 * 📸 Récupère tous les poissons avec photos d'un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @returns {Cursor} - Curseur MongoDB
 */
export const getUserFishWithPhotos = (userId) => {
    return FishCollection.find(
        {
            ownerId: userId,
            photoUrl: { $exists: true, $ne: null, $ne: '' }
        },
        { sort: { createdAt: -1 } }
    );
};

/**
 * 📅 FONCTIONS UTILITAIRES POUR LA DATE D'INTRODUCTION
 */

/**
 * Calcule l'ancienneté d'un poisson en jours
 * @param {Date} introducedAt - Date d'introduction
 * @returns {Number} - Nombre de jours depuis l'introduction
 */
export const calculateFishAge = (introducedAt) => {
    if (!introducedAt || !(introducedAt instanceof Date)) {
        return 0;
    }

    const now = new Date();
    const diffTime = Math.abs(now - introducedAt);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
};

/**
 * Formate l'ancienneté en texte lisible
 * @param {Number} ageInDays - Âge en jours
 * @returns {String} - Texte formaté (ex: "2 ans 3 mois")
 */
export const formatFishAge = (ageInDays) => {
    if (ageInDays < 1) return 'Moins d\'un jour';
    if (ageInDays < 7) return `${ageInDays} jour${ageInDays > 1 ? 's' : ''}`;
    if (ageInDays < 30) {
        const weeks = Math.floor(ageInDays / 7);
        return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }
    if (ageInDays < 365) {
        const months = Math.floor(ageInDays / 30);
        return `${months} mois`;
    }

    const years = Math.floor(ageInDays / 365);
    const remainingDays = ageInDays % 365;
    const months = Math.floor(remainingDays / 30);

    if (months === 0) {
        return `${years} an${years > 1 ? 's' : ''}`;
    }

    return `${years} an${years > 1 ? 's' : ''} ${months} mois`;
};

/**
 * Détermine si un poisson mérite un rappel d'anniversaire
 * @param {Date} introducedAt - Date d'introduction
 * @returns {Object|null} - Objet rappel ou null
 */
export const checkAnniversaryReminder = (introducedAt) => {
    if (!introducedAt || !(introducedAt instanceof Date)) {
        return null;
    }

    const ageInDays = calculateFishAge(introducedAt);
    const now = new Date();

    // Anniversaires mensuels les 6 premiers mois
    if (ageInDays <= 180) {
        const monthsOld = Math.floor(ageInDays / 30);
        const daysSinceLastMonth = ageInDays % 30;

        // Si c'est exactement un mois (±2 jours de tolérance)
        if (daysSinceLastMonth <= 2 && monthsOld > 0) {
            return {
                type: 'monthly',
                age: monthsOld,
                message: `Votre poisson est dans votre aquarium depuis ${monthsOld} mois !`,
                priority: 'low'
            };
        }
    }

    // Anniversaires annuels
    const yearsOld = Math.floor(ageInDays / 365);
    const daysSinceLastYear = ageInDays % 365;

    // Si c'est exactement un an (±3 jours de tolérance)
    if (daysSinceLastYear <= 3 && yearsOld > 0) {
        return {
            type: 'yearly',
            age: yearsOld,
            message: `🎉 Anniversaire ! Votre poisson est dans votre aquarium depuis ${yearsOld} an${yearsOld > 1 ? 's' : ''} !`,
            priority: 'medium'
        };
    }

    return null;
};

/**
 * Récupère tous les poissons avec rappels d'anniversaire
 * @param {String} userId - ID de l'utilisateur
 * @returns {Array} - Liste des rappels
 */
export const getFishAnniversaryReminders = async (userId) => {
    const userFish = await FishCollection.find({ ownerId: userId }).fetchAsync();
    const reminders = [];

    userFish.forEach(fish => {
        const reminder = checkAnniversaryReminder(fish.introducedAt);
        if (reminder) {
            reminders.push({
                ...reminder,
                fishId: fish._id,
                fishName: fish.name,
                introducedAt: fish.introducedAt
            });
        }
    });

    return reminders;
}; 
/**
 * 📸 CONFIGURATION SYSTÈME D'UPLOAD D'IMAGES
 * 
 * Ce fichier centralise toute la configuration pour l'upload et la gestion des images :
 * - Formats acceptés et leurs validations
 * - Limites de taille et contraintes
 * - Configuration du stockage
 * - Fonctions utilitaires de validation
 * - Paramètres d'optimisation
 * 
 * 📚 Concepts appris :
 * - Centralisation de la configuration
 * - Validation côté client ET serveur
 * - Sécurité des uploads de fichiers
 * - Gestion des types MIME
 * - Optimisation des performances
 */

// 🎯 FORMATS D'IMAGES ACCEPTÉS
export const ACCEPTED_IMAGE_FORMATS = {
    // Format JPEG - Le plus courant, bon compromis qualité/taille
    'image/jpeg': {
        extensions: ['.jpg', '.jpeg'],
        maxSize: 5 * 1024 * 1024, // 5MB
        description: 'JPEG'
    },

    // Format PNG - Qualité supérieure, supporte la transparence
    'image/png': {
        extensions: ['.png'],
        maxSize: 5 * 1024 * 1024, // 5MB (unifié)
        description: 'PNG'
    },

    // Format WebP - Moderne, excellente compression
    'image/webp': {
        extensions: ['.webp'],
        maxSize: 5 * 1024 * 1024, // 5MB (unifié)
        description: 'WebP'
    }
};

// 📏 CONTRAINTES GÉNÉRALES
export const IMAGE_CONSTRAINTS = {
    // Taille maximale globale (unifiée à 5MB)
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB pour tous les formats

    // Dimensions recommandées pour les photos de poissons
    RECOMMENDED_DIMENSIONS: {
        width: 800,
        height: 600,
        aspectRatio: '4:3' // Format classique pour photos
    },

    // Dimensions minimales acceptables
    MIN_DIMENSIONS: {
        width: 200,
        height: 150
    },

    // Dimensions maximales (éviter les images trop lourdes)
    MAX_DIMENSIONS: {
        width: 2048,
        height: 1536
    }
};

// 📂 CONFIGURATION DU STOCKAGE
export const STORAGE_CONFIG = {
    // Dossier racine de stockage des images uploadées
    UPLOAD_ROOT_DIRECTORY: 'uploads/fish-photos/',

    // Génération du chemin complet avec dossier utilisateur
    getUserDirectory: (userId) => {
        if (!userId) {
            throw new Error('UserId requis pour générer le dossier utilisateur');
        }
        return `uploads/fish-photos/${userId}/`;
    },

    // Préfixe pour les noms de fichiers (éviter les collisions)
    FILE_PREFIX: 'fish-',

    // Génération d'un nom unique pour chaque image
    generateFileName: (originalName, userId) => {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const extension = originalName.substring(originalName.lastIndexOf('.'));
        return `${STORAGE_CONFIG.FILE_PREFIX}${timestamp}-${randomId}${extension}`;
    },

    // Génération du chemin complet du fichier
    getFullFilePath: (fileName, userId) => {
        const userDirectory = STORAGE_CONFIG.getUserDirectory(userId);
        return userDirectory + fileName;
    },

    // URL de base pour accéder aux images (via notre serveur personnalisé)
    BASE_URL: '/api/images/',

    // Génération de l'URL publique complète
    getPublicUrl: (fileName, userId) => {
        return `${STORAGE_CONFIG.BASE_URL}${userId}/${fileName}`;
    }
};

// 🛡️ FONCTIONS DE VALIDATION CÔTÉ CLIENT
export const ClientValidation = {
    /**
     * Valide le type MIME d'un fichier
     * @param {File} file - Fichier à valider
     * @returns {Object} - {isValid: boolean, error?: string}
     */
    validateFileType: (file) => {
        if (!file || !file.type) {
            return {
                isValid: false,
                error: 'Fichier invalide ou type non détecté'
            };
        }

        if (!ACCEPTED_IMAGE_FORMATS[file.type]) {
            const acceptedTypes = Object.values(ACCEPTED_IMAGE_FORMATS)
                .map(format => format.description)
                .join(', ');

            return {
                isValid: false,
                error: `Format non supporté. Formats acceptés : ${acceptedTypes}`
            };
        }

        return { isValid: true };
    },

    /**
     * Valide la taille d'un fichier
     * @param {File} file - Fichier à valider
     * @returns {Object} - {isValid: boolean, error?: string}
     */
    validateFileSize: (file) => {
        if (!file || typeof file.size !== 'number') {
            return {
                isValid: false,
                error: 'Impossible de déterminer la taille du fichier'
            };
        }

        // Vérifier la limite globale
        if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
            const maxSizeMB = Math.round(IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024));
            return {
                isValid: false,
                error: `Fichier trop volumineux. Taille maximale : ${maxSizeMB}MB`
            };
        }

        // Vérifier la limite spécifique au format
        const formatConfig = ACCEPTED_IMAGE_FORMATS[file.type];
        if (formatConfig && file.size > formatConfig.maxSize) {
            const maxSizeMB = Math.round(formatConfig.maxSize / (1024 * 1024));
            return {
                isValid: false,
                error: `Fichier ${formatConfig.description} trop volumineux. Limite : ${maxSizeMB}MB`
            };
        }

        return { isValid: true };
    },

    /**
     * Validation complète d'un fichier côté client
     * @param {File} file - Fichier à valider
     * @returns {Object} - {isValid: boolean, errors: string[]}
     */
    validateFile: (file) => {
        const errors = [];

        // Validation du type
        const typeValidation = ClientValidation.validateFileType(file);
        if (!typeValidation.isValid) {
            errors.push(typeValidation.error);
        }

        // Validation de la taille
        const sizeValidation = ClientValidation.validateFileSize(file);
        if (!sizeValidation.isValid) {
            errors.push(sizeValidation.error);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// 🔧 UTILITAIRES POUR L'INTERFACE
export const UIHelpers = {
    /**
     * Formate la taille d'un fichier pour l'affichage
     * @param {number} bytes - Taille en bytes
     * @returns {string} - Taille formatée (ex: "2.5 MB")
     */
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    /**
     * Génère la liste des extensions acceptées pour l'input file
     * @returns {string} - Extensions séparées par des virgules
     */
    getAcceptedExtensions: () => {
        return Object.values(ACCEPTED_IMAGE_FORMATS)
            .flatMap(format => format.extensions)
            .join(',');
    },

    /**
     * Génère un texte d'aide pour l'utilisateur
     * @returns {string} - Message d'aide complet
     */
    getHelpText: () => {
        const formats = Object.values(ACCEPTED_IMAGE_FORMATS)
            .map(format => format.description)
            .join(', ');

        const maxSizeMB = Math.round(IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024));

        return `Formats acceptés : ${formats}. Taille maximale : ${maxSizeMB}MB.`;
    }
};

// 🎨 CONFIGURATION D'OPTIMISATION (pour plus tard)
export const OPTIMIZATION_CONFIG = {
    // Qualité de compression JPEG (0-100)
    JPEG_QUALITY: 85,

    // Redimensionnement automatique si l'image est trop grande
    AUTO_RESIZE: true,

    // Dimensions cibles pour l'optimisation
    TARGET_DIMENSIONS: {
        width: 800,
        height: 600,
        maintainAspectRatio: true
    },

    // Génération de miniatures
    GENERATE_THUMBNAILS: true,
    THUMBNAIL_SIZE: {
        width: 200,
        height: 150
    }
};

// 📊 STATISTIQUES ET MONITORING (pour le développement)
export const MONITORING = {
    // Activer les logs détaillés
    ENABLE_DETAILED_LOGS: true,

    // Statistiques d'usage
    trackUpload: (fileName, fileSize, userId) => {
        // Log supprimé pour nettoyer le code
    },

    trackError: (error, context) => {
        console.error(`🚨 Erreur upload [${context}]:`, error);
    }
};

// 🔄 EXPORT PAR DÉFAUT POUR IMPORT SIMPLIFIÉ
export default {
    ACCEPTED_IMAGE_FORMATS,
    IMAGE_CONSTRAINTS,
    STORAGE_CONFIG,
    ClientValidation,
    UIHelpers,
    OPTIMIZATION_CONFIG,
    MONITORING
}; 
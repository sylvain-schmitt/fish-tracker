import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import fs from 'fs';
import path from 'path';
import { STORAGE_CONFIG, ACCEPTED_IMAGE_FORMATS, IMAGE_CONSTRAINTS } from './ImageConfig.js';

/**
 * 🛠️ MÉTHODES SERVEUR POUR L'UPLOAD D'IMAGES
 * 
 * Ce fichier contient toutes les méthodes serveur pour gérer l'upload d'images :
 * - Validation côté serveur (sécurité)
 * - Sauvegarde des fichiers sur le serveur
 * - Gestion des métadonnées en base
 * - Nettoyage des anciens fichiers
 * - Génération d'URLs d'accès
 * 
 * 📚 Concepts Meteor appris :
 * - Meteor.methods() pour les appels serveur
 * - Gestion de fichiers avec Node.js fs
 * - Validation avec check() et Match
 * - Sécurité : authentification et autorisation
 * - Gestion d'erreurs avec Meteor.Error
 * 
 * 🔐 Principe de sécurité :
 * JAMAIS faire confiance au client ! Toujours revalider côté serveur.
 */

// 🔧 UTILITAIRES SERVEUR
const ServerUtils = {
    /**
     * Crée le dossier d'upload pour un utilisateur spécifique
     * AMÉLIORATION SÉCURITÉ : Chaque utilisateur a son propre dossier
     */
    ensureUserUploadDirectory: (userId) => {
        if (!userId) {
            throw new Error('UserId requis pour créer le dossier utilisateur');
        }

        // Dans Meteor, on peut utiliser process.env.PWD ou chercher le dossier parent qui contient .meteor
        let projectRoot;

        // Méthode 1: Utiliser PWD si disponible
        if (process.env.PWD && fs.existsSync(path.join(process.env.PWD, '.meteor'))) {
            projectRoot = process.env.PWD;

        } else {
            // Méthode 2: Remonter depuis process.cwd() jusqu'à trouver .meteor
            let currentDir = process.cwd();
            while (currentDir !== '/' && !fs.existsSync(path.join(currentDir, '.meteor'))) {
                currentDir = path.dirname(currentDir);
            }
            projectRoot = currentDir;
        }

        // Créer le dossier utilisateur spécifique
        const userDirectory = STORAGE_CONFIG.getUserDirectory(userId);
        const uploadPath = path.join(projectRoot, userDirectory);

        // 🔧 CORRECTION : Créer physiquement le dossier s'il n'existe pas
        try {
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
        } catch (error) {
            console.error('❌ Erreur création dossier utilisateur :', error);
            throw new Error(`Impossible de créer le dossier d'upload pour l'utilisateur ${userId}`);
        }

        return uploadPath;
    },

    /**
     * Valide un fichier côté serveur (double sécurité)
     * @param {Buffer} fileBuffer - Contenu du fichier
     * @param {string} fileName - Nom du fichier
     * @param {string} mimeType - Type MIME
     * @returns {Object} - {isValid: boolean, error?: string}
     */
    validateFileServer: (fileBuffer, fileName, mimeType) => {
        // 1. Vérifier que le fichier n'est pas vide
        if (!fileBuffer || fileBuffer.length === 0) {
            return {
                isValid: false,
                error: 'Fichier vide ou corrompu'
            };
        }

        // 2. Vérifier le type MIME
        if (!ACCEPTED_IMAGE_FORMATS[mimeType]) {
            return {
                isValid: false,
                error: `Type de fichier non autorisé : ${mimeType}`
            };
        }

        // 3. Vérifier la taille
        if (fileBuffer.length > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
            const maxSizeMB = Math.round(IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024));
            return {
                isValid: false,
                error: `Fichier trop volumineux. Maximum : ${maxSizeMB}MB`
            };
        }

        // 4. Vérifier la taille spécifique au format
        const formatConfig = ACCEPTED_IMAGE_FORMATS[mimeType];
        if (fileBuffer.length > formatConfig.maxSize) {
            const maxSizeMB = Math.round(formatConfig.maxSize / (1024 * 1024));
            return {
                isValid: false,
                error: `Fichier ${formatConfig.description} trop volumineux. Maximum : ${maxSizeMB}MB`
            };
        }

        // 5. Vérifier l'extension du fichier
        const fileExtension = path.extname(fileName).toLowerCase();
        if (!formatConfig.extensions.includes(fileExtension)) {
            return {
                isValid: false,
                error: `Extension de fichier non valide : ${fileExtension}`
            };
        }

        return { isValid: true };
    },

    /**
     * Supprime un fichier du serveur
     * @param {string} fileName - Nom du fichier à supprimer
     * @param {string} userId - ID de l'utilisateur propriétaire
     */
    deleteFile: (fileName, userId) => {
        if (!fileName || !userId) return;

        try {
            // Utiliser la même logique que pour la création
            let projectRoot;

            if (process.env.PWD && fs.existsSync(path.join(process.env.PWD, '.meteor'))) {
                projectRoot = process.env.PWD;
            } else {
                let currentDir = process.cwd();
                while (currentDir !== '/' && !fs.existsSync(path.join(currentDir, '.meteor'))) {
                    currentDir = path.dirname(currentDir);
                }
                projectRoot = currentDir;
            }

            // Construire le chemin avec le dossier utilisateur
            const userDirectory = STORAGE_CONFIG.getUserDirectory(userId);
            const filePath = path.join(projectRoot, userDirectory, fileName);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error(`❌ Erreur lors de la suppression de ${fileName}:`, error);
        }
    }
};

// 🔐 MÉTHODES METEOR
Meteor.methods({
    /**
     * 📸 UPLOAD D'UNE IMAGE
     * 
     * Cette méthode reçoit un fichier du client et le sauvegarde sur le serveur
     * 
     * @param {Object} fileData - Données du fichier
     * @param {String} fileData.fileName - Nom original du fichier
     * @param {String} fileData.mimeType - Type MIME du fichier
     * @param {Uint8Array} fileData.fileBuffer - Contenu du fichier en binaire
     * @returns {Object} - {fileName: string, url: string, size: number}
     */
    'images.upload'(fileData) {
        // 🔐 SÉCURITÉ : Vérifier que l'utilisateur est connecté
        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour uploader une image');
        }

        // 📋 VALIDATION DES PARAMÈTRES
        check(fileData, {
            fileName: String,
            mimeType: String,
            fileBuffer: Match.Any // Uint8Array depuis le client
        });

        try {
            // 1. Convertir Uint8Array en Buffer Node.js
            const buffer = Buffer.from(fileData.fileBuffer);

            // 2. Validation côté serveur (sécurité critique)
            const validation = ServerUtils.validateFileServer(
                buffer,
                fileData.fileName,
                fileData.mimeType
            );

            if (!validation.isValid) {
                throw new Meteor.Error('validation-error', validation.error);
            }

            // 3. Générer un nom de fichier unique
            const uniqueFileName = STORAGE_CONFIG.generateFileName(
                fileData.fileName,
                this.userId
            );

            // 4. Créer le dossier d'upload si nécessaire
            const uploadDirectory = ServerUtils.ensureUserUploadDirectory(this.userId);

            // 5. Sauvegarder le fichier sur le serveur
            const filePath = path.join(uploadDirectory, uniqueFileName);

            fs.writeFileSync(filePath, buffer);

            // 6. Vérifier que le fichier a bien été créé
            if (!fs.existsSync(filePath)) {
                throw new Meteor.Error('write-error', 'Échec de l\'écriture du fichier');
            }

            // 7. Générer l'URL d'accès public avec le dossier utilisateur
            const publicUrl = STORAGE_CONFIG.getPublicUrl(uniqueFileName, this.userId);

            // 8. Retourner les informations du fichier
            return {
                fileName: uniqueFileName,
                originalName: fileData.fileName,
                url: publicUrl,
                size: buffer.length,
                mimeType: fileData.mimeType,
                uploadedAt: new Date(),
                uploadedBy: this.userId
            };

        } catch (error) {
            console.error('❌ Erreur upload:', error);

            // Retourner une erreur claire au client
            if (error instanceof Meteor.Error) {
                throw error; // Erreur déjà formatée
            } else {
                throw new Meteor.Error('upload-error', 'Erreur lors de l\'upload de l\'image');
            }
        }
    },

    /**
     * 🗑️ SUPPRESSION D'UNE IMAGE
     * 
     * Supprime une image du serveur et nettoie les métadonnées
     * 
     * @param {String} fileName - Nom du fichier à supprimer
     * @param {String} ownerId - ID du propriétaire (sécurité)
     */
    'images.delete'(fileName, ownerId) {
        // 🔐 SÉCURITÉ : Vérifier que l'utilisateur est connecté
        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour supprimer une image');
        }

        // 🔐 SÉCURITÉ : Vérifier que l'utilisateur est le propriétaire
        if (this.userId !== ownerId) {
            throw new Meteor.Error('not-authorized', 'Vous ne pouvez supprimer que vos propres images');
        }

        // 📋 VALIDATION DES PARAMÈTRES
        check(fileName, String);
        check(ownerId, String);

        try {
            // Supprimer le fichier du serveur
            ServerUtils.deleteFile(fileName, this.userId);

            return { success: true };

        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            throw new Meteor.Error('delete-error', 'Erreur lors de la suppression de l\'image');
        }
    },

    /**
     * 📊 INFORMATIONS SUR UNE IMAGE
     * 
     * Récupère les métadonnées d'une image
     * 
     * @param {String} fileName - Nom du fichier
     * @returns {Object} - Informations sur le fichier
     */
    'images.getInfo'(fileName) {
        // 🔐 SÉCURITÉ : Vérifier que l'utilisateur est connecté
        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'Vous devez être connecté');
        }

        check(fileName, String);

        try {
            // Utiliser la même logique que pour la création
            let projectRoot;

            if (process.env.PWD && fs.existsSync(path.join(process.env.PWD, '.meteor'))) {
                projectRoot = process.env.PWD;
            } else {
                let currentDir = process.cwd();
                while (currentDir !== '/' && !fs.existsSync(path.join(currentDir, '.meteor'))) {
                    currentDir = path.dirname(currentDir);
                }
                projectRoot = currentDir;
            }

            // Construire le chemin avec le dossier utilisateur
            const userDirectory = STORAGE_CONFIG.getUserDirectory(this.userId);
            const filePath = path.join(projectRoot, userDirectory, fileName);

            if (!fs.existsSync(filePath)) {
                throw new Meteor.Error('file-not-found', 'Fichier introuvable');
            }

            const stats = fs.statSync(filePath);

            return {
                fileName,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                url: STORAGE_CONFIG.getPublicUrl(fileName, this.userId)
            };

        } catch (error) {
            console.error('❌ Erreur getInfo:', error);

            if (error instanceof Meteor.Error) {
                throw error;
            } else {
                throw new Meteor.Error('info-error', 'Erreur lors de la récupération des informations');
            }
        }
    }
});

/**
 * 🔄 FONCTION D'INITIALISATION
 * 
 * À appeler au démarrage du serveur pour configurer l'upload d'images
 * Note : Les dossiers utilisateur seront créés à la demande lors du premier upload
 */
export const initializeImageUpload = () => {

    // Créer le dossier racine seulement
    let projectRoot;

    if (process.env.PWD && fs.existsSync(path.join(process.env.PWD, '.meteor'))) {
        projectRoot = process.env.PWD;
    } else {
        let currentDir = process.cwd();
        while (currentDir !== '/' && !fs.existsSync(path.join(currentDir, '.meteor'))) {
            currentDir = path.dirname(currentDir);
        }
        projectRoot = currentDir;
    }

    const rootUploadPath = path.join(projectRoot, STORAGE_CONFIG.UPLOAD_ROOT_DIRECTORY);

};

/**
 * 🔄 FONCTION D'ENREGISTREMENT DES MÉTHODES
 * 
 * Enregistre explicitement les méthodes d'images côté serveur
 * Cette fonction confirme que les méthodes sont bien disponibles
 */
export const registerImageMethods = () => {

    // Vérifier que les méthodes sont bien définies
    const methods = ['images.upload', 'images.delete', 'images.getInfo'];

    methods.forEach(methodName => {
        if (!Meteor.server.method_handlers[methodName]) {
            console.error(`❌ Méthode ${methodName} NON trouvée !`);
        }
    });

};

// 🔄 EXPORT DES UTILITAIRES POUR TESTS
export { ServerUtils }; 
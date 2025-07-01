import { useState, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';

/**
 * 🎣 HOOK PERSONNALISÉ POUR L'UPLOAD D'IMAGES
 * 
 * Ce hook encapsule toute la logique d'upload d'images :
 * - Communication avec le serveur Meteor
 * - Gestion des états de chargement et d'erreurs
 * - Conversion des fichiers pour l'envoi
 * - Interface simple et réutilisable
 * 
 * 📚 Concepts React appris :
 * - Hook personnalisé avec useState et useCallback
 * - Gestion d'états asynchrones
 * - FileReader API pour lire les fichiers
 * - Conversion File → Uint8Array → Buffer
 * - Pattern de hook réutilisable
 * 
 * 🎯 Utilisation :
 * const { uploadImage, isUploading, error, clearError } = useImageUpload();
 * const result = await uploadImage(file);
 */
const useImageUpload = () => {
    // 🔄 ÉTATS LOCAUX
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    /**
     * 🔧 FONCTION UTILITAIRE : Convertir File en Uint8Array
     * 
     * Cette fonction lit un fichier et le convertit en format binaire
     * pour l'envoyer au serveur Meteor
     * 
     * @param {File} file - Fichier à convertir
     * @returns {Promise<Uint8Array>} - Données binaires du fichier
     */
    const fileToUint8Array = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                // Convertir ArrayBuffer en Uint8Array
                const arrayBuffer = event.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                resolve(uint8Array);
            };

            reader.onerror = (error) => {
                reject(new Error('Erreur lors de la lecture du fichier'));
            };

            // Lire le fichier comme ArrayBuffer
            reader.readAsArrayBuffer(file);
        });
    }, []);

    /**
     * 📤 FONCTION PRINCIPALE : Upload d'une image
     * 
     * Cette fonction gère tout le processus d'upload :
     * 1. Validation de base
     * 2. Conversion du fichier
     * 3. Envoi au serveur
     * 4. Gestion des erreurs
     * 
     * @param {File} file - Fichier image à uploader
     * @returns {Promise<Object>} - Informations du fichier uploadé
     */
    const uploadImage = useCallback(async (file) => {
        // 1. Validation de base
        if (!file) {
            throw new Error('Aucun fichier fourni');
        }

        // Nettoyer les erreurs précédentes
        setError(null);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // 2. Simuler le progrès (début)
            setUploadProgress(10);

            // 3. Convertir le fichier en format binaire
            const fileBuffer = await fileToUint8Array(file);
            setUploadProgress(30);

            // 4. Préparer les données pour le serveur
            const fileData = {
                fileName: file.name,
                mimeType: file.type,
                fileBuffer: fileBuffer
            };

            setUploadProgress(50);

            // 5. Appeler la méthode serveur
            const result = await new Promise((resolve, reject) => {
                Meteor.call('images.upload', fileData, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });

            // 6. Succès !
            setUploadProgress(100);

            return result;

        } catch (err) {
            console.error('❌ Erreur upload :', err);

            // Formater l'erreur pour l'affichage
            let errorMessage = 'Erreur lors de l\'upload de l\'image';

            if (err.error === 'validation-error') {
                errorMessage = err.reason;
            } else if (err.error === 'not-authorized') {
                errorMessage = 'Vous devez être connecté pour uploader une image';
            } else if (err.reason) {
                errorMessage = err.reason;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            throw new Error(errorMessage);

        } finally {
            setIsUploading(false);
            // Réinitialiser le progrès après un délai
            setTimeout(() => setUploadProgress(0), 1000);
        }
    }, [fileToUint8Array]);

    /**
     * 🗑️ FONCTION : Supprimer une image
     * 
     * Supprime une image du serveur
     * 
     * @param {string} fileName - Nom du fichier à supprimer
     * @param {string} ownerId - ID du propriétaire
     * @returns {Promise<boolean>} - Succès de la suppression
     */
    const deleteImage = useCallback(async (fileName, ownerId) => {
        if (!fileName || !ownerId) {
            throw new Error('Paramètres manquants pour la suppression');
        }

        setError(null);
        setIsUploading(true);

        try {

            const result = await new Promise((resolve, reject) => {
                Meteor.call('images.delete', fileName, ownerId, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });

            return true;

        } catch (err) {
            console.error('❌ Erreur suppression :', err);

            let errorMessage = 'Erreur lors de la suppression de l\'image';

            if (err.error === 'not-authorized') {
                errorMessage = 'Vous n\'êtes pas autorisé à supprimer cette image';
            } else if (err.reason) {
                errorMessage = err.reason;
            }

            setError(errorMessage);
            throw new Error(errorMessage);

        } finally {
            setIsUploading(false);
        }
    }, []);

    /**
     * 📊 FONCTION : Obtenir les informations d'une image
     * 
     * @param {string} fileName - Nom du fichier
     * @returns {Promise<Object>} - Informations du fichier
     */
    const getImageInfo = useCallback(async (fileName) => {
        if (!fileName) {
            throw new Error('Nom de fichier manquant');
        }

        try {
            const result = await new Promise((resolve, reject) => {
                Meteor.call('images.getInfo', fileName, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });

            return result;

        } catch (err) {
            console.error('❌ Erreur getInfo :', err);
            throw err;
        }
    }, []);

    /**
     * 🧹 FONCTION : Nettoyer les erreurs
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * 🔄 FONCTION : Réinitialiser tous les états
     */
    const reset = useCallback(() => {
        setError(null);
        setIsUploading(false);
        setUploadProgress(0);
    }, []);

    // 📤 INTERFACE DU HOOK
    return {
        // États
        isUploading,
        error,
        uploadProgress,

        // Fonctions principales
        uploadImage,
        deleteImage,
        getImageInfo,

        // Utilitaires
        clearError,
        reset
    };
};

export default useImageUpload; 
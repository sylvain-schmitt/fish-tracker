import { useState, useCallback } from 'react';
import { useFish } from './useFish.js';
import useImageUpload from './useImageUpload.js';

/**
 * 🎣 HOOK COMBINÉ : POISSONS + IMAGES
 * 
 * Ce hook combine la gestion des poissons avec l'upload d'images :
 * - Création de poisson avec photo
 * - Modification de poisson avec changement de photo
 * - Suppression de poisson avec nettoyage de la photo
 * - Gestion unifiée des erreurs et du chargement
 * 
 * 📚 Concepts appris :
 * - Composition de hooks personnalisés
 * - Orchestration de plusieurs opérations asynchrones
 * - Gestion d'états complexes
 * - Pattern de hook spécialisé
 * 
 * 🎯 Utilisation :
 * const { createFishWithImage, updateFishWithImage, isLoading } = useFishWithImages();
 */
const useFishWithImages = () => {
    // 🎣 HOOKS COMPOSÉS
    const fishHook = useFish();
    const imageHook = useImageUpload();

    // 🔄 ÉTATS LOCAUX ADDITIONNELS
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState('');

    /**
     * 🐠 CRÉER UN POISSON AVEC IMAGE
     * 
     * @param {Object} fishData - Données du poisson
     * @param {File|null} imageFile - Fichier image (optionnel)
     * @returns {Promise<Object>} - Poisson créé avec URL de l'image
     */
    const createFishWithImage = useCallback(async (fishData, imageFile = null) => {
        setIsProcessing(true);
        setProcessingStep('Préparation...');

        try {
            let photoUrl = fishData.photoUrl || null; // Garder l'URL existante si pas de nouveau fichier

            // 1. Upload de l'image si fournie
            if (imageFile) {
                setProcessingStep('Upload de l\'image...');
                const uploadResult = await imageHook.uploadImage(imageFile);
                photoUrl = uploadResult.url;
            }

            // 2. Créer le poisson avec l'URL de l'image
            setProcessingStep('Création du poisson...');
            const fishDataWithImage = {
                ...fishData,
                photoUrl
            };

            const result = await fishHook.createFish(fishDataWithImage);

            setProcessingStep('Terminé !');
            return result;

        } catch (error) {
            console.error('❌ Erreur création poisson avec image :', error);
            throw error;
        } finally {
            setIsProcessing(false);
            setProcessingStep('');
        }
    }, [fishHook.createFish, imageHook.uploadImage]);

    /**
     * 🐠 MODIFIER UN POISSON AVEC IMAGE
     * 
     * @param {String} fishId - ID du poisson à modifier
     * @param {Object} fishData - Nouvelles données du poisson
     * @param {File|null} imageFile - Nouveau fichier image (optionnel)
     * @param {String|null} currentImageUrl - URL actuelle de l'image (pour suppression)
     * @returns {Promise<Object>} - Poisson modifié
     */
    const updateFishWithImage = useCallback(async (fishId, fishData, imageFile = null, currentImageUrl = null) => {
        setIsProcessing(true);
        setProcessingStep('Préparation...');

        try {
            let photoUrl = fishData.photoUrl;

            // 1. Upload de la nouvelle image si fournie
            if (imageFile) {
                setProcessingStep('Upload de la nouvelle image...');
                const uploadResult = await imageHook.uploadImage(imageFile);
                photoUrl = uploadResult.url;

                // 2. Supprimer l'ancienne image si elle existe
                if (currentImageUrl && currentImageUrl !== photoUrl) {
                    try {
                        setProcessingStep('Suppression de l\'ancienne image...');
                        // Extraire le nom de fichier de l'URL
                        const fileName = currentImageUrl.split('/').pop();
                        await imageHook.deleteImage(fileName, fishData.ownerId || 'current-user');
                    } catch (deleteError) {
                        console.warn('⚠️ Impossible de supprimer l\'ancienne image :', deleteError);
                        // Ne pas faire échouer toute l'opération pour ça
                    }
                }
            }

            // 3. Modifier le poisson avec la nouvelle URL
            setProcessingStep('Modification du poisson...');
            const fishDataWithImage = {
                ...fishData,
                photoUrl
            };

            const result = await fishHook.updateFish(fishId, fishDataWithImage);

            setProcessingStep('Terminé !');
            return result;

        } catch (error) {
            console.error('❌ Erreur modification poisson avec image :', error);
            throw error;
        } finally {
            setIsProcessing(false);
            setProcessingStep('');
        }
    }, [fishHook.updateFish, imageHook.uploadImage, imageHook.deleteImage]);

    /**
     * 🗑️ SUPPRIMER UN POISSON AVEC NETTOYAGE DE L'IMAGE
     * 
     * @param {String} fishId - ID du poisson à supprimer
     * @param {String|null} imageUrl - URL de l'image à supprimer
     * @param {String} ownerId - ID du propriétaire
     * @returns {Promise<boolean>} - Succès de la suppression
     */
    const deleteFishWithImage = useCallback(async (fishId, imageUrl = null, ownerId) => {
        setIsProcessing(true);
        setProcessingStep('Suppression du poisson...');

        try {
            // 1. Supprimer le poisson de la base
            await fishHook.deleteFish(fishId);

            // 2. Supprimer l'image si elle existe
            if (imageUrl) {
                try {
                    setProcessingStep('Suppression de l\'image...');
                    const fileName = imageUrl.split('/').pop();
                    await imageHook.deleteImage(fileName, ownerId);
                } catch (deleteError) {
                    console.warn('⚠️ Impossible de supprimer l\'image :', deleteError);
                    // Ne pas faire échouer l'opération pour ça
                }
            }

            setProcessingStep('Terminé !');
            return true;

        } catch (error) {
            console.error('❌ Erreur suppression poisson avec image :', error);
            throw error;
        } finally {
            setIsProcessing(false);
            setProcessingStep('');
        }
    }, [fishHook.deleteFish, imageHook.deleteImage]);

    /**
     * 🧹 NETTOYER LES ERREURS
     */
    const clearAllErrors = useCallback(() => {
        fishHook.clearError();
        imageHook.clearError();
    }, [fishHook.clearError, imageHook.clearError]);

    // 📤 INTERFACE DU HOOK COMBINÉ
    return {
        // États combinés
        isLoading: fishHook.isLoading || imageHook.isUploading || isProcessing,
        isProcessing,
        processingStep,

        // Erreurs combinées
        error: fishHook.error || imageHook.error,
        fishError: fishHook.error,
        imageError: imageHook.error,

        // Données des poissons (du hook useFish)
        fish: fishHook.fish,
        fishCount: fishHook.fishCount,
        isReady: fishHook.isReady,

        // Fonctions combinées
        createFishWithImage,
        updateFishWithImage,
        deleteFishWithImage,

        // Fonctions individuelles (si besoin)
        createFish: fishHook.createFish,
        updateFish: fishHook.updateFish,
        deleteFish: fishHook.deleteFish,
        uploadImage: imageHook.uploadImage,
        deleteImage: imageHook.deleteImage,

        // Utilitaires
        clearAllErrors,
        clearFishError: fishHook.clearError,
        clearImageError: imageHook.clearError,

        // Progrès upload
        uploadProgress: imageHook.uploadProgress
    };
};

export default useFishWithImages; 
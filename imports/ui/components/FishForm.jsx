import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useFish } from '../hooks/useFish.js';
import useImageUpload from '../hooks/useImageUpload.js';
import { FISH_SIZES, AQUARIUM_TYPES } from '../../api/fish/FishCollection.js';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import ImageUpload from './ImageUpload.jsx';

/**
 * 🐠 FORMULAIRE UNIFIÉ - AJOUT ET ÉDITION DE POISSONS
 * 
 * Ce composant intelligent gère à la fois l'ajout et la modification :
 * - Mode déterminé par la présence de fishData
 * - Validation unifiée et cohérente
 * - Configuration d'images centralisée
 * - Élimination de la duplication de code
 * 
 * 📚 Concepts React appris :
 * - Composant polymorphe (2 modes dans 1 composant)
 * - Props conditionnelles
 * - Logique métier unifiée
 * - Réduction de la duplication de code
 * 
 * 🎯 Props :
 * - isOpen: boolean - État d'ouverture du modal
 * - onClose: function - Callback de fermeture
 * - fishData?: object - Données du poisson (si édition)
 * - mode?: 'add'|'edit' - Mode explicite (optionnel, déduit automatiquement)
 * - onCreateSuccess: function - Callback de succès pour l'ajout
 * - onUpdateSuccess: function - Callback de succès pour la mise à jour
 */
const FishForm = ({
    isOpen,
    onClose,
    fishData = null,
    mode = null,
    onCreateSuccess = null,
    onUpdateSuccess = null
}) => {
    // 🎯 DÉTERMINATION DU MODE
    // Le mode est déduit automatiquement de la présence de fishData
    const isEditMode = mode === 'edit' || (fishData !== null);
    const formTitle = isEditMode ? 'Modifier le poisson ✏️' : 'Ajouter un nouveau poisson 🐠';
    const submitButtonText = isEditMode ? 'Modifier le poisson' : 'Ajouter le poisson';
    const submitLoadingText = isEditMode ? 'Modification...' : 'Ajout...';
    const successMessage = isEditMode ? 'Poisson modifié avec succès !' : 'Poisson ajouté avec succès !';

    // 🎣 HOOKS POUR LA GESTION DES POISSONS ET IMAGES
    const { createFish, updateFish, isLoading, error, clearError } = useFish();
    const { uploadImage, deleteImage } = useImageUpload();

    // 🔄 ÉTAT DU FORMULAIRE
    const [formData, setFormData] = useState({
        name: '',
        species: '',
        color: '',
        size: '',
        aquariumType: '',
        notes: '',
        introducedAt: new Date().toISOString().split('T')[0] // 📅 Date d'aujourd'hui par défaut (format YYYY-MM-DD)
    });

    // 🔄 ÉTATS LOCAUX
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [currentImageUrl, setCurrentImageUrl] = useState('');

    // 🔄 EFFET POUR PRÉ-REMPLIR LE FORMULAIRE EN MODE ÉDITION
    useEffect(() => {
        if (isEditMode && fishData && isOpen) {
            setFormData({
                name: fishData.name || '',
                species: fishData.species || '',
                color: fishData.color || '',
                size: fishData.size || '',
                aquariumType: fishData.aquariumType || '',
                notes: fishData.notes || '',
                introducedAt: fishData.introducedAt
                    ? new Date(fishData.introducedAt).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0]
            });
            setCurrentImageUrl(fishData.photoUrl || '');
            setSelectedImageFile(null);
        } else if (!isEditMode && isOpen) {
            // Réinitialiser le formulaire en mode ajout
            setFormData({
                name: '',
                species: '',
                color: '',
                size: '',
                aquariumType: '',
                notes: '',
                introducedAt: new Date().toISOString().split('T')[0]
            });
            setCurrentImageUrl('');
            setSelectedImageFile(null);
        }
    }, [isEditMode, fishData, isOpen]);

    /**
     * 🔧 GESTION DES CHANGEMENTS DANS LES CHAMPS
     */
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Nettoyer l'erreur de validation pour ce champ
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }

        // Nettoyer l'erreur générale
        if (error) {
            clearError();
        }
    };

    /**
     * 🔧 GESTION DE LA SÉLECTION D'IMAGE
     */
    const handleImageSelect = (file) => {
        setSelectedImageFile(file);
    };

    /**
     * ✅ VALIDATION CÔTÉ CLIENT
     */
    const validateForm = () => {
        const errors = {};

        // Validation du nom (obligatoire, 2-50 caractères)
        if (!formData.name.trim()) {
            errors.name = 'Le nom du poisson est obligatoire';
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Le nom doit contenir au moins 2 caractères';
        } else if (formData.name.trim().length > 50) {
            errors.name = 'Le nom ne peut pas dépasser 50 caractères';
        }

        // Validation de l'espèce (obligatoire)
        if (!formData.species.trim()) {
            errors.species = 'L\'espèce du poisson est obligatoire';
        } else if (formData.species.trim().length < 2) {
            errors.species = 'L\'espèce doit contenir au moins 2 caractères';
        }

        // Validation de la couleur (obligatoire)
        if (!formData.color.trim()) {
            errors.color = 'La couleur du poisson est obligatoire';
        }

        // Validation de la taille (obligatoire)
        if (!formData.size) {
            errors.size = 'La taille du poisson est obligatoire';
        }

        // Validation du type d'aquarium (obligatoire)
        if (!formData.aquariumType) {
            errors.aquariumType = 'Le type d\'aquarium est obligatoire';
        }

        // Validation des notes (optionnelles, max 500 caractères)
        if (formData.notes && formData.notes.length > 500) {
            errors.notes = 'Les notes ne peuvent pas dépasser 500 caractères';
        }

        // 📅 Validation de la date d'introduction (obligatoire)
        if (!formData.introducedAt) {
            errors.introducedAt = 'La date d\'introduction est obligatoire';
        } else {
            const introducedDate = new Date(formData.introducedAt);
            const today = new Date();
            const minDate = new Date('2000-01-01');

            if (introducedDate > today) {
                errors.introducedAt = 'La date d\'introduction ne peut pas être dans le futur';
            } else if (introducedDate < minDate) {
                errors.introducedAt = 'La date d\'introduction ne peut pas être antérieure à l\'an 2000';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * 📤 SOUMISSION DU FORMULAIRE
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Validation côté client
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            let finalFormData = { ...formData };
            let oldImageToDelete = null;

            // 📅 CONVERSION DE LA DATE D'INTRODUCTION
            // Convertir la string date en objet Date pour le serveur
            if (finalFormData.introducedAt) {
                finalFormData.introducedAt = new Date(finalFormData.introducedAt);
            }

            // 2. Gestion de l'image
            if (selectedImageFile) {
                // Upload de la nouvelle image
                const uploadResult = await uploadImage(selectedImageFile);
                finalFormData.photoUrl = uploadResult.url;

                // En mode édition, marquer l'ancienne image pour suppression
                if (isEditMode && currentImageUrl) {
                    const oldFileName = currentImageUrl.split('/').pop();
                    if (oldFileName && oldFileName.startsWith('fish-')) {
                        oldImageToDelete = oldFileName;
                    }
                }
            } else if (isEditMode) {
                // Garder l'image actuelle en mode édition
                finalFormData.photoUrl = currentImageUrl;
            }

            // 3. Appel de la méthode appropriée
            if (isEditMode) {
                await updateFish(fishData._id, finalFormData);
            } else {
                await createFish(finalFormData);
            }

            // 4. Supprimer l'ancienne image si nécessaire
            if (oldImageToDelete && selectedImageFile && isEditMode) {
                try {
                    await deleteImage(oldImageToDelete, fishData.ownerId);
                } catch (deleteError) {
                    // Ne pas faire échouer l'opération pour ça
                }
            }

            // 5. Succès : afficher le message et fermer
            setShowSuccess(true);

            // 🍞 APPELER LE CALLBACK DE SUCCÈS APPROPRIÉ
            const fishName = finalFormData.name;
            if (isEditMode && onUpdateSuccess) {
                onUpdateSuccess(fishName);
            } else if (!isEditMode && onCreateSuccess) {
                onCreateSuccess(fishName);
            }

            setTimeout(() => {
                setShowSuccess(false);
                handleClose();
            }, 2000);

        } catch (err) {
            // L'erreur est déjà gérée par les hooks
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * 🚪 FERMETURE DU FORMULAIRE
     */
    const handleClose = () => {
        // Réinitialiser tous les états
        setFormData({
            name: '',
            species: '',
            color: '',
            size: '',
            aquariumType: '',
            notes: '',
            introducedAt: new Date().toISOString().split('T')[0]
        });
        setValidationErrors({});
        setShowSuccess(false);
        setSelectedImageFile(null);
        setCurrentImageUrl('');
        clearError();
        onClose();
    };

    // Ne pas afficher si fermé
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* 📋 EN-TÊTE DU FORMULAIRE */}
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground">
                        {formTitle}
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* 🚨 AFFICHAGE DES ERREURS GÉNÉRALES */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* 📝 CHAMPS DU FORMULAIRE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Colonne gauche */}
                        <div className="space-y-4">
                            {/* Nom du poisson */}
                            <div>
                                <Label htmlFor="name">Nom du poisson *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Ex: Amphiprion ocellaris, Paracanthurus hepatus..."
                                    disabled={isSubmitting}
                                />
                                {validationErrors.name && (
                                    <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
                                )}
                            </div>

                            {/* Espèce */}
                            <div>
                                <Label htmlFor="species">Espèce *</Label>
                                <Input
                                    id="species"
                                    type="text"
                                    value={formData.species}
                                    onChange={(e) => handleInputChange('species', e.target.value)}
                                    placeholder="Ex: Poisson-clown ocellé, Chirurgien bleu..."
                                    disabled={isSubmitting}
                                />
                                {validationErrors.species && (
                                    <p className="text-sm text-red-600 mt-1">{validationErrors.species}</p>
                                )}
                            </div>

                            {/* Couleur */}
                            <div>
                                <Label htmlFor="color">Couleur principale *</Label>
                                <Input
                                    id="color"
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) => handleInputChange('color', e.target.value)}
                                    placeholder="Ex: Orange et blanc, Bleu royal..."
                                    disabled={isSubmitting}
                                />
                                {validationErrors.color && (
                                    <p className="text-sm text-red-600 mt-1">{validationErrors.color}</p>
                                )}
                            </div>

                            {/* Photo du poisson */}
                            <div>
                                <Label>Photo du poisson</Label>
                                <ImageUpload
                                    onImageSelect={handleImageSelect}
                                    currentImage={currentImageUrl}
                                    disabled={isSubmitting}
                                />
                                {isEditMode && currentImageUrl && !selectedImageFile && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        💡 Sélectionnez une nouvelle image pour remplacer l'actuelle
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Colonne droite */}
                        <div className="space-y-4">
                            {/* Taille */}
                            <div>
                                <Label htmlFor="size">Taille *</Label>
                                <Select
                                    value={formData.size}
                                    onValueChange={(value) => handleInputChange('size', value)}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className={validationErrors.size ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Choisir une taille" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FISH_SIZES.map(size => (
                                            <SelectItem key={size.value} value={size.value}>
                                                {size.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {validationErrors.size && (
                                    <p className="text-sm text-red-600 mt-1">{validationErrors.size}</p>
                                )}
                            </div>

                            {/* Type d'aquarium */}
                            <div>
                                <Label htmlFor="aquariumType">Type d'aquarium *</Label>
                                <Select
                                    value={formData.aquariumType}
                                    onValueChange={(value) => handleInputChange('aquariumType', value)}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className={validationErrors.aquariumType ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Choisir un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AQUARIUM_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {validationErrors.aquariumType && (
                                    <p className="text-sm text-red-600 mt-1">{validationErrors.aquariumType}</p>
                                )}
                            </div>

                            {/* 📅 Date d'introduction */}
                            <div>
                                <Label htmlFor="introducedAt">Date d'introduction dans l'aquarium *</Label>
                                <Input
                                    id="introducedAt"
                                    type="date"
                                    value={formData.introducedAt}
                                    onChange={(e) => handleInputChange('introducedAt', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]} // Empêche les dates futures
                                    min="2000-01-01" // Date minimale
                                    disabled={isSubmitting}
                                />
                                {validationErrors.introducedAt && (
                                    <p className="text-sm text-red-600 mt-1">{validationErrors.introducedAt}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    📅 Date à laquelle ce poisson a été ajouté à votre aquarium
                                </p>
                            </div>

                            {/* Notes personnelles */}
                            <div>
                                <Label htmlFor="notes">Notes personnelles</Label>
                                <textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Comportement, habitudes, remarques..."
                                    rows={4}
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={isSubmitting}
                                />
                                {validationErrors.notes && (
                                    <p className="text-sm text-red-600 mt-1">{validationErrors.notes}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 🎯 BOUTONS D'ACTION */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || showSuccess}
                            className="min-w-[140px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {submitLoadingText}
                                </>
                            ) : (
                                submitButtonText
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FishForm; 
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { ClientValidation, UIHelpers } from '../../api/images/ImageConfig.js';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * 📸 COMPOSANT D'UPLOAD D'IMAGES
 * 
 * Composant réutilisable pour l'upload d'images avec :
 * - Interface drag & drop moderne
 * - Validation en temps réel
 * - Prévisualisation instantanée
 * - Gestion d'erreurs détaillée
 * - États de chargement clairs
 * 
 * 📚 Concepts React appris :
 * - useRef pour accéder au DOM
 * - useCallback pour optimiser les performances
 * - Gestion des événements drag & drop
 * - FileReader API pour prévisualisation
 * - Composition de composants réutilisables
 * 
 * 🎯 Props attendues :
 * - onImageSelect: (file) => void - Callback quand une image est sélectionnée
 * - currentImage?: string - URL de l'image actuelle (pour modification)
 * - isLoading?: boolean - État de chargement
 * - disabled?: boolean - Désactiver le composant
 */
const ImageUpload = ({
    onImageSelect,
    currentImage = null,
    isLoading = false,
    disabled = false
}) => {
    // 🔄 ÉTATS LOCAUX
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(currentImage);
    const [validationErrors, setValidationErrors] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);

    // 📎 RÉFÉRENCE POUR L'INPUT FILE CACHÉ
    const inputRef = useRef(null);

    /**
     * 🔄 EFFET POUR METTRE À JOUR L'APERÇU QUAND L'IMAGE ACTUELLE CHANGE
     * Nécessaire pour les formulaires d'édition
     */
    useEffect(() => {
        setPreviewUrl(currentImage);
    }, [currentImage]);

    /**
     * 🎯 GESTION DE LA SÉLECTION DE FICHIER
     * Valide le fichier et génère la prévisualisation
     */
    const handleFileSelection = useCallback((file) => {
        if (!file) return;

        // 1. Validation avec notre configuration
        const validation = ClientValidation.validateFile(file);

        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            setSelectedFile(null);
            setPreviewUrl(currentImage); // Revenir à l'image actuelle
            return;
        }

        // 2. Fichier valide : nettoyer les erreurs
        setValidationErrors([]);
        setSelectedFile(file);

        // 3. Générer la prévisualisation avec FileReader
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target.result);
        };
        reader.readAsDataURL(file);

        // 4. Notifier le composant parent
        onImageSelect(file);

        // 5. Afficher le succès temporairement
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);

    }, [onImageSelect, currentImage]);

    /**
     * 🎯 GESTION DU DRAG & DROP
     */
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (disabled || isLoading) return;

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileSelection(files[0]);
        }
    }, [disabled, isLoading, handleFileSelection]);

    /**
     * 🎯 GESTION DU CLIC SUR L'INPUT
     */
    const handleInputChange = useCallback((e) => {
        const files = e.target.files;
        if (files && files[0]) {
            handleFileSelection(files[0]);
        }
    }, [handleFileSelection]);

    /**
     * 🎯 OUVRIR LE SÉLECTEUR DE FICHIERS
     */
    const openFileSelector = useCallback(() => {
        if (!disabled && !isLoading && inputRef.current) {
            inputRef.current.click();
        }
    }, [disabled, isLoading]);

    /**
     * 🎯 SUPPRIMER L'IMAGE SÉLECTIONNÉE
     */
    const removeImage = useCallback(() => {
        setSelectedFile(null);
        setPreviewUrl(currentImage);
        setValidationErrors([]);
        setShowSuccess(false);

        // Nettoyer l'input
        if (inputRef.current) {
            inputRef.current.value = '';
        }

        // Notifier le parent qu'on a supprimé la sélection
        onImageSelect(null);
    }, [currentImage, onImageSelect]);

    return (
        <div className="space-y-4">
            {/* 🚨 AFFICHAGE DES ERREURS DE VALIDATION */}
            {validationErrors.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-1">
                            {validationErrors.map((error, index) => (
                                <div key={index}>• {error}</div>
                            ))}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* ✅ AFFICHAGE DU SUCCÈS */}
            {showSuccess && (
                <Alert variant="default" className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        Image sélectionnée avec succès !
                    </AlertDescription>
                </Alert>
            )}

            {/* 📸 ZONE DE PRÉVISUALISATION */}
            {previewUrl && (
                <div className="relative group">
                    <div className="w-full h-48 bg-muted rounded-lg overflow-hidden border">
                        <img
                            src={previewUrl}
                            alt="Prévisualisation"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Bouton de suppression (apparaît au hover) */}
                    {selectedFile && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={removeImage}
                            disabled={disabled || isLoading}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}

                    {/* Informations sur le fichier sélectionné */}
                    {selectedFile && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{selectedFile.name}</span>
                                <span className="text-muted-foreground">
                                    {UIHelpers.formatFileSize(selectedFile.size)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 🎯 ZONE DE DRAG & DROP */}
            <div
                className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${dragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }
                    ${disabled || isLoading
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    }
                `}
                onClick={openFileSelector}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {/* Input file caché */}
                <input
                    ref={inputRef}
                    type="file"
                    accept={UIHelpers.getAcceptedExtensions()}
                    onChange={handleInputChange}
                    disabled={disabled || isLoading}
                    className="hidden"
                />

                {/* Contenu de la zone de drop */}
                <div className="space-y-4">
                    {/* Icône */}
                    <div className="flex justify-center">
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        ) : (
                            <div className={`
                                p-3 rounded-full 
                                ${dragActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                            `}>
                                {previewUrl ? (
                                    <ImageIcon className="h-6 w-6" />
                                ) : (
                                    <Upload className="h-6 w-6" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Texte principal */}
                    <div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            {isLoading ? 'Traitement en cours...' :
                                dragActive ? 'Déposez votre image ici' :
                                    previewUrl ? 'Changer d\'image' : 'Ajouter une photo'}
                        </h3>

                        {!isLoading && (
                            <p className="text-muted-foreground text-sm">
                                {dragActive ?
                                    'Relâchez pour sélectionner cette image' :
                                    'Glissez-déposez une image ou cliquez pour parcourir'
                                }
                            </p>
                        )}
                    </div>

                    {/* Bouton d'action */}
                    {!isLoading && !dragActive && (
                        <Button
                            variant="outline"
                            disabled={disabled}
                            className="pointer-events-none" // Le clic est géré par la div parent
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {previewUrl ? 'Changer l\'image' : 'Sélectionner une image'}
                        </Button>
                    )}
                </div>
            </div>

            {/* 💡 TEXTE D'AIDE */}
            <div className="text-xs text-muted-foreground text-center">
                {UIHelpers.getHelpText()}
            </div>
        </div>
    );
};

export default ImageUpload; 
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useEvents } from '../hooks/useEvents.js';
import { useFish } from '../hooks/useFish.js';
import { EVENT_TYPES, EVENT_PRIORITIES } from '../../api/events/EventsCollection.js';
import { X, Calendar, Clock, Fish, AlertTriangle, Save } from 'lucide-react';

/**
 * 📅 FORMULAIRE D'ÉVÉNEMENT - CRÉATION ET MODIFICATION
 * 
 * Ce composant gère la création et modification d'événements :
 * - Interface modale moderne et responsive
 * - Validation en temps réel avec feedback visuel
 * - Sélection dynamique des poissons
 * - Gestion des types d'événements et priorités
 * - Support des événements d'aquarium complet
 * 
 * 📚 Concepts React appris :
 * - Formulaires contrôlés avec validation
 * - Gestion d'état complexe avec useState
 * - useEffect pour la synchronisation
 * - Modales avec gestion d'événements
 * - Sélecteurs dynamiques et conditionnels
 * - Formatage de dates pour les inputs
 * 
 * @param {boolean} isOpen - Contrôle l'affichage de la modale
 * @param {Function} onClose - Fonction appelée à la fermeture
 * @param {Object} eventData - Données de l'événement (mode édition)
 * @param {string} mode - 'add' ou 'edit'
 * @param {Function} onSuccess - Callback de succès
 */
const EventForm = ({
    isOpen = false,
    onClose,
    eventData = null,
    mode = 'add',
    onSuccess
}) => {
    // 🎣 HOOKS POUR LES DONNÉES ET ACTIONS
    const { createEvent, updateEvent, isLoading, error, clearError } = useEvents();
    const { fish, isReady: fishReady } = useFish();

    // 🔄 ÉTAT DU FORMULAIRE
    const [formData, setFormData] = useState({
        type: 'feeding',
        title: '',
        description: '',
        targetType: 'fish', // 'fish' ou 'aquarium'
        fishId: '',
        scheduledAt: '',
        priority: 'medium',
        notes: ''
    });

    // 🔄 ÉTATS DE VALIDATION ET UI
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * 🔄 EFFET POUR PRÉ-REMPLIR LE FORMULAIRE EN MODE ÉDITION
     * Simplifié pour éviter les interférences avec les Select
     */
    useEffect(() => {
        // Seulement s'exécuter quand la modale s'ouvre pour la première fois
        if (!isOpen) return;

        if (mode === 'edit' && eventData) {
            // Mode édition : pré-remplir avec les données existantes
            const scheduledDate = new Date(eventData.scheduledAt);
            const formattedDate = scheduledDate.toISOString().slice(0, 16);

            setFormData({
                type: eventData.type || 'feeding',
                title: eventData.title || '',
                description: eventData.description || '',
                targetType: eventData.targetType || 'fish',
                fishId: eventData.fishId || '',
                scheduledAt: formattedDate,
                priority: eventData.priority || 'medium',
                notes: eventData.notes || ''
            });
        } else if (mode === 'add') {
            // Mode ajout : valeurs par défaut
            const now = new Date();
            now.setMinutes(now.getMinutes() + 60);
            const defaultDate = now.toISOString().slice(0, 16);

            setFormData({
                type: 'feeding',
                title: '',
                description: '',
                targetType: 'fish',
                fishId: '', // Ne pas auto-sélectionner pour éviter les conflits
                scheduledAt: defaultDate,
                priority: 'medium',
                notes: ''
            });
        }

        // Nettoyer les erreurs
        setErrors({});
        clearError();
    }, [isOpen, mode]); // Suppression de fish et clearError des dépendances

    /**
     * 🔄 GESTION DES CHANGEMENTS DE CHAMPS
     */
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Nettoyer l'erreur du champ modifié
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    /**
     * 🔄 GESTION DU CHANGEMENT DE TYPE D'ÉVÉNEMENT
     * Mise à jour automatique du titre selon le type
     */
    const handleTypeChange = (newType) => {
        const typeInfo = EVENT_TYPES[newType];

        setFormData(prev => ({
            ...prev,
            type: newType,
            title: prev.title || typeInfo?.label || '',
            // Certains types sont spécifiques à l'aquarium
            targetType: newType === 'aquarium_medication' ? 'aquarium' : prev.targetType
        }));
    };

    /**
     * 🔄 GESTION DU CHANGEMENT DE CIBLE
     */
    const handleTargetTypeChange = (newTargetType) => {
        setFormData(prev => ({
            ...prev,
            targetType: newTargetType,
            fishId: newTargetType === 'aquarium' ? '' : '' // Pas d'auto-sélection
        }));
    };

    /**
     * ✅ VALIDATION DU FORMULAIRE
     */
    const validateForm = () => {
        const newErrors = {};

        // Validation du titre
        if (!formData.title.trim()) {
            newErrors.title = 'Le titre est obligatoire';
        } else if (formData.title.length > 100) {
            newErrors.title = 'Le titre ne peut pas dépasser 100 caractères';
        }

        // Validation de la date
        if (!formData.scheduledAt) {
            newErrors.scheduledAt = 'La date et l\'heure sont obligatoires';
        } else {
            const scheduledDate = new Date(formData.scheduledAt);
            const minDate = new Date();
            minDate.setFullYear(minDate.getFullYear() - 1); // Pas plus d'1 an dans le passé

            if (scheduledDate < minDate) {
                newErrors.scheduledAt = 'La date ne peut pas être trop ancienne';
            }
        }

        // Validation du poisson (seulement pour targetType = 'fish')
        if (formData.targetType === 'fish' && !formData.fishId) {
            newErrors.fishId = 'Vous devez sélectionner un poisson';
        }

        // Validation de la description (optionnelle mais limitée)
        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'La description ne peut pas dépasser 500 caractères';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * 📤 SOUMISSION DU FORMULAIRE
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Préparer les données pour l'envoi
            const eventDataToSend = {
                ...formData,
                scheduledAt: new Date(formData.scheduledAt),
                title: formData.title.trim(),
                description: formData.description.trim(),
                notes: formData.notes.trim()
            };

            // Supprimer fishId pour les événements d'aquarium
            if (formData.targetType === 'aquarium') {
                delete eventDataToSend.fishId;
            }

            if (mode === 'edit' && eventData) {
                await updateEvent(eventData._id, eventDataToSend);
            } else {
                await createEvent(eventDataToSend);
            }

            // Succès : fermer le formulaire et notifier
            onClose();
            if (onSuccess) {
                onSuccess(mode === 'edit' ? 'Événement modifié avec succès !' : 'Événement créé avec succès !');
            }

        } catch (err) {
            console.error('Erreur lors de la soumission:', err);
            // L'erreur est gérée par le hook useEvents
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * 🚪 FERMETURE DE LA MODALE
     */
    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    // Ne pas rendre si la modale n'est pas ouverte
    if (!isOpen) return null;

    const isEditMode = mode === 'edit';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-xl font-bold">
                        {isEditMode ? '✏️ Modifier l\'événement' : '➕ Nouvel événement'}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 🚨 AFFICHAGE DES ERREURS GÉNÉRALES */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* 📋 GRILLE DE CHAMPS PRINCIPAUX */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Colonne gauche */}
                            <div className="space-y-4">
                                {/* Type d'événement */}
                                <div>
                                    <Label htmlFor="type">Type d'événement *</Label>
                                    <Select value={formData.type} onValueChange={handleTypeChange}>
                                        <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Choisir un type d'événement" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(EVENT_TYPES).map(([key, type]) => (
                                                <SelectItem key={key} value={key}>
                                                    {type.icon} {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-red-600 mt-1">{errors.type}</p>
                                    )}
                                </div>

                                {/* Titre */}
                                <div>
                                    <Label htmlFor="title">Titre *</Label>
                                    <Input
                                        id="title"
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="Ex: Nourrissage du matin"
                                        className={errors.title ? 'border-red-500' : ''}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                                    )}
                                </div>

                                {/* Cible de l'événement */}
                                <div>
                                    <Label htmlFor="targetType">Cible *</Label>
                                    <Select value={formData.targetType} onValueChange={handleTargetTypeChange}>
                                        <SelectTrigger className={errors.targetType ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Choisir la cible" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fish">
                                                🐠 Poisson spécifique
                                            </SelectItem>
                                            <SelectItem value="aquarium">
                                                🏠 Aquarium complet
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.targetType && (
                                        <p className="text-sm text-red-600 mt-1">{errors.targetType}</p>
                                    )}
                                </div>

                                {/* Sélection du poisson (conditionnel) */}
                                {formData.targetType === 'fish' && (
                                    <div>
                                        <Label htmlFor="fishId">Poisson concerné *</Label>
                                        {!fishReady ? (
                                            <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted">
                                                Chargement des poissons...
                                            </div>
                                        ) : fish.length === 0 ? (
                                            <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted">
                                                Aucun poisson disponible. Ajoutez d'abord un poisson dans l'onglet Poissons.
                                            </div>
                                        ) : (
                                            <Select
                                                value={formData.fishId}
                                                onValueChange={(value) => handleInputChange('fishId', value)}
                                            >
                                                <SelectTrigger className={errors.fishId ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Sélectionner un poisson" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {fish.map((fishItem) => (
                                                        <SelectItem key={fishItem._id} value={fishItem._id}>
                                                            🐠 {fishItem.name} ({fishItem.species})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        {errors.fishId && (
                                            <p className="text-sm text-red-600 mt-1">{errors.fishId}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Colonne droite */}
                            <div className="space-y-4">
                                {/* Date et heure */}
                                <div>
                                    <Label htmlFor="scheduledAt">Date et heure *</Label>
                                    <Input
                                        id="scheduledAt"
                                        type="datetime-local"
                                        value={formData.scheduledAt}
                                        onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                                        className={errors.scheduledAt ? 'border-red-500' : ''}
                                    />
                                    {errors.scheduledAt && (
                                        <p className="text-sm text-red-600 mt-1">{errors.scheduledAt}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Choisissez la date et l'heure prévues pour cet événement
                                    </p>
                                </div>

                                {/* Priorité */}
                                <div>
                                    <Label htmlFor="priority">Priorité</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value) => handleInputChange('priority', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choisir la priorité" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(EVENT_PRIORITIES).map(([key, priority]) => (
                                                <SelectItem key={key} value={key}>
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-2 h-2 rounded-full ${key === 'high' ? 'bg-red-500' :
                                                            key === 'medium' ? 'bg-yellow-500' :
                                                                'bg-gray-500'
                                                            }`}></div>
                                                        <span>{priority.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        La priorité aide à organiser vos tâches
                                    </p>
                                </div>

                                {/* Aperçu du type sélectionné */}
                                <div>
                                    <Label>Aperçu</Label>
                                    <div className="flex items-center space-x-3 p-3 bg-muted rounded-md border">
                                        <span className="text-2xl">{EVENT_TYPES[formData.type]?.icon}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{EVENT_TYPES[formData.type]?.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {EVENT_TYPES[formData.type]?.description}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={EVENT_TYPES[formData.type]?.color || 'bg-gray-100 text-gray-800'}
                                        >
                                            {formData.targetType === 'fish' ? 'Poisson' : 'Aquarium'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 📝 DESCRIPTION */}
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Détails sur cet événement (optionnel)"
                                rows={3}
                                className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.description ? 'border-red-500' : ''}`}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                {formData.description.length}/500 caractères
                            </p>
                        </div>

                        {/* 🔘 BOUTONS D'ACTION */}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
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
                                disabled={isSubmitting || isLoading}
                                className="flex items-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>{isEditMode ? 'Modification...' : 'Création...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        <span>{isEditMode ? 'Modifier' : 'Créer'}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default EventForm; 
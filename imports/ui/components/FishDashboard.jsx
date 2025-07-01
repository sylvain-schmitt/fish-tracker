import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import Toast from './ui/toast';
import { useFish } from '../hooks/useFish.js';
import FishForm from './FishForm.jsx';
import FishDetail from './FishDetail.jsx';
import { Edit, Trash2, Plus, AlertCircle, Fish, Eye } from 'lucide-react';

/**
 * 🐠 DASHBOARD PRINCIPAL - GESTION DES POISSONS
 * 
 * Ce composant orchestre l'affichage et la gestion des poissons :
 * - Liste des poissons avec pagination
 * - Vue détaillée d'un poisson
 * - Actions CRUD (Create, Read, Update, Delete)
 * - Statistiques et filtres
 * - Interface utilisateur moderne
 * 
 * 📚 Concepts React appris :
 * - Orchestration de composants
 * - Gestion d'état local pour l'UI
 * - Communication avec hooks personnalisés
 * - Modales et confirmations
 * - Navigation conditionnelle entre vues
 * - Formatage de données pour l'affichage
 * 
 * ✨ AMÉLIORATION : Navigation Liste ↔ Détail
 * - Affichage conditionnel entre liste et détail
 * - Bouton "Voir détails" sur chaque card
 * - Actions unifiées (modifier/supprimer depuis la liste ou le détail)
 */
const FishDashboard = () => {
    // 🎣 HOOK PERSONNALISÉ POUR LA GESTION DES POISSONS
    const {
        fish,           // Liste des poissons (réactive)
        fishCount,      // Nombre total de poissons
        isReady,        // État de chargement des données
        isLoading,      // État de chargement des opérations
        error,          // Erreurs éventuelles
        clearError,     // Fonction pour nettoyer les erreurs
        deleteFish      // Fonction pour supprimer un poisson
    } = useFish();

    // 🔄 ÉTATS LOCAUX POUR L'INTERFACE
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState('add'); // 'add' ou 'edit'
    const [selectedFish, setSelectedFish] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [fishToDelete, setFishToDelete] = useState(null);

    // 🆕 NOUVEAUX ÉTATS POUR LA VUE DÉTAIL
    const [viewMode, setViewMode] = useState('list'); // 'list' ou 'detail'
    const [fishInDetail, setFishInDetail] = useState(null);
    const [returnToDetailAfterEdit, setReturnToDetailAfterEdit] = useState(false); // 🆕 Mémoriser si on doit retourner au détail

    // 🍞 ÉTATS POUR LES TOASTS
    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'info' // 'success', 'error', 'info'
    });

    // 🔄 SYNCHRONISATION AUTOMATIQUE DES DONNÉES DU DÉTAIL
    // Quand les données Meteor changent, on met à jour fishInDetail automatiquement
    useEffect(() => {
        if (fishInDetail && fish.length > 0) {
            // Rechercher la version mise à jour du poisson dans la liste réactive
            const updatedFish = fish.find(f => f._id === fishInDetail._id);
            if (updatedFish) {
                // Vérifier si les données ont réellement changé pour éviter les re-renders inutiles
                if (JSON.stringify(updatedFish) !== JSON.stringify(fishInDetail)) {
                    setFishInDetail(updatedFish);
                }
            }
        }
    }, [fish, fishInDetail]); // Se déclenche quand fish ou fishInDetail change

    /**
     * Formatage des données pour l'affichage
     * Ces fonctions transforment les données brutes en texte lisible
     */
    const formatFishSize = (size) => {
        const sizeMap = {
            small: 'Petit',
            medium: 'Moyen',
            large: 'Grand'
        };
        return sizeMap[size] || size;
    };

    const formatAquariumType = (type) => {
        const typeMap = {
            tropical: 'Tropical',
            freshwater: 'Eau douce',
            saltwater: 'Eau salée'
        };
        return typeMap[type] || type;
    };

    /**
     * 🍞 FONCTIONS UTILITAIRES POUR LES TOASTS
     */
    const showToast = (message, type = 'info') => {
        setToast({
            show: true,
            message,
            type
        });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, show: false }));
    };

    // 🎉 CALLBACKS DE SUCCÈS POUR LE FORMULAIRE
    const handleCreateSuccess = (fishName) => {
        showToast(`${fishName} a été ajouté avec succès`, 'success');
    };

    const handleUpdateSuccess = (fishName) => {
        showToast(`${fishName} a été modifié avec succès`, 'success');
    };

    /**
     * 🔧 GESTION DES ACTIONS SUR LES POISSONS
     */

    // Ouvrir le formulaire en mode ajout
    const handleAddFish = () => {
        setFormMode('add');
        setSelectedFish(null);
        setShowForm(true);
    };

    // Ouvrir le formulaire en mode édition
    const handleEditFish = (fishItem) => {
        setFormMode('edit');
        setSelectedFish(fishItem);
        setShowForm(true);

        // 🆕 MÉMORISER SI ON VIENT DE LA VUE DÉTAIL
        if (viewMode === 'detail') {
            setReturnToDetailAfterEdit(true);
            // Mettre à jour fishInDetail si on modifie le poisson actuellement affiché
            if (fishInDetail && fishInDetail._id === fishItem._id) {
                setFishInDetail(fishItem);
            }
        } else {
            setReturnToDetailAfterEdit(false);
        }
    };

    // Fermer le formulaire
    const handleCloseForm = () => {
        setShowForm(false);
        setFormMode('add');
        setSelectedFish(null);

        // 🔄 RETOUR SELON LE CONTEXTE (simplifié car la sync est automatique)
        if (returnToDetailAfterEdit) {
            setReturnToDetailAfterEdit(false);
            // Note : fishInDetail sera automatiquement mis à jour par useEffect
        }
    };

    // 🆕 AFFICHER LE DÉTAIL D'UN POISSON
    const handleViewFishDetail = (fishItem) => {
        setFishInDetail(fishItem);
        setViewMode('detail');
    };

    // 🆕 RETOURNER À LA LISTE DEPUIS LE DÉTAIL
    const handleBackToList = () => {
        setViewMode('list');
        setFishInDetail(null);
    };

    // Demander confirmation de suppression
    const handleDeleteFish = (fishItem) => {
        setFishToDelete(fishItem);
        setShowDeleteConfirm(true);
    };

    // Confirmer la suppression
    const confirmDelete = async () => {
        if (fishToDelete) {
            try {
                const fishName = fishToDelete.name; // Mémoriser le nom avant suppression
                await deleteFish(fishToDelete._id);
                setShowDeleteConfirm(false);
                setFishToDelete(null);

                // 🍞 TOAST DE CONFIRMATION DE SUPPRESSION
                showToast(`${fishName} a été supprimé avec succès`, 'success');

                // Si on supprime le poisson actuellement affiché en détail, retourner à la liste
                if (fishInDetail && fishInDetail._id === fishToDelete._id) {
                    handleBackToList();
                }
            } catch (err) {
                // L'erreur est déjà gérée par le hook, mais on peut ajouter un toast d'erreur
                showToast('Erreur lors de la suppression du poisson', 'error');
            }
        }
    };

    // Annuler la suppression
    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setFishToDelete(null);
    };

    // 🎯 AFFICHAGE CONDITIONNEL : LISTE OU DÉTAIL
    if (viewMode === 'detail' && fishInDetail) {
        return (
            <>
                <FishDetail
                    fish={fishInDetail}
                    onBack={handleBackToList}
                    onEdit={handleEditFish}
                    onDelete={handleDeleteFish}
                    isLoading={isLoading}
                />

                {/* 🐠 FORMULAIRE UNIFIÉ - TOUJOURS DISPONIBLE */}
                <FishForm
                    isOpen={showForm}
                    onClose={handleCloseForm}
                    fishData={selectedFish}
                    mode={formMode}
                    onCreateSuccess={handleCreateSuccess}
                    onUpdateSuccess={handleUpdateSuccess}
                />

                {/* 🗑️ CONFIRMATION DE SUPPRESSION - TOUJOURS DISPONIBLE */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-card rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4 text-red-600">
                                Confirmer la suppression
                            </h3>
                            <p className="text-muted-foreground mb-2">
                                Êtes-vous sûr de vouloir supprimer ce poisson ?
                            </p>
                            <div className="bg-muted p-3 rounded-lg mb-4">
                                <p className="font-medium">{fishToDelete?.name}</p>
                                <p className="text-sm text-muted-foreground">{fishToDelete?.species}</p>
                            </div>
                            <p className="text-sm text-red-600 mb-6">
                                ⚠️ Cette action est irréversible !
                            </p>

                            <div className="flex justify-end space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={cancelDelete}
                                    disabled={isLoading}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={confirmDelete}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Suppression...
                                        </>
                                    ) : (
                                        'Supprimer définitivement'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 🍞 TOAST NOTIFICATIONS */}
                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.show}
                    onClose={hideToast}
                />
            </>
        );
    }

    // 📋 AFFICHAGE DE LA LISTE (mode par défaut)
    return (
        <div className="space-y-6">
            {/* 📊 EN-TÊTE AVEC STATISTIQUES */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                        Mes Poissons
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        {isReady ? `${fishCount} poisson${fishCount > 1 ? 's' : ''} dans votre aquarium` : 'Chargement...'}
                    </p>
                </div>

                <Button
                    onClick={handleAddFish}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden xs:inline sm:inline">Ajouter un poisson</span>
                    <span className="xs:hidden sm:hidden">Ajouter</span>
                </Button>
            </div>

            {/* 🚨 AFFICHAGE DES ERREURS GÉNÉRALES - REMPLACÉ PAR TOASTS */}
            {/* Gardé pour les erreurs critiques seulement */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearError}
                            className="ml-2"
                        >
                            Fermer
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* 📋 LISTE DES POISSONS */}
            {!isReady ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Chargement de vos poissons...</p>
                </div>
            ) : fishCount === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                    <Fish className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        Aucun poisson dans votre aquarium
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        Commencez par ajouter votre premier poisson !
                    </p>
                    <Button onClick={handleAddFish}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter mon premier poisson
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fish.map((fishItem) => (
                        <div
                            key={fishItem._id}
                            className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {/* Photo du poisson */}
                            {fishItem.photoUrl ? (
                                <div className="h-48 bg-muted overflow-hidden">
                                    <img
                                        src={fishItem.photoUrl}
                                        alt={fishItem.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="h-48 bg-muted flex items-center justify-center">
                                    <Fish className="h-16 w-16 text-muted-foreground" />
                                </div>
                            )}

                            {/* Informations du poisson */}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {fishItem.name}
                                    </h3>
                                    <div className="flex space-x-1">
                                        {/* 🆕 BOUTON VOIR DÉTAILS */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewFishDetail(fishItem)}
                                            disabled={isLoading}
                                            title="Voir les détails"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditFish(fishItem)}
                                            disabled={isLoading}
                                            title="Modifier"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteFish(fishItem)}
                                            disabled={isLoading}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-300/50"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <p className="text-muted-foreground text-sm mb-3">
                                    {fishItem.species}
                                </p>

                                {/* 🎯 AFFICHAGE SIMPLIFIÉ - Seulement type d'aquarium */}
                                <div className="text-sm">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-muted-foreground">Aquarium :</span>
                                        <span className="text-foreground font-medium">{formatAquariumType(fishItem.aquariumType)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 🐠 FORMULAIRE UNIFIÉ - AJOUT ET ÉDITION */}
            <FishForm
                isOpen={showForm}
                onClose={handleCloseForm}
                fishData={selectedFish}
                mode={formMode}
                onCreateSuccess={handleCreateSuccess}
                onUpdateSuccess={handleUpdateSuccess}
            />

            {/* 🗑️ CONFIRMATION DE SUPPRESSION */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">
                            Confirmer la suppression
                        </h3>
                        <p className="text-muted-foreground mb-2">
                            Êtes-vous sûr de vouloir supprimer ce poisson ?
                        </p>
                        <div className="bg-muted p-3 rounded-lg mb-4">
                            <p className="font-medium">{fishToDelete?.name}</p>
                            <p className="text-sm text-muted-foreground">{fishToDelete?.species}</p>
                        </div>
                        <p className="text-sm text-red-600 mb-6">
                            ⚠️ Cette action est irréversible !
                        </p>

                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={cancelDelete}
                                disabled={isLoading}
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Suppression...
                                    </>
                                ) : (
                                    'Supprimer définitivement'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🍞 TOAST NOTIFICATIONS */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.show}
                onClose={hideToast}
            />
        </div>
    );
};

export default FishDashboard;
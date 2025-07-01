import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Edit, Trash2, Fish, Calendar, Clock } from 'lucide-react';
import FishAgeInfo from './FishAgeInfo.jsx';

/**
 * 🐠 COMPOSANT DÉTAIL D'UN POISSON
 * 
 * Ce composant affiche toutes les informations d'un poisson de façon détaillée.
 * Il est conçu pour être :
 * - Responsive (beau sur mobile et desktop)
 * - Complet (toutes les données disponibles)
 * - Actionnable (boutons modifier, supprimer, retour)
 * 
 * 📚 Concepts React appris :
 * - Composant de présentation (props en entrée)
 * - Formatage de données complexes
 * - Layout responsive avec Tailwind
 * - Gestion des images avec fallback
 * - Badges et cartes pour organiser l'information
 * 
 * @param {Object} fish - Données complètes du poisson
 * @param {Function} onBack - Fonction pour retourner à la liste
 * @param {Function} onEdit - Fonction pour éditer le poisson
 * @param {Function} onDelete - Fonction pour supprimer le poisson
 * @param {boolean} isLoading - État de chargement pour désactiver les boutons
 */
const FishDetail = ({ fish, onBack, onEdit, onDelete, isLoading = false }) => {

    /**
     * 🎨 FONCTIONS DE FORMATAGE
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
     * 📅 FORMATAGE DES DATES
     * Affiche les dates de façon lisible en français
     */
    const formatDate = (date) => {
        if (!date) return 'Non disponible';

        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    /**
     * 🎨 COULEUR DU BADGE SELON LE TYPE D'AQUARIUM
     */
    const getAquariumBadgeVariant = (type) => {
        // Utilisation des variants personnalisés pour les couleurs spécifiques
        const variantMap = {
            saltwater: 'saltwater',    // 🌊 Bleu pour eau salée (océan)
            freshwater: 'freshwater',  // 🌿 Vert pour eau douce (rivières/lacs)  
            tropical: 'tropical'       // 🏝️ Orange pour tropical (coraux)
        };
        return variantMap[type] || 'default';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* 🔙 HEADER AVEC BOUTON RETOUR */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start"
                    disabled={isLoading}
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Retour à la liste</span>
                </Button>

                {/* Actions principales */}
                <div className="flex space-x-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => onEdit(fish)}
                        disabled={isLoading}
                        className="flex items-center space-x-2 flex-1 sm:flex-none justify-center"
                    >
                        <Edit className="h-4 w-4" />
                        <span className="hidden xs:inline">Modifier</span>
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => onDelete(fish)}
                        disabled={isLoading}
                        className="flex items-center space-x-2 flex-1 sm:flex-none justify-center"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden xs:inline">Supprimer</span>
                    </Button>
                </div>
            </div>

            {/* 🖼️ SECTION PRINCIPALE - PHOTO ET INFOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Photo du poisson */}
                <Card>
                    <CardContent className="p-0">
                        {fish.photoUrl ? (
                            <div className="aspect-square bg-muted overflow-hidden rounded-lg">
                                <img
                                    src={fish.photoUrl}
                                    alt={fish.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="aspect-square bg-muted flex items-center justify-center rounded-lg">
                                <div className="text-center">
                                    <Fish className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">Aucune photo</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Informations principales */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span className="text-xl sm:text-2xl text-center sm:text-left">{fish.name}</span>
                                <Badge variant={getAquariumBadgeVariant(fish.aquariumType)} className="self-center sm:self-auto">
                                    {formatAquariumType(fish.aquariumType)}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Espèce */}
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">Espèce</h4>
                                <p className="text-muted-foreground">{fish.species}</p>
                            </div>

                            {/* 📅 ANCIENNETÉ DU POISSON */}
                            {fish.introducedAt && (
                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">Ancienneté</h4>
                                    <FishAgeInfo
                                        introducedAt={fish.introducedAt}
                                        fishName={fish.name}
                                        showReminder={true}
                                    />
                                </div>
                            )}

                            {/* Caractéristiques physiques */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-foreground mb-1">Couleur</h4>
                                    <p className="text-muted-foreground">{fish.color}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground mb-1">Taille</h4>
                                    <p className="text-muted-foreground">{formatFishSize(fish.size)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 📝 SECTION NOTES */}
            {fish.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-foreground whitespace-pre-wrap">{fish.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* 📊 MÉTADONNÉES */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>Informations</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <span className="font-medium">Ajouté le :</span>
                                <p className="text-muted-foreground">{formatDate(fish.createdAt)}</p>
                            </div>
                        </div>

                        {fish.updatedAt && fish.updatedAt.getTime() !== fish.createdAt?.getTime() && (
                            <div className="flex items-center space-x-2">
                                <Edit className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <span className="font-medium">Modifié le :</span>
                                    <p className="text-muted-foreground">{formatDate(fish.updatedAt)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FishDetail; 
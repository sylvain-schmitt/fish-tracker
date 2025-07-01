import React from 'react';

/**
 * 📄 COMPOSANT PAGE DE CHARGEMENT
 * 
 * Affiche un spinner pendant que Meteor charge l'état utilisateur
 * 
 * Avantages d'un composant séparé :
 * ✅ Réutilisable dans toute l'app
 * ✅ Facile à personnaliser
 * ✅ Testable indépendamment
 * ✅ Responsabilité unique (affichage loading)
 */

const LoadingPage = () => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Chargement...</p>
            </div>
        </div>
    );
};

export default LoadingPage; 
import React, { createContext, useContext } from 'react';
import { useAuthState } from '../hooks/useAuthState';

/**
 * 🌐 CONTEXTE D'AUTHENTIFICATION GLOBAL
 * 
 * Ce contexte permet de partager l'état d'authentification
 * entre tous les composants de l'application.
 * 
 * Résout le problème : chaque composant qui appelle useAuthState()
 * créait sa propre instance, donc les erreurs n'étaient pas partagées.
 * 
 * Maintenant : une seule instance d'authState pour toute l'app !
 */

// Création du contexte
const AuthContext = createContext(null);

/**
 * 🎯 FOURNISSEUR DE CONTEXTE
 * 
 * Wrap l'application entière pour fournir l'état d'auth
 */
export const AuthProvider = ({ children }) => {
    // Une seule instance du hook useAuthState pour toute l'app
    const authState = useAuthState();

    return (
        <AuthContext.Provider value={authState}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * 🎣 HOOK POUR UTILISER LE CONTEXTE
 * 
 * Remplace les appels directs à useAuthState()
 * Tous les composants utilisent maintenant la même instance !
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }

    return context;
}; 
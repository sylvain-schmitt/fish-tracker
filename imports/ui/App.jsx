import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';

/**
 * 🚀 COMPOSANT PRINCIPAL APP - VERSION AVEC CONTEXTE
 * 
 * App.jsx wrap maintenant l'application avec le AuthProvider
 * pour partager l'état d'authentification globalement.
 * 
 * Architecture :
 * - AuthProvider → Fournit l'état d'auth à toute l'app
 * - AppRouter → Gère les routes avec accès au contexte
 * 
 * Résout le problème des erreurs de connexion non affichées !
 */

const App = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;
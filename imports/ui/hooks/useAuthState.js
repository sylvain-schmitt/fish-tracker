import { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

/**
 * 🔐 HOOK PERSONNALISÉ - GESTION D'ÉTAT D'AUTHENTIFICATION
 * 
 * Ce hook encapsule TOUTE la logique d'authentification :
 * - État utilisateur (connecté/déconnecté/chargement)
 * - Vérification email (token + localStorage)
 * - Erreurs de connexion
 * - Navigation entre modes (login/register)
 * 
 * Avantages d'un hook personnalisé :
 * ✅ Logique réutilisable (autres composants peuvent l'utiliser)
 * ✅ Séparation claire entre logique et UI
 * ✅ Testable indépendamment
 * ✅ Code plus lisible et maintenable
 */

export const useAuthState = () => {
    // 🎭 ÉTATS DE NAVIGATION
    const [isLoginMode, setIsLoginMode] = useState(true);

    // 📧 ÉTATS DE VÉRIFICATION EMAIL
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const [resendError, setResendError] = useState('');

    // 🔑 ÉTATS DE VÉRIFICATION TOKEN
    const [isVerifyingToken, setIsVerifyingToken] = useState(false);
    const [tokenVerificationMessage, setTokenVerificationMessage] = useState('');
    const [tokenVerificationError, setTokenVerificationError] = useState('');

    // ❌ ÉTATS D'ERREURS DE CONNEXION
    const [loginError, setLoginError] = useState('');
    const [loginErrorKey, setLoginErrorKey] = useState(0);

    /**
     * 👤 ÉTAT UTILISATEUR RÉACTIF
     * useTracker surveille automatiquement les changements Meteor
     */
    const { currentUser, isLoading, emailVerified } = useTracker(() => {
        const user = Meteor.user();
        const isUserLoading = !Meteor.userId() && Meteor.loggingIn();

        // Vérifier si l'email est vérifié
        let isEmailVerified = false;
        if (user && user.emails && user.emails.length > 0) {
            isEmailVerified = user.emails[0].verified === true;
        }

        return {
            currentUser: user,
            isLoading: isUserLoading,
            emailVerified: isEmailVerified
        };
    }, []);

    /**
     * 🔍 GESTION DU TOKEN DE VÉRIFICATION EMAIL
     * Vérifie le localStorage au montage du composant
     */
    useEffect(() => {
        const handleEmailTokenVerification = () => {
            // Vérifier si un processus de vérification email est en cours
            const isVerificationInProgress = localStorage.getItem('emailVerificationInProgress');
            const token = localStorage.getItem('emailVerificationToken');

            if (isVerificationInProgress === 'true' && token) {

                setIsVerifyingToken(true);
                setTokenVerificationMessage('Vérification de votre email en cours...');
                setTokenVerificationError('');

                // Nettoyer le localStorage immédiatement
                localStorage.removeItem('emailVerificationToken');
                localStorage.removeItem('emailVerificationInProgress');

                // Vérifier le token avec Meteor
                Accounts.verifyEmail(token, (error) => {
                    setIsVerifyingToken(false);

                    if (error) {
                        console.error('❌ Erreur vérification token:', error);
                        setTokenVerificationError(
                            'Le lien de vérification est invalide ou a expiré. ' +
                            'Veuillez demander un nouveau lien.'
                        );
                        setTokenVerificationMessage('');
                    } else {
                        setTokenVerificationMessage('✅ Email vérifié avec succès ! Bienvenue dans Fish Tracker !');
                        setTokenVerificationError('');

                        // Attendre un peu pour que l'utilisateur voie le message de succès
                        setTimeout(() => {
                            setTokenVerificationMessage('');
                            // Le useTracker détectera automatiquement le changement d'état de l'utilisateur
                        }, 2000);
                    }
                });
            }
        };

        handleEmailTokenVerification();
    }, []); // Exécuté une seule fois au montage

    /**
     * 🔄 FONCTIONS DE NAVIGATION
     */
    const toggleAuthMode = () => {
        setIsLoginMode(!isLoginMode);
    };

    /**
     * 📧 FONCTION DE RENVOI D'EMAIL
     */
    const handleResendEmail = () => {
        setIsResending(true);
        setResendMessage('');
        setResendError('');

        Meteor.call('user.resendVerificationEmail', (err, result) => {
            setIsResending(false);

            if (err) {
                console.error('❌ Erreur renvoi email:', err);
                setResendError(err.reason || 'Erreur lors du renvoi de l\'email');
            } else {
                setResendMessage('Email de vérification renvoyé avec succès ! Vérifiez votre boîte mail.');
            }
        });
    };

    /**
     * ❌ FONCTIONS DE GESTION D'ERREURS DE CONNEXION
     */
    const handleLoginError = (message) => {
        setLoginError(message);
        setLoginErrorKey(prev => prev + 1);
    };

    const clearLoginError = () => {
        setLoginError('');
        setLoginErrorKey(prev => prev + 1);
    };

    /**
     * 🧹 FONCTIONS DE NETTOYAGE
     */
    const clearTokenVerificationError = () => {
        setTokenVerificationError('');
        setTokenVerificationMessage('');
    };

    /**
     * 📊 ÉTAT CALCULÉ - TYPE DE PAGE À AFFICHER
     * Cette logique détermine quelle interface afficher
     */
    const getPageType = () => {
        // 🔄 Vérification token en cours
        if (isVerifyingToken || tokenVerificationMessage) {
            return 'tokenVerification';
        }

        // ⏳ Chargement utilisateur
        if (isLoading) {
            return 'loading';
        }

        // ✅ Utilisateur connecté
        if (currentUser && currentUser._id) {
            // 📧 Email non vérifié
            if (!emailVerified) {
                return 'emailVerification';
            }
            // 🎉 Email vérifié → Interface principale
            return 'main';
        }

        // ❌ Utilisateur non connecté → Authentification
        return 'auth';
    };

    // 📤 RETOUR DU HOOK
    // Toutes les données et fonctions nécessaires pour les composants
    return {
        // États utilisateur
        currentUser,
        isLoading,
        emailVerified,

        // Navigation auth
        isLoginMode,
        toggleAuthMode,

        // Vérification email
        isResending,
        resendMessage,
        resendError,
        handleResendEmail,

        // Vérification token
        isVerifyingToken,
        tokenVerificationMessage,
        tokenVerificationError,
        clearTokenVerificationError,

        // Erreurs de connexion
        loginError,
        loginErrorKey,
        handleLoginError,
        clearLoginError,

        // Type de page à afficher
        pageType: getPageType()
    };
}; 
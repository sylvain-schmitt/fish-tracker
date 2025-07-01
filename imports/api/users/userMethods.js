import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

/**
 * 🔐 MÉTHODES UTILISATEUR
 * 
 * Ce module gère toutes les méthodes liées aux utilisateurs :
 * - Création d'utilisateur avec vérification email
 * - Renvoi d'email de vérification  
 * - Vérification du statut utilisateur
 * 
 * Avantages de ce module séparé :
 * - Responsabilité unique (gestion utilisateurs)
 * - Code testable facilement
 * - Réutilisable dans d'autres projets
 * - Maintenance simplifiée
 */

/**
 * Création d'utilisateur avec envoi automatique d'email de vérification
 * Utilise la nouvelle méthode Accounts.createUserVerifyingEmail
 * 
 * @param {Object} userData - Données de l'utilisateur à créer
 * @returns {Object} - Résultat de la création avec userId et message
 */
export const createUserWithEmailVerification = async (userData) => {
    // 🔒 Validation des données côté serveur (sécurité)
    if (!userData || typeof userData !== 'object') {
        throw new Meteor.Error('invalid-data', 'Données utilisateur invalides');
    }

    const { username, email, password } = userData;

    // Validation email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new Meteor.Error('invalid-email', 'Email invalide');
    }

    // Validation mot de passe
    if (!password || typeof password !== 'string' || password.length < 6) {
        throw new Meteor.Error('invalid-password', 'Mot de passe trop court (minimum 6 caractères)');
    }

    // Validation nom d'utilisateur
    if (!username || typeof username !== 'string' || username.trim().length < 2) {
        throw new Meteor.Error('invalid-username', 'Nom d\'utilisateur trop court (minimum 2 caractères)');
    }

    try {
        // 🔍 VÉRIFICATION PRÉVENTIVE DES DOUBLONS
        // Vérifier si l'email existe déjà
        const existingUserByEmail = await Meteor.users.findOneAsync({
            'emails.address': email.trim().toLowerCase()
        });

        if (existingUserByEmail) {
            throw new Meteor.Error('email-exists', 'Un compte existe déjà avec cet email');
        }

        // Vérifier si le nom d'utilisateur existe déjà
        const existingUserByUsername = await Meteor.users.findOneAsync({
            username: username.trim()
        });

        if (existingUserByUsername) {
            throw new Meteor.Error('username-exists', 'Ce nom d\'utilisateur est déjà pris');
        }

        // 🎯 UTILISATION DE createUserVerifyingEmail
        // Cette méthode crée le compte ET envoie l'email automatiquement
        const userId = await Accounts.createUserVerifyingEmail({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            profile: {
                name: username.trim(),
                createdAt: new Date()
            }
        });


        return {
            success: true,
            userId: userId,
            message: 'Compte créé avec succès ! Un email de vérification a été envoyé.'
        };

    } catch (error) {
        console.error('❌ Erreur création utilisateur:', error);

        // Si c'est déjà une Meteor.Error (de nos vérifications préventives), la re-lancer directement
        if (error instanceof Meteor.Error) {
            throw error;
        }

        // Gestion des erreurs spécifiques pour les autres erreurs
        const errorMessage = error.message || error.reason || '';

        if (errorMessage.includes('Email already exists') || errorMessage.includes('email already exists')) {
            throw new Meteor.Error('email-exists', 'Un compte existe déjà avec cet email');
        } else if (errorMessage.includes('Username already exists') || errorMessage.includes('username already exists')) {
            throw new Meteor.Error('username-exists', 'Ce nom d\'utilisateur est déjà pris');
        } else if (error.error === 403) {
            // Erreur 403 souvent utilisée pour les comptes existants
            throw new Meteor.Error('account-exists', 'Un compte existe déjà avec ces informations');
        } else {
            throw new Meteor.Error('creation-failed', 'Erreur lors de la création du compte');
        }
    }
};

/**
 * Renvoie un email de vérification pour l'utilisateur connecté
 * 
 * @param {String} userId - ID de l'utilisateur (fourni par Meteor.call context)
 * @returns {Object} - Résultat de l'envoi
 */
export const resendVerificationEmail = async (userId) => {
    // Vérification sécurité : utilisateur connecté requis
    if (!userId) {
        throw new Meteor.Error('not-authorized', 'Vous devez être connecté pour renvoyer un email de vérification');
    }

    // Récupérer l'utilisateur
    const user = await Meteor.users.findOneAsync(userId);

    if (!user) {
        throw new Meteor.Error('user-not-found', 'Utilisateur introuvable');
    }

    // Vérifier si l'email est déjà vérifié
    if (user.emails && user.emails[0] && user.emails[0].verified) {
        throw new Meteor.Error('email-already-verified', 'Votre email est déjà vérifié');
    }

    try {
        // Renvoyer l'email de vérification
        await Accounts.sendVerificationEmail(userId);


        return {
            success: true,
            message: 'Email de vérification renvoyé avec succès'
        };

    } catch (error) {
        console.error('❌ Erreur renvoi email de vérification:', error);
        throw new Meteor.Error('email-send-failed', 'Erreur lors du renvoi de l\'email');
    }
};

/**
 * Vérifier le statut d'un utilisateur par email (pour les messages d'erreur de connexion)
 * Méthode publique utilisée pour donner des messages d'erreur spécifiques lors de la connexion
 * 
 * @param {String} email - Email de l'utilisateur à vérifier
 * @returns {Object} - Informations sur l'utilisateur et son statut
 */
export const checkUserEmailVerification = async (email) => {
    // Validation de l'email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new Meteor.Error('invalid-email', 'Email invalide');
    }

    try {
        // Rechercher l'utilisateur par email
        const user = await Meteor.users.findOneAsync({
            'emails.address': email.trim().toLowerCase()
        });

        if (!user) {
            // Utilisateur non trouvé
            return {
                userExists: false,
                emailVerified: false,
                message: 'Aucun compte trouvé avec cet email'
            };
        }

        // Vérifier si l'email est vérifié
        const emailVerified = user.emails && user.emails[0] && user.emails[0].verified === true;

        return {
            userExists: true,
            emailVerified: emailVerified,
            message: emailVerified
                ? 'Utilisateur trouvé avec email vérifié'
                : 'Utilisateur trouvé mais email non vérifié'
        };

    } catch (error) {
        console.error('❌ Erreur vérification statut utilisateur:', error);
        throw new Meteor.Error('check-failed', 'Erreur lors de la vérification du statut utilisateur');
    }
};

/**
 * Enregistrement des méthodes Meteor
 * Cette fonction doit être appelée pour rendre les méthodes disponibles côté client
 */
export const registerUserMethods = () => {
    Meteor.methods({
        // Méthode de création d'utilisateur
        'user.createWithEmailVerification': createUserWithEmailVerification,

        // Méthode de renvoi d'email de vérification
        'user.resendVerificationEmail': function () {
            // Dans le contexte d'une méthode Meteor, this.userId contient l'ID de l'utilisateur connecté
            return resendVerificationEmail(this.userId);
        },

        // Méthode de vérification du statut utilisateur
        'checkUserEmailVerification': checkUserEmailVerification
    });

}; 
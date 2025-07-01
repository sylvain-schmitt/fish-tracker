import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

/**
 * 📧 CONFIGURATION EMAIL COMPLÈTE
 * 
 * Ce module gère :
 * - Configuration SMTP (Mailhog en dev, service externe en prod)
 * - Templates d'emails personnalisés
 * - Paramètres du système Accounts
 * 
 * Avantages de ce module séparé :
 * - Code réutilisable
 * - Facile à tester
 * - Responsabilité unique (configuration email)
 * - Maintenance simplifiée
 */

/**
 * Configuration du serveur SMTP
 * Fonction pure qui configure l'URL SMTP selon l'environnement
 */
export const configureSMTP = () => {
  if (Meteor.isDevelopment) {
    // Mailhog écoute sur le port 1025 en local
    process.env.MAIL_URL = 'smtp://localhost:1025';
    console.log('📧 Configuration SMTP Mailhog activée (développement)');
  } else {
    // En production, utiliser les variables d'environnement
    // MAIL_URL devrait être définie dans les variables d'environnement
    console.log('📧 Configuration SMTP production (variable MAIL_URL)');
  }
};

/**
 * Configuration des paramètres du système Accounts
 * Fonction pure qui définit le comportement d'authentification
 */
export const configureAccountsSettings = () => {
  Accounts.config({
    // ✅ Activer l'envoi automatique d'emails de vérification
    sendVerificationEmail: true,

    // ✅ Autoriser la création de comptes côté client (sécurisé par défaut)
    forbidClientAccountCreation: false,

    // ⏰ Durée de validité des sessions (30 jours)
    loginExpirationInDays: 30,
  });

  console.log('⚙️ Configuration Accounts activée');
};

/**
 * Configuration des templates d'emails personnalisés
 * Fonction pure qui définit l'apparence des emails
 */
export const configureEmailTemplates = () => {
  // Configuration générale des emails
  Accounts.emailTemplates.siteName = 'Fish Tracker 🐠';
  Accounts.emailTemplates.from = 'Fish Tracker <noreply@aqualize-app.fr>';

  // Template spécifique pour l'email de vérification
  Accounts.emailTemplates.verifyEmail = {
    // Sujet de l'email
    subject() {
      return '🐠 Vérifiez votre email pour Fish Tracker';
    },

    // Contenu HTML de l'email
    html(user, url) {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header avec dégradé -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🐠 Fish Tracker</h1>
          </div>
          
          <!-- Contenu principal -->
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">
              Bienvenue ${user.username || 'dans Fish Tracker'} ! 👋
            </h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Merci de vous être inscrit à Fish Tracker ! Pour commencer à gérer votre aquarium virtuel, 
              veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email.
            </p>
            
            <!-- Bouton de vérification -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                ✅ Vérifier mon email
              </a>
            </div>
            
            <!-- Lien de secours -->
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <span style="word-break: break-all; color: #667eea;">${url}</span>
            </p>
            
            <!-- Footer -->
            <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
              Si vous n'avez pas créé de compte Fish Tracker, ignorez cet email.
            </p>
          </div>
        </div>
      `;
    }
  };

  console.log('📧 Templates d\'emails configurés');
};

/**
 * Fonction principale qui initialise toute la configuration email
 * Point d'entrée unique pour la configuration email
 */
export const initializeEmailConfig = () => {
  configureSMTP();
  configureAccountsSettings();
  configureEmailTemplates();

  console.log('✅ Configuration email complète initialisée');
}; 
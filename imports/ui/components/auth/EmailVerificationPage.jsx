import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * 📧 COMPOSANT PAGE DE VÉRIFICATION EMAIL
 * 
 * Affiche la page pour utilisateur connecté mais avec email non vérifié :
 * - Informations sur l'email envoyé
 * - Bouton pour renvoyer l'email
 * - Messages de feedback (succès/erreur)
 * - Bouton de déconnexion
 * 
 * Props reçues du hook useAuthState
 */

const EmailVerificationPage = ({
    currentUser,
    isResending,
    resendMessage,
    resendError,
    onResendEmail
}) => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-card p-6 rounded-lg border shadow-sm">
                    <div className="text-center mb-6">
                        <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Vérifiez votre email
                        </h2>
                        <p className="text-muted-foreground">
                            Un email de vérification a été envoyé à{' '}
                            <span className="font-medium text-foreground">
                                {currentUser.emails?.[0]?.address}
                            </span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Information sur le processus */}
                        <Alert className="border-blue-200 text-blue-800 bg-blue-50">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                Cliquez sur le lien dans l'email pour activer votre compte.
                                Vérifiez aussi votre dossier spam.
                            </AlertDescription>
                        </Alert>

                        {/* Message de succès du renvoi */}
                        {resendMessage && (
                            <Alert className="border-green-200 text-green-800 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    {resendMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Message d'erreur du renvoi */}
                        {resendError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {resendError}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Boutons d'action */}
                        <div className="flex space-x-2">
                            <Button
                                onClick={onResendEmail}
                                disabled={isResending}
                                className="flex-1"
                            >
                                {isResending ? 'Envoi en cours...' : 'Renvoyer l\'email'}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => Meteor.logout()}
                                disabled={isResending}
                                className="flex-1"
                            >
                                Se déconnecter
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationPage; 
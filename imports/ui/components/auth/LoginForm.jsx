import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Composant de connexion utilisateur
 * Version modernisée avec shadcn/ui
 */
const LoginForm = ({ onToggleMode, onError, onClearError, error, errorKey }) => {
    // États pour les champs du formulaire
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // États pour la gestion UI
    const [isLoading, setIsLoading] = useState(false);

    // Les erreurs sont maintenant gérées par App.jsx via les props
    // const [error, setError] = useState('');
    // const [errorKey, setErrorKey] = useState(0);

    // Les fonctions de gestion d'erreur viennent maintenant des props
    const setErrorMessage = onError;
    const clearError = onClearError;

    /**
     * Gestion de la soumission du formulaire de connexion
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation basique côté client
        if (!email || !password) {
            setErrorMessage('Email et mot de passe requis');
            return;
        }

        // Validation du format d'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setErrorMessage('Format d\'email invalide. Veuillez saisir un email valide (ex: nom@domaine.com)');
            return;
        }

        setIsLoading(true);
        clearError(); // Reset de l'erreur précédente

        // Tentative de connexion avec Meteor
        Meteor.loginWithPassword(email.trim().toLowerCase(), password, (err) => {
            setIsLoading(false);

            if (err) {
                console.error('Erreur de connexion:', err);

                // Gestion spécifique des erreurs de connexion
                switch (err.error) {
                    case 403:
                        // Erreur 403 = Identifiants incorrects ou email non vérifié
                        // On vérifie d'abord si l'utilisateur existe
                        Meteor.call('checkUserEmailVerification', email.trim().toLowerCase(), (checkErr, result) => {

                            if (checkErr) {
                                console.error('❌ Erreur lors de la vérification:', checkErr);
                                setErrorMessage('Erreur lors de la vérification. Veuillez réessayer.');
                            } else if (!result.userExists) {
                                setErrorMessage('Aucun compte trouvé avec cet email. Vérifiez votre saisie ou inscrivez-vous.');
                            } else {
                                // Utilisateur existe, donc c'est forcément un problème de mot de passe
                                // (Si l'email n'était pas vérifié mais le mot de passe correct, 
                                // Meteor connecterait l'utilisateur et App.jsx gérerait la redirection)
                                setErrorMessage('Mot de passe incorrect. Vérifiez votre saisie.');
                            }
                        });
                        break;

                    case 400:
                        // Erreur 400 = Paramètres manquants ou invalides
                        setErrorMessage('Email ou mot de passe invalide. Vérifiez votre saisie.');
                        break;

                    case 'user-not-found':
                        setErrorMessage('Aucun compte trouvé avec cet email. Vérifiez votre saisie ou inscrivez-vous.');
                        break;

                    case 'incorrect-password':
                        setErrorMessage('Mot de passe incorrect. Vérifiez votre saisie.');
                        break;

                    case 'too-many-requests':
                        setErrorMessage('Trop de tentatives de connexion. Veuillez patienter quelques minutes.');
                        break;

                    default:
                        // Fallback pour les autres erreurs
                        if (err.reason) {
                            // Si Meteor fournit une raison spécifique
                            switch (err.reason) {
                                case 'User not found':
                                    setErrorMessage('Aucun compte trouvé avec cet email. Vérifiez votre saisie ou inscrivez-vous.');
                                    break;
                                case 'Incorrect password':
                                    setErrorMessage('Mot de passe incorrect. Vérifiez votre saisie.');
                                    break;
                                case 'Match failed':
                                    setErrorMessage('Format d\'email ou mot de passe invalide.');
                                    break;
                                default:
                                    setErrorMessage(`Erreur de connexion : ${err.reason}`);
                            }
                        } else {
                            setErrorMessage('Erreur de connexion. Vérifiez vos identifiants et réessayez.');
                        }
                }
            } 
        });
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Se connecter</h2>
                    <p className="text-muted-foreground mt-2">
                        Accédez à votre aquarium virtuel
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Champ Email */}
                    <div className="space-y-2">
                        <Label htmlFor="login-email">
                            Email
                        </Label>
                        <Input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    {/* Champ Mot de passe */}
                    <div className="space-y-2">
                        <Label htmlFor="login-password">
                            Mot de passe
                        </Label>
                        <Input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    {/* Affichage des erreurs avec Alert */}
                    {error && (
                        <Alert variant="destructive" key={errorKey}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Bouton de connexion */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                </form>

                {/* Lien vers inscription avec Button */}
                <div className="text-center mt-6">
                    <p className="text-muted-foreground mb-2">
                        Pas encore de compte ?
                    </p>
                    <Button
                        variant="ghost"
                        onClick={onToggleMode}
                        disabled={isLoading}
                        className="text-primary hover:text-primary"
                    >
                        S'inscrire
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LoginForm; 
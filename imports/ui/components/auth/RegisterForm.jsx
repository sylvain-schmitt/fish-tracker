import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Composant d'inscription utilisateur avec validation email
 * Version complètement modernisée avec shadcn/ui
 */
const RegisterForm = ({ onToggleMode }) => {
    // États pour les champs du formulaire
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');

    // États pour la gestion UI
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    /**
     * Validation côté client avant envoi
     */
    const validateForm = () => {
        // Validation email (format basique)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Format d\'email invalide');
            return false;
        }

        // Validation mot de passe
        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }

        // Confirmation mot de passe
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return false;
        }

        // Validation nom d'utilisateur
        if (username.trim().length < 2) {
            setError('Le nom d\'utilisateur doit contenir au moins 2 caractères');
            return false;
        }

        return true;
    };

    /**
     * Gestion de la soumission du formulaire d'inscription
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation côté client
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        // Données utilisateur à envoyer au serveur
        const userData = {
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: password
        };

        // 🚀 APPEL DE LA MÉTHODE SERVEUR
        Meteor.call('user.createWithEmailVerification', userData, (err, result) => {
            setIsLoading(false);

            if (err) {
                console.error('❌ Erreur inscription:', err);
                setError(err.reason || err.message || 'Erreur lors de la création du compte');
            } else {

                setSuccess(
                    `Compte créé avec succès ! Un email de vérification a été envoyé à ${email}. ` +
                    `Vérifiez votre boîte mail (et le dossier spam) puis cliquez sur le lien pour activer votre compte.`
                );

                // Réinitialiser le formulaire
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setUsername('');
            }
        });
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Créer un compte</h2>
                    <p className="text-muted-foreground mt-2">
                        Rejoignez Fish Tracker !
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Champ Nom d'utilisateur */}
                    <div className="space-y-2">
                        <Label htmlFor="username">
                            Nom d'utilisateur
                        </Label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nom d'utilisateur"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    {/* Champ Email */}
                    <div className="space-y-2">
                        <Label htmlFor="register-email">
                            Email
                        </Label>
                        <Input
                            id="register-email"
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
                        <Label htmlFor="register-password">
                            Mot de passe
                        </Label>
                        <Input
                            id="register-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Minimum 6 caractères
                        </p>
                    </div>

                    {/* Champ Confirmation mot de passe */}
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                            Confirmer le mot de passe
                        </Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    {/* Affichage des erreurs avec Alert */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Affichage du succès avec Alert */}
                    {success && (
                        <Alert className="border-green-200 text-green-800 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                {success}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Bouton de soumission */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Création en cours...' : 'Créer mon compte'}
                    </Button>
                </form>

                {/* Lien pour basculer vers connexion avec Button */}
                <div className="text-center mt-6">
                    <p className="text-muted-foreground mb-2">
                        Déjà un compte ?
                    </p>
                    <Button
                        variant="ghost"
                        onClick={onToggleMode}
                        disabled={isLoading}
                        className="text-primary hover:text-primary"
                    >
                        Se connecter
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm; 
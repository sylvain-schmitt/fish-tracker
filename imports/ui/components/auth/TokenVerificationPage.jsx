import React from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * 📄 COMPOSANT PAGE DE VÉRIFICATION TOKEN EMAIL
 * 
 * Affiche l'état de vérification d'un token email :
 * - Spinner pendant la vérification
 * - Message de succès
 * - Message d'erreur avec bouton de continuation
 * 
 * Props reçues du hook useAuthState
 */

const TokenVerificationPage = ({
    isVerifyingToken,
    tokenVerificationMessage,
    tokenVerificationError,
    onClearError
}) => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-card p-6 rounded-lg border shadow-sm">
                    <div className="text-center mb-6">
                        {isVerifyingToken ? (
                            <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
                        ) : (
                            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        )}
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Vérification email
                        </h2>
                    </div>

                    {/* Message de succès */}
                    {tokenVerificationMessage && (
                        <Alert className="border-green-200 text-green-800 bg-green-50 mb-4">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                {tokenVerificationMessage}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Message d'erreur */}
                    {tokenVerificationError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {tokenVerificationError}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Bouton de continuation en cas d'erreur */}
                    {tokenVerificationError && (
                        <Button
                            onClick={onClearError}
                            className="w-full"
                        >
                            Continuer
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TokenVerificationPage; 
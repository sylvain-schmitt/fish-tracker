import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * 🍞 COMPOSANT TOAST - NOTIFICATIONS OVERLAY
 * 
 * Affiche des messages de feedback sans obliger l'utilisateur à scroller.
 * Les toasts apparaissent en overlay et se ferment automatiquement.
 * 
 * Types supportés :
 * - success (vert avec icône check)
 * - error (rouge avec icône alert)
 * - info (bleu neutre)
 * 
 * @param {string} message - Le message à afficher
 * @param {string} type - Type de toast ('success', 'error', 'info')
 * @param {boolean} isVisible - Contrôle la visibilité
 * @param {Function} onClose - Fonction appelée à la fermeture
 * @param {number} duration - Durée avant fermeture auto (défaut: 4000ms)
 */
const Toast = ({
    message,
    type = 'info',
    isVisible = false,
    onClose,
    duration = 4000
}) => {
    const [show, setShow] = useState(isVisible);

    // Gestion de la fermeture automatique
    useEffect(() => {
        if (isVisible) {
            setShow(true);

            // Fermeture automatique après la durée spécifiée
            const timer = setTimeout(() => {
                handleClose();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            setShow(false);
        }
    }, [isVisible, duration]);

    // Fonction de fermeture avec animation
    const handleClose = () => {
        setShow(false);
        // Délai pour l'animation avant d'appeler onClose
        setTimeout(() => {
            if (onClose) onClose();
        }, 200);
    };

    // Ne pas rendre si pas visible
    if (!isVisible && !show) return null;

    // Styles selon le type
    const getToastStyles = () => {
        const baseStyles = "flex items-center space-x-3 p-4 rounded-lg shadow-lg border min-w-80 max-w-md";

        switch (type) {
            case 'success':
                return cn(baseStyles, "bg-green-50 border-green-200 text-green-800");
            case 'error':
                return cn(baseStyles, "bg-red-50 border-red-200 text-red-800");
            default:
                return cn(baseStyles, "bg-blue-50 border-blue-200 text-blue-800");
        }
    };

    // Icône selon le type
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />;
            default:
                return <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />;
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50">
            <div
                className={cn(
                    getToastStyles(),
                    "transform transition-all duration-200 ease-in-out",
                    show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                )}
            >
                {/* Icône */}
                {getIcon()}

                {/* Message */}
                <div className="flex-1">
                    <p className="text-sm font-medium">{message}</p>
                </div>

                {/* Bouton fermeture */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-6 w-6 p-0 hover:bg-black/10"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default Toast; 
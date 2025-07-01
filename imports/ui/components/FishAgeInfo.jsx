import React from 'react';
import { calculateFishAge, formatFishAge, checkAnniversaryReminder } from '../../api/fish/FishCollection.js';
import { Alert, AlertDescription } from './ui/alert';

/**
 * 🎂 COMPOSANT D'AFFICHAGE DE L'ANCIENNETÉ DU POISSON
 * 
 * Ce composant affiche des informations sur l'ancienneté d'un poisson :
 * - Temps écoulé depuis l'introduction dans l'aquarium
 * - Rappels d'anniversaire automatiques
 * - Interface moderne avec couleurs thématiques
 * 
 * 📚 Concepts React appris :
 * - Composant de présentation (props only)
 * - Calculs de dates côté client
 * - Rendu conditionnel avec &&
 * - Utilisation d'Alert shadcn/ui
 * - Formatage de texte dynamique
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Date} props.introducedAt - Date d'introduction du poisson
 * @param {String} props.fishName - Nom du poisson (pour personnaliser les messages)
 * @param {Boolean} props.showReminder - Afficher ou non les rappels (défaut: true)
 * @param {String} props.className - Classes CSS additionnelles
 */
const FishAgeInfo = ({
    introducedAt,
    fishName = 'Votre poisson',
    showReminder = true,
    className = ''
}) => {
    // 🛡️ VÉRIFICATION DE SÉCURITÉ
    if (!introducedAt || !(introducedAt instanceof Date)) {
        return null; // Ne rien afficher si pas de date valide
    }

    // 📊 CALCULS D'ANCIENNETÉ
    const ageInDays = calculateFishAge(introducedAt);
    const formattedAge = formatFishAge(ageInDays);
    const reminder = showReminder ? checkAnniversaryReminder(introducedAt) : null;

    // 🎨 DÉTERMINER LA COULEUR SELON L'ÂGE
    const getAgeColor = (days) => {
        if (days < 30) return 'text-green-600';      // Nouveau (vert)
        if (days < 365) return 'text-blue-600';      // Jeune (bleu)
        if (days < 730) return 'text-purple-600';    // Mature (violet)
        return 'text-orange-600';                    // Ancien (orange)
    };

    // 🎨 DÉTERMINER L'ICÔNE SELON L'ÂGE
    const getAgeIcon = (days) => {
        if (days < 30) return '🆕';      // Nouveau
        if (days < 365) return '🐠';     // Jeune
        if (days < 730) return '🐟';     // Mature
        return '🏆';                     // Ancien/Vétéran
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {/* 📅 AFFICHAGE DE L'ANCIENNETÉ */}
            <div className="flex items-center space-x-2">
                <span className="text-lg">
                    {getAgeIcon(ageInDays)}
                </span>
                <span className={`text-sm font-medium ${getAgeColor(ageInDays)}`}>
                    {formattedAge} dans votre aquarium
                </span>
            </div>

            {/* 🎉 RAPPEL D'ANNIVERSAIRE (si applicable) */}
            {reminder && (
                <Alert className="border-l-4 border-l-blue-500 bg-blue-50">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">
                            {reminder.type === 'yearly' ? '🎉' : '📅'}
                        </span>
                        <AlertDescription className="text-blue-800">
                            <strong>{fishName}</strong> {reminder.message}
                        </AlertDescription>
                    </div>
                </Alert>
            )}

            {/* 📊 INFORMATIONS DÉTAILLÉES (pour les poissons anciens) */}
            {ageInDays > 365 && (
                <div className="text-xs text-muted-foreground">
                    Introduit le {introducedAt.toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            )}
        </div>
    );
};

export default FishAgeInfo; 
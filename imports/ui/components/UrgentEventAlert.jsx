import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, Clock, Zap, CheckCircle } from 'lucide-react';

/**
 * 🚨 COMPOSANT D'ALERTE URGENTE POUR ÉVÉNEMENTS
 * 
 * Affiche une alerte visuelle marquée pour les événements urgents :
 * - Animation pulsante pour attirer l'attention
 * - Couleurs vives et contrastées
 * - Actions rapides intégrées
 * - Différents niveaux d'urgence
 * 
 * 📚 Concepts appris :
 * - Animations CSS avec Tailwind
 * - Rendu conditionnel avec couleurs dynamiques
 * - Composition de composants UI
 * - Gestion d'événements avec callbacks
 * 
 * 🎯 Niveaux d'urgence :
 * - CRITICAL: Plus de 2h de retard (rouge clignotant)
 * - HIGH: 30min à 2h de retard (orange pulsant)
 * - MEDIUM: Jusqu'à 30min de retard (jaune)
 */
const UrgentEventAlert = ({ event, onComplete, onView, fishName }) => {
    /**
     * 📊 CALCUL DU NIVEAU D'URGENCE
     */
    const getUrgencyLevel = (scheduledAt) => {
        const now = new Date();
        const scheduled = new Date(scheduledAt);
        const delayMinutes = Math.floor((now - scheduled) / (1000 * 60));

        if (delayMinutes > 120) return 'CRITICAL'; // Plus de 2h
        if (delayMinutes > 30) return 'HIGH';      // 30min à 2h
        if (delayMinutes > 0) return 'MEDIUM';     // Jusqu'à 30min
        return 'LOW';
    };

    /**
     * 🎨 CONFIGURATION VISUELLE PAR NIVEAU D'URGENCE
     */
    const getUrgencyConfig = (level) => {
        const configs = {
            CRITICAL: {
                containerClass: 'border-red-500 bg-red-50 animate-pulse shadow-lg shadow-red-200',
                iconClass: 'text-red-600 animate-bounce',
                titleClass: 'text-red-800 font-bold',
                badgeClass: 'bg-red-600 text-white animate-pulse',
                icon: AlertTriangle,
                label: 'CRITIQUE',
                description: 'Très en retard'
            },
            HIGH: {
                containerClass: 'border-orange-500 bg-orange-50 animate-pulse shadow-md shadow-orange-200',
                iconClass: 'text-orange-600',
                titleClass: 'text-orange-800 font-semibold',
                badgeClass: 'bg-orange-500 text-white',
                icon: Clock,
                label: 'URGENT',
                description: 'En retard'
            },
            MEDIUM: {
                containerClass: 'border-yellow-500 bg-yellow-50 shadow-sm shadow-yellow-200',
                iconClass: 'text-yellow-600',
                titleClass: 'text-yellow-800 font-medium',
                badgeClass: 'bg-yellow-500 text-white',
                icon: Clock,
                label: 'ATTENTION',
                description: 'Légèrement en retard'
            },
            LOW: {
                containerClass: 'border-blue-500 bg-blue-50',
                iconClass: 'text-blue-600',
                titleClass: 'text-blue-800',
                badgeClass: 'bg-blue-500 text-white',
                icon: Zap,
                label: 'BIENTÔT',
                description: 'À venir'
            }
        };
        return configs[level] || configs.MEDIUM;
    };

    /**
     * 📅 FORMATAGE DU TEMPS DE RETARD
     */
    const getDelayText = (scheduledAt) => {
        const now = new Date();
        const scheduled = new Date(scheduledAt);
        const delayMinutes = Math.floor((now - scheduled) / (1000 * 60));

        if (delayMinutes > 1440) {
            const days = Math.floor(delayMinutes / 1440);
            return `${days} jour${days > 1 ? 's' : ''} de retard`;
        }
        if (delayMinutes > 60) {
            const hours = Math.floor(delayMinutes / 60);
            const minutes = delayMinutes % 60;
            return `${hours}h${minutes > 0 ? minutes + 'm' : ''} de retard`;
        }
        if (delayMinutes > 0) {
            return `${delayMinutes} min de retard`;
        }
        return 'À l\'heure';
    };

    const urgencyLevel = getUrgencyLevel(event.scheduledAt);
    const config = getUrgencyConfig(urgencyLevel);
    const Icon = config.icon;

    return (
        <Alert className={`${config.containerClass} border-2 transition-all duration-300`}>
            <div className="flex items-start space-x-3">
                {/* Icône d'urgence */}
                <Icon className={`h-5 w-5 mt-0.5 ${config.iconClass}`} />

                <div className="flex-1 min-w-0">
                    {/* En-tête avec badge d'urgence */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <Badge className={`${config.badgeClass} text-xs font-bold px-2 py-1`}>
                                {config.label}
                            </Badge>
                            <span className={`text-sm ${config.titleClass}`}>
                                {event.type.toUpperCase()}
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {getDelayText(event.scheduledAt)}
                        </span>
                    </div>

                    {/* Description de l'événement */}
                    <AlertDescription className="space-y-2">
                        <div className={config.titleClass}>
                            <span className="font-medium">🐠 {fishName}</span>
                            {event.description && (
                                <span className="block text-sm text-muted-foreground mt-1">
                                    {event.description}
                                </span>
                            )}
                        </div>

                        {/* Actions rapides */}
                        <div className="flex items-center space-x-2 pt-2">
                            <Button
                                size="sm"
                                onClick={() => onComplete(event._id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Terminé
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onView(event)}
                                className="text-xs"
                            >
                                Voir détails
                            </Button>
                        </div>
                    </AlertDescription>
                </div>
            </div>
        </Alert>
    );
};

export default UrgentEventAlert; 
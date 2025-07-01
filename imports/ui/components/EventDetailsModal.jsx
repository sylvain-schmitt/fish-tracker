import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { EVENT_TYPES, EVENT_PRIORITIES } from '../../api/events/EventsCollection.js';
import {
    Calendar,
    Clock,
    Fish,
    User,
    AlertTriangle,
    CheckCircle,
    Edit,
    X,
    MapPin,
    FileText
} from 'lucide-react';

/**
 * 📋 MODALE DE DÉTAILS D'UN ÉVÉNEMENT
 * 
 * Affiche toutes les informations détaillées d'un événement :
 * - Informations générales (titre, type, priorité)
 * - Planification (date, heure, récurrence)
 * - Contexte (poisson, description, notes)
 * - Statut et actions
 * 
 * 📚 Concepts appris :
 * - Modale avec shadcn/ui Dialog
 * - Formatage avancé des dates
 * - Affichage conditionnel des informations
 * - Interface responsive dans une modale
 * 
 * 🎯 Fonctionnalités :
 * - Vue complète de l'événement
 * - Actions rapides (marquer terminé, éditer)
 * - Calcul du temps écoulé/restant
 * - Indicateurs visuels de statut
 */
const EventDetailsModal = ({
    isOpen,
    onClose,
    event,
    fishName,
    onComplete,
    onEdit
}) => {
    // 🚫 Pas d'événement = pas d'affichage
    if (!event) return null;

    /**
     * 📅 FORMATAGE AVANCÉ DES DATES
     */
    const formatDetailedDate = (date) => {
        const eventDate = new Date(date);
        const now = new Date();
        const diffMs = eventDate - now;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        const dateStr = eventDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const timeStr = eventDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let relativeStr = '';
        if (diffMinutes < 0) {
            // Événement passé
            const absMinutes = Math.abs(diffMinutes);
            if (absMinutes < 60) {
                relativeStr = `Il y a ${absMinutes} minute${absMinutes > 1 ? 's' : ''}`;
            } else if (absMinutes < 1440) {
                const hours = Math.floor(absMinutes / 60);
                relativeStr = `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
            } else {
                const days = Math.floor(absMinutes / 1440);
                relativeStr = `Il y a ${days} jour${days > 1 ? 's' : ''}`;
            }
        } else if (diffMinutes === 0) {
            relativeStr = 'Maintenant';
        } else {
            // Événement futur
            if (diffMinutes < 60) {
                relativeStr = `Dans ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
            } else if (diffMinutes < 1440) {
                const hours = Math.floor(diffMinutes / 60);
                relativeStr = `Dans ${hours} heure${hours > 1 ? 's' : ''}`;
            } else {
                relativeStr = `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
            }
        }

        return { dateStr, timeStr, relativeStr, isPast: diffMinutes < 0 };
    };

    /**
     * 🎨 CONFIGURATION VISUELLE
     */
    const getEventTypeInfo = (type) => {
        return EVENT_TYPES[type] || EVENT_TYPES.other;
    };

    const getPriorityInfo = (priority) => {
        const priorities = {
            low: {
                label: 'Faible',
                color: 'bg-gray-100 text-gray-800 border-gray-300',
                icon: '🔵'
            },
            medium: {
                label: 'Moyenne',
                color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                icon: '🟡'
            },
            high: {
                label: 'Élevée',
                color: 'bg-red-100 text-red-800 border-red-300',
                icon: '🔴'
            }
        };
        return priorities[priority] || priorities.medium;
    };

    const typeInfo = getEventTypeInfo(event.type);
    const priorityInfo = getPriorityInfo(event.priority);
    const dateInfo = formatDetailedDate(event.scheduledAt);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-xl font-bold text-foreground mb-2">
                                {event.title}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mb-3">
                                Détails complets de l'événement planifié
                            </DialogDescription>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className={`${typeInfo.color} border`}>
                                    <span className="mr-1">{typeInfo.icon}</span>
                                    {typeInfo.label}
                                </Badge>
                                <Badge className={`${priorityInfo.color} border`}>
                                    <span className="mr-1">{priorityInfo.icon}</span>
                                    Priorité {priorityInfo.label}
                                </Badge>
                                {event.isCompleted && (
                                    <Badge className="bg-green-100 text-green-800 border-green-300">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Terminé
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {/* 📅 INFORMATIONS DE PLANIFICATION */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-foreground mb-3 flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                Planification
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Date :</span>
                                    <span className="font-medium">{dateInfo.dateStr}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Heure :</span>
                                    <span className="font-medium">{dateInfo.timeStr}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Statut :</span>
                                    <span className={`font-medium ${dateInfo.isPast && !event.isCompleted ? 'text-red-600' : 'text-foreground'}`}>
                                        {dateInfo.relativeStr}
                                        {dateInfo.isPast && !event.isCompleted && (
                                            <span className="ml-2 text-red-500">⚠️ En retard</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 🐠 CONTEXTE */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-foreground mb-3 flex items-center">
                                <Fish className="h-4 w-4 mr-2" />
                                Contexte
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Poisson :</span>
                                    <span className="font-medium">{fishName}</span>
                                </div>
                                {event.description && (
                                    <div className="pt-2">
                                        <span className="text-sm text-muted-foreground block mb-1">Description :</span>
                                        <p className="text-sm bg-muted p-3 rounded-md">
                                            {event.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 📝 INFORMATIONS TECHNIQUES */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-foreground mb-3 flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                Historique
                            </h3>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Créé le :</span>
                                    <span>{new Date(event.createdAt).toLocaleDateString('fr-FR', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</span>
                                </div>
                                {event.completedAt && (
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Terminé le :</span>
                                        <span>{new Date(event.completedAt).toLocaleDateString('fr-FR', {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 🎯 ACTIONS */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        {!event.isCompleted && (
                            <Button
                                onClick={() => {
                                    onComplete(event._id);
                                    onClose();
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marquer comme terminé
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => {
                                onEdit(event);
                                onClose();
                            }}
                            className="flex-1"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="sm:w-auto"
                        >
                            Fermer
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EventDetailsModal; 
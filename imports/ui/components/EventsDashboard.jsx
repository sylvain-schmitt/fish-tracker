import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useEvents } from '../hooks/useEvents.js';
import { useFish } from '../hooks/useFish.js';
import { EVENT_TYPES, EVENT_PRIORITIES } from '../../api/events/EventsCollection.js';
import { Plus, Calendar, Clock, CheckCircle, AlertTriangle, Fish, Eye, Trash2 } from 'lucide-react';
import EventForm from './EventForm.jsx';
import UrgentEventAlert from './UrgentEventAlert.jsx';
import EventDetailsModal from './EventDetailsModal.jsx';

/**
 * 📅 DASHBOARD DES ÉVÉNEMENTS - GESTION ET SUIVI
 * 
 * Ce composant orchestre la gestion des événements d'aquarium :
 * - Vue d'ensemble avec compteurs visuels
 * - Liste des événements à venir et en retard
 * - Actions rapides (marquer terminé, ajouter)
 * - Interface responsive et moderne
 * 
 * 📚 Concepts React appris :
 * - Hooks personnalisés pour les données réactives
 * - Gestion d'état local pour l'interface
 * - Formatage de dates et calculs temporels
 * - Composants conditionnels et listes dynamiques
 * - Actions utilisateur avec feedback
 * 
 * 🎯 Fonctionnalités :
 * - Compteurs : aujourd'hui, en retard, total
 * - Liste interactive des événements
 * - Filtrage par statut et type
 * - Actions rapides sur chaque événement
 */
const EventsDashboard = () => {
    // 🎣 HOOKS POUR LES DONNÉES RÉACTIVES
    const {
        events,           // Liste complète des événements
        isReady,          // État de chargement des données
        isLoading,        // État de chargement des opérations
        error,            // Erreurs éventuelles
        clearError,       // Fonction pour nettoyer les erreurs
        completeEvent,    // Fonction pour marquer un événement comme terminé
        deleteEvent,      // Fonction pour supprimer un événement
        eventStats        // Statistiques des événements
    } = useEvents();

    const { fish } = useFish(); // Pour afficher les noms des poissons

    // 🔄 ÉTATS LOCAUX POUR L'INTERFACE
    const [showAddForm, setShowAddForm] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'today', 'overdue', 'pending'
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null); // Pour voir les détails
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    /**
     * 📊 CALCULS DES STATISTIQUES - MAINTENANT DEPUIS LE HOOK
     * Les statistiques sont maintenant calculées dans le hook useEvents
     */
    const stats = eventStats;

    /**
     * 🎨 FONCTIONS DE FORMATAGE
     */
    const formatDate = (date) => {
        const eventDate = new Date(date);
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (eventDate >= today && eventDate < tomorrow) {
            return `Aujourd'hui ${eventDate.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        } else if (eventDate >= tomorrow && eventDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
            return `Demain ${eventDate.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        } else {
            return eventDate.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const getFishName = (fishId) => {
        if (!fishId) return 'Aquarium général';
        const fishItem = fish.find(f => f._id === fishId);
        return fishItem ? fishItem.name : 'Poisson inconnu';
    };

    const getEventTypeInfo = (type) => {
        return EVENT_TYPES[type] || EVENT_TYPES.other;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-red-100 text-red-800'
        };
        return colors[priority] || colors.medium;
    };

    /**
     * 🔧 GESTION DES ACTIONS
     */
    const handleCompleteEvent = async (eventId) => {
        try {
            await completeEvent(eventId, 'Terminé depuis le dashboard');
        } catch (err) {
            console.error('Erreur lors du marquage comme terminé:', err);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
            try {
                await deleteEvent(eventId);
            } catch (err) {
                console.error('Erreur lors de la suppression:', err);
            }
        }
    };

    /**
     * 🗑️ SUPPRIMER TOUTES LES TÂCHES TERMINÉES
     */
    const handleDeleteCompletedEvents = async () => {
        const completedEvents = events.filter(event => event.isCompleted);

        if (completedEvents.length === 0) {
            alert('Aucune tâche terminée à supprimer.');
            return;
        }

        const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${completedEvents.length} tâche${completedEvents.length > 1 ? 's' : ''} terminée${completedEvents.length > 1 ? 's' : ''} ?`;

        if (confirm(confirmMessage)) {
            try {
                // Supprimer toutes les tâches terminées une par une
                for (const event of completedEvents) {
                    await deleteEvent(event._id);
                }
                setSuccessMessage(`${completedEvents.length} tâche${completedEvents.length > 1 ? 's' : ''} terminée${completedEvents.length > 1 ? 's' : ''} supprimée${completedEvents.length > 1 ? 's' : ''} !`);
            } catch (err) {
                console.error('Erreur lors de la suppression en lot:', err);
            }
        }
    };

    /**
     * 👁️ VOIR LES DÉTAILS D'UN ÉVÉNEMENT
     */
    const handleViewEvent = (event) => {
        setSelectedEvent(event);
        setShowDetailsModal(true);
    };

    /**
     * ✏️ ÉDITER UN ÉVÉNEMENT
     */
    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setShowAddForm(true);
    };

    /**
     * 🔍 FILTRAGE DES ÉVÉNEMENTS
     */
    const getFilteredEvents = () => {
        if (!events) return [];

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        switch (filter) {
            case 'today':
                return events.filter(event => {
                    const eventDate = new Date(event.scheduledAt);
                    return eventDate >= startOfDay && eventDate <= endOfDay;
                });
            case 'overdue':
                return events.filter(event =>
                    !event.isCompleted && new Date(event.scheduledAt) < now
                );
            case 'pending':
                return events.filter(event => !event.isCompleted);
            default:
                return events;
        }
    };

    const filteredEvents = getFilteredEvents().sort((a, b) =>
        new Date(a.scheduledAt) - new Date(b.scheduledAt)
    );

    /**
     * 🎉 GESTION DU SUCCÈS DE CRÉATION/MODIFICATION
     */
    const handleFormSuccess = (message) => {
        setSuccessMessage(message);
        // Effacer le message après 3 secondes
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    return (
        <div className="space-y-6">
            {/* 📊 EN-TÊTE AVEC STATISTIQUES */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                        Événements
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Suivi des activités de votre aquarium
                    </p>
                </div>

                <Button
                    onClick={() => setShowAddForm(true)}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter un événement</span>
                </Button>
            </div>

            {/* 🎉 MESSAGE DE SUCCÈS */}
            {successMessage && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            {/* 🚨 AFFICHAGE DES ERREURS */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {error}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearError}
                            className="ml-2"
                        >
                            Fermer
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* 🚨 ALERTES URGENTES POUR ÉVÉNEMENTS EN RETARD */}
            {(() => {
                const now = new Date();
                const urgentEvents = events.filter(event =>
                    !event.isCompleted && new Date(event.scheduledAt) < now
                ).slice(0, 3); // Limite à 3 alertes pour ne pas surcharger

                return urgentEvents.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold text-red-700 flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 animate-pulse" />
                            <span>Événements urgents ({stats.overdue})</span>
                        </h2>
                        {urgentEvents.map(event => (
                            <UrgentEventAlert
                                key={event._id}
                                event={event}
                                fishName={getFishName(event.fishId)}
                                onComplete={handleCompleteEvent}
                                onView={handleViewEvent}
                            />
                        ))}
                        {stats.overdue > 3 && (
                            <Alert className="border-orange-500 bg-orange-50">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                <AlertDescription className="text-orange-800">
                                    <strong>+{stats.overdue - 3} autres événements</strong> nécessitent également votre attention.
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFilter('overdue')}
                                        className="ml-2"
                                    >
                                        Voir tous les retards
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                );
            })()}

            {/* 📈 CARTES DE STATISTIQUES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
                                <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <div>
                                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                                <p className="text-xs text-muted-foreground">En retard</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <div>
                                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                                <p className="text-xs text-muted-foreground">À faire</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                                <p className="text-xs text-muted-foreground">Terminés</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 🔍 FILTRES */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    Tous ({stats.total})
                </Button>
                <Button
                    variant={filter === 'today' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('today')}
                >
                    Aujourd'hui ({stats.today})
                </Button>
                <Button
                    variant={filter === 'overdue' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('overdue')}
                >
                    En retard ({stats.overdue})
                </Button>
                <Button
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('pending')}
                >
                    À faire ({stats.pending})
                </Button>

                {/* Séparateur visuel */}
                {stats.completed > 0 && (
                    <>
                        <div className="hidden sm:block w-px bg-border self-stretch mx-2"></div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteCompletedEvents}
                            disabled={isLoading || stats.completed === 0}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Supprimer les terminées ({stats.completed})
                        </Button>
                    </>
                )}
            </div>

            {/* 📋 LISTE DES ÉVÉNEMENTS */}
            {!isReady ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Chargement des événements...</p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            Aucun événement
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {filter === 'all'
                                ? 'Vous n\'avez pas encore d\'événements planifiés.'
                                : `Aucun événement pour le filtre "${filter}".`
                            }
                        </p>
                        <Button onClick={() => setShowAddForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Créer mon premier événement
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredEvents.map((event) => {
                        const typeInfo = getEventTypeInfo(event.type);
                        const isOverdue = !event.isCompleted && new Date(event.scheduledAt) < new Date();

                        return (
                            <Card key={event._id} className={`${event.isCompleted
                                ? 'bg-green-50 border-green-200'
                                : isOverdue
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-card'
                                }`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <span className="text-xl">{typeInfo.icon}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="font-medium text-foreground">
                                                        {event.title}
                                                    </h3>
                                                    <Badge variant="secondary" className={typeInfo.color}>
                                                        {typeInfo.label}
                                                    </Badge>
                                                    {event.priority !== 'medium' && (
                                                        <Badge className={getPriorityColor(event.priority)}>
                                                            {EVENT_PRIORITIES[event.priority]?.label}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center space-x-1">
                                                        <Fish className="h-3 w-3" />
                                                        <span>{getFishName(event.fishId)}</span>
                                                    </span>
                                                    <span className="flex items-center space-x-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{formatDate(event.scheduledAt)}</span>
                                                    </span>
                                                </div>
                                                {event.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {event.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {event.isCompleted ? (
                                                <Badge variant="success" className="bg-green-100 text-green-800">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Terminé
                                                </Badge>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleCompleteEvent(event._id)}
                                                    disabled={isLoading}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* 📅 FORMULAIRE D'ÉVÉNEMENT */}
            <EventForm
                isOpen={showAddForm}
                onClose={() => {
                    setShowAddForm(false);
                    setEditingEvent(null);
                }}
                mode={editingEvent ? "edit" : "add"}
                eventData={editingEvent}
                onSuccess={handleFormSuccess}
            />

            {/* 📋 MODALE DE DÉTAILS */}
            <EventDetailsModal
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedEvent(null);
                }}
                event={selectedEvent}
                fishName={selectedEvent ? getFishName(selectedEvent.fishId) : ''}
                onComplete={handleCompleteEvent}
                onEdit={handleEditEvent}
            />
        </div>
    );
};

export default EventsDashboard; 
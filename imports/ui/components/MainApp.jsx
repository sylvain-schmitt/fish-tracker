import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Button } from './ui/button';
import { useFish } from '../hooks/useFish.js';
import { useEvents } from '../hooks/useEvents.js';
import FishDashboard from './FishDashboard.jsx';
import EventsDashboard from './EventsDashboard.jsx';
import AnalyticsDashboard from './AnalyticsDashboard.jsx';
import NotificationManager from './NotificationManager.jsx';
import { Fish, Calendar, AlertTriangle, BarChart3 } from 'lucide-react';

/**
 * 🏠 COMPOSANT PRINCIPAL - ORCHESTRATEUR AVEC NAVIGATION
 * 
 * Ce composant gère maintenant :
 * - Layout général de l'application (header + navigation)
 * - Navigation par onglets entre les différentes sections
 * - Gestion de l'authentification (déconnexion)
 * - Orchestration des composants spécialisés
 * - Badges et notifications visuelles
 * 
 * 📚 Concepts appris :
 * - Navigation par onglets avec état local
 * - Rendu conditionnel de composants
 * - Interface responsive avec compteurs
 * - Architecture modulaire évolutive
 * - Notifications et badges visuels
 * 
 * 🎯 Sections disponibles :
 * - 🐠 Poissons : Gestion des poissons de l'aquarium
 * - 📅 Événements : Suivi des activités et rappels
 * - 📊 Analyse : Statistiques et tableaux de bord
 */
const MainApp = ({ user }) => {
    // 🎣 HOOKS POUR LES DONNÉES ET STATISTIQUES
    const { fishCount, isReady } = useFish();
    const { eventStats } = useEvents();

    // 🔄 ÉTAT LOCAL POUR LA NAVIGATION
    const [activeTab, setActiveTab] = useState('fish'); // 'fish', 'events', ou 'analytics'

    /**
     * Gestion de la déconnexion
     * Utilise Meteor.logout() pour une déconnexion sécurisée
     */
    const handleLogout = () => {
        Meteor.logout((err) => {
            if (err) {
                console.error('Erreur lors de la déconnexion:', err);
            }
        });
    };

    /**
     * 📊 DONNÉES POUR LES ONGLETS AVEC BADGES
     * Configuration des onglets avec icônes et compteurs intelligents
     */
    const tabs = [
        {
            id: 'fish',
            label: 'Poissons',
            icon: Fish,
            count: isReady ? fishCount : null,
            badgeColor: 'bg-blue-500 text-white',
            component: FishDashboard
        },
        {
            id: 'events',
            label: 'Événements',
            icon: Calendar,
            count: eventStats.overdue > 0 ? eventStats.overdue : eventStats.pending,
            badgeColor: eventStats.overdue > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white',
            urgentIcon: eventStats.overdue > 0 ? AlertTriangle : null,
            component: EventsDashboard
        },
        {
            id: 'analytics',
            label: 'Analyse',
            icon: BarChart3,
            count: null, // Pas de badge pour l'analyse
            badgeColor: 'bg-purple-500 text-white',
            component: AnalyticsDashboard
        }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || FishDashboard;

    return (
        <div className="min-h-screen bg-background">
            {/* 🔔 GESTIONNAIRE DE NOTIFICATIONS EN ARRIÈRE-PLAN */}
            <NotificationManager />

            {/* 🎯 HEADER GLOBAL */}
            <header className="bg-card border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo et titre */}
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                                <span className="hidden sm:inline">Fish Tracker 🐠</span>
                                <span className="sm:hidden">🐠 Fish</span>
                            </h1>
                        </div>

                        {/* Informations utilisateur et déconnexion */}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {/* Informations utilisateur - Responsive */}
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                {/* Version desktop */}
                                <span className="hidden md:inline">
                                    Connecté en tant que{' '}
                                    <span className="font-medium text-foreground">
                                        {user.username || user.emails?.[0]?.address || 'Utilisateur'}
                                    </span>
                                </span>
                                {/* Version tablet */}
                                <span className="hidden sm:inline md:hidden">
                                    <span className="font-medium text-foreground">
                                        {user.username ||
                                            (user.emails?.[0]?.address?.split('@')[0] + '...') ||
                                            'Utilisateur'}
                                    </span>
                                </span>
                                {/* Version mobile */}
                                <span className="sm:hidden">
                                    <span className="font-medium text-foreground">
                                        {user.username ||
                                            (user.emails?.[0]?.address?.split('@')[0] + '...') ||
                                            'Utilisateur'}
                                    </span>
                                </span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="text-xs sm:text-sm"
                            >
                                <span className="hidden sm:inline">Déconnexion</span>
                                <span className="sm:hidden">↪️</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* 📋 NAVIGATION PAR ONGLETS */}
            <nav className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const UrgentIcon = tab.urgentIcon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative
                                        ${isActive
                                            ? 'border-primary text-primary bg-primary/5'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                                        }
                                    `}
                                >
                                    <div className="flex items-center space-x-1">
                                        <Icon className="h-4 w-4" />
                                        {/* Icône d'urgence pour les événements en retard */}
                                        {UrgentIcon && (
                                            <UrgentIcon className="h-3 w-3 text-red-500 animate-pulse" />
                                        )}
                                    </div>
                                    <span className="hidden xs:inline">{tab.label}</span>
                                    {tab.count !== null && tab.count > 0 && (
                                        <span className={`
                                            inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full min-w-[1.25rem] h-5
                                            ${tab.badgeColor}
                                        `}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* 🎯 CONTENU PRINCIPAL - COMPOSANT ACTIF */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ActiveComponent />
            </main>
        </div>
    );
};

export default MainApp; 
import React from 'react';
import { useAnalytics } from '../hooks/useAnalytics.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
    Fish,
    Calendar,
    TrendingUp,
    BarChart3,
    Clock,
    CheckCircle,
    AlertTriangle,
    Users,
    Activity
} from 'lucide-react';

/**
 * 📊 TABLEAU DE BORD D'ANALYSE
 * 
 * Ce composant affiche toutes les statistiques et analyses de l'application :
 * - Vue d'ensemble avec métriques clés
 * - Statistiques détaillées des poissons
 * - Analyse des événements et tâches
 * - Graphique simple d'activité
 * - Tendances et insights
 * 
 * 📚 Concepts appris :
 * - Utilisation d'un hook personnalisé complexe
 * - Affichage de données statistiques
 * - Cartes et grilles responsive
 * - Indicateurs visuels (Progress, Badge)
 * - Icônes contextuelles
 * - Formatage de données pour l'affichage
 * 
 * 🎯 Architecture :
 * - Séparation logique/affichage (hook/composant)
 * - Composants réutilisables (Card, Badge, Progress)
 * - Design responsive et accessible
 * - Gestion des états de chargement
 */
const AnalyticsDashboard = () => {
    const {
        isReady,
        fishStats,
        eventStats,
        formattedData
    } = useAnalytics();

    // 🔄 État de chargement
    if (!isReady) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">Analyse & Statistiques</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                <div className="h-8 bg-muted rounded w-1/2"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="text-center text-muted-foreground">
                    Chargement des analyses...
                </div>
            </div>
        );
    }

    // 🎨 COMPOSANT CARTE DE MÉTRIQUE
    const MetricCard = ({ title, value, subtitle, icon: Icon, color = "text-primary", trend = null }) => (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                    </div>
                    <Icon className={`h-8 w-8 ${color}`} />
                </div>
                {trend && (
                    <div className="mt-4 flex items-center text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {trend}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    // 🎨 COMPOSANT LISTE TOP
    const TopList = ({ title, items, icon: Icon, emptyMessage }) => (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <span>{title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {items.length > 0 ? (
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    {item.species || item.type}
                                </span>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {item.count}
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {emptyMessage}
                    </p>
                )}
            </CardContent>
        </Card>
    );

    // 🎨 COMPOSANT GRAPHIQUE SIMPLE (BARRES)
    const SimpleBarChart = ({ data, title }) => (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>{title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data.map((day, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{day.date}</span>
                                <span className="text-muted-foreground">
                                    {day.events} événement{day.events !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                                    style={{
                                        width: `${day.events > 0 ? Math.max((day.events / Math.max(...data.map(d => d.events))) * 100, 10) : 0}%`
                                    }}
                                />
                            </div>
                            {day.completed > 0 && (
                                <div className="text-xs text-green-600 flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {day.completed} terminé{day.completed !== 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* 🎯 HEADER */}
            <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Analyse & Statistiques</h2>
            </div>

            {/* 📊 MÉTRIQUES PRINCIPALES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                    title="Poissons"
                    value={fishStats.totalCount}
                    subtitle={`${fishStats.speciesCount} espèce${fishStats.speciesCount !== 1 ? 's' : ''}`}
                    icon={Fish}
                    color="text-blue-600"
                />

                <MetricCard
                    title="Événements"
                    value={eventStats.totalEvents}
                    subtitle={`${eventStats.completedEvents} terminés`}
                    icon={Calendar}
                    color="text-green-600"
                />

                <MetricCard
                    title="Temps moyen dans l'aquarium"
                    value={fishStats.averageAge > 0 ? `${fishStats.averageAge} ans` : 'N/A'}
                    subtitle={fishStats.averageAge > 0 ? `${fishStats.averageAgeInDays} jours` : 'Dates d\'introduction manquantes'}
                    icon={Activity}
                    color="text-purple-600"
                />
            </div>

            {/* 🚨 ALERTES ET STATUTS */}
            {eventStats.overdueEvents > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <span className="font-medium text-red-800">
                                {eventStats.overdueEvents} événement{eventStats.overdueEvents !== 1 ? 's' : ''} en retard
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 📈 SECTION PRINCIPALE - GRILLE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 🐠 TOP ESPÈCES */}
                <TopList
                    title="Espèces les plus représentées"
                    items={formattedData.topSpecies}
                    icon={Users}
                    emptyMessage="Aucun poisson ajouté"
                />

                {/* 📅 TOP ÉVÉNEMENTS */}
                <TopList
                    title="Types d'événements fréquents"
                    items={formattedData.topEventTypes}
                    icon={Clock}
                    emptyMessage="Aucun événement planifié"
                />

                {/* 📊 GRAPHIQUE ACTIVITÉ */}
                <SimpleBarChart
                    data={formattedData.last7Days}
                    title="Activité des 7 derniers jours"
                />

                {/* 🎯 MÉTRIQUES DÉTAILLÉES */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5" />
                            <span>Répartition des événements</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* Événements spécifiques aux poissons */}
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Événements spécifiques aux poissons</span>
                                <span className="font-medium">{eventStats.fishSpecificEvents}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${eventStats.totalEvents > 0 ? (eventStats.fishSpecificEvents / eventStats.totalEvents) * 100 : 0}%`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Événements généraux */}
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Événements généraux (aquarium)</span>
                                <span className="font-medium">{eventStats.generalEvents}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${eventStats.totalEvents > 0 ? (eventStats.generalEvents / eventStats.totalEvents) * 100 : 0}%`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Événements en attente */}
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Événements en attente</span>
                                <span className="font-medium">{eventStats.pendingEvents}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${eventStats.totalEvents > 0 ? (eventStats.pendingEvents / eventStats.totalEvents) * 100 : 0}%`
                                    }}
                                />
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>

            {/* 🎯 INSIGHTS ET RECOMMANDATIONS */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">💡 Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        {fishStats.totalCount === 0 && (
                            <p className="text-muted-foreground">
                                • Commencez par ajouter vos premiers poissons pour voir des analyses détaillées
                            </p>
                        )}

                        {fishStats.totalCount > 0 && eventStats.totalEvents === 0 && (
                            <p className="text-muted-foreground">
                                • Planifiez des événements pour vos {fishStats.totalCount} poisson{fishStats.totalCount !== 1 ? 's' : ''} pour un meilleur suivi
                            </p>
                        )}

                        {fishStats.averageAge === 0 && fishStats.totalCount > 0 && (
                            <p className="text-amber-600">
                                • Ajoutez les dates d'introduction de vos poissons pour voir leur ancienneté dans l'aquarium
                            </p>
                        )}

                        {fishStats.averageAge > 1 && (
                            <p className="text-green-600">
                                • Vos poissons sont dans votre aquarium depuis {fishStats.averageAge} ans en moyenne, ils sont bien établis !
                            </p>
                        )}

                        {fishStats.speciesCount > 3 && (
                            <p className="text-blue-600">
                                • Vous avez {fishStats.speciesCount} espèces différentes, votre aquarium est bien diversifié !
                            </p>
                        )}

                        {eventStats.generalEvents > eventStats.fishSpecificEvents && eventStats.totalEvents > 0 && (
                            <p className="text-purple-600">
                                • Vous avez plus d'événements généraux ({eventStats.generalEvents}) que spécifiques aux poissons ({eventStats.fishSpecificEvents})
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AnalyticsDashboard;
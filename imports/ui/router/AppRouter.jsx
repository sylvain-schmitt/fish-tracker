import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// 🌐 IMPORT DU CONTEXTE D'AUTHENTIFICATION
import { useAuth } from '../context/AuthContext';

// 📄 IMPORTS DES COMPOSANTS DE PAGE
import LoadingPage from '../components/layout/LoadingPage';
import TokenVerificationPage from '../components/auth/TokenVerificationPage';
import EmailVerificationPage from '../components/auth/EmailVerificationPage';

// 🔐 IMPORTS DES COMPOSANTS D'AUTHENTIFICATION
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import MainApp from '../components/MainApp';

/**
 * 🛡️ COMPOSANT DE ROUTE PROTÉGÉE
 * 
 * Utilise maintenant le contexte partagé pour l'authentification
 * Résout le problème des erreurs non affichées !
 */
const ProtectedRoute = ({ children, requireAuth = false, requireVerifiedEmail = false }) => {
    // Utilisation du contexte au lieu du hook direct
    const authState = useAuth();

    // ⏳ Chargement en cours
    if (authState.isLoading) {
        return <LoadingPage />;
    }

    // 🔄 Vérification token en cours
    if (authState.isVerifyingToken || authState.tokenVerificationMessage) {
        return (
            <TokenVerificationPage
                isVerifyingToken={authState.isVerifyingToken}
                tokenVerificationMessage={authState.tokenVerificationMessage}
                tokenVerificationError={authState.tokenVerificationError}
                onClearError={authState.clearTokenVerificationError}
            />
        );
    }

    // 🔐 Route nécessitant une authentification
    if (requireAuth && !authState.currentUser) {
        return <Navigate to="/login" replace />;
    }

    // 📧 Route nécessitant un email vérifié
    if (requireVerifiedEmail && authState.currentUser && !authState.emailVerified) {
        return <Navigate to="/verify-email" replace />;
    }

    // ✅ Utilisateur connecté avec email vérifié essayant d'accéder aux pages d'auth
    if (authState.currentUser && authState.emailVerified &&
        (window.location.pathname === '/login' || window.location.pathname === '/register')) {
        return <Navigate to="/dashboard" replace />;
    }

    // 🔔 NOUVELLE LOGIQUE : Utilisateur connecté mais email non vérifié essayant d'accéder aux pages d'auth
    if (authState.currentUser && !authState.emailVerified &&
        (window.location.pathname === '/login' || window.location.pathname === '/register')) {
        return <Navigate to="/verify-email" replace />;
    }

    return children;
};

/**
 * 🔐 PAGE DE CONNEXION AVEC LOGIQUE
 */
const LoginPage = () => {
    // Utilisation du contexte au lieu du hook direct
    const authState = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* En-tête de l'application */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                        Fish Tracker 🐠
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Connectez-vous à votre aquarium virtuel
                    </p>
                </div>

                <LoginForm
                    onToggleMode={() => navigate('/register')}
                    onError={authState.handleLoginError}
                    onClearError={authState.clearLoginError}
                    error={authState.loginError}
                    errorKey={authState.loginErrorKey}
                />
            </div>
        </div>
    );
};

/**
 * 📝 PAGE D'INSCRIPTION AVEC LOGIQUE
 */
const RegisterPage = () => {
    // Utilisation du contexte au lieu du hook direct
    const authState = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* En-tête de l'application */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                        Fish Tracker 🐠
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Créez votre premier aquarium virtuel
                    </p>
                </div>

                <RegisterForm onToggleMode={() => navigate('/login')} />
            </div>
        </div>
    );
};

/**
 * 📧 PAGE DE VÉRIFICATION EMAIL AVEC LOGIQUE
 */
const EmailVerificationRoute = () => {
    // Utilisation du contexte au lieu du hook direct
    const authState = useAuth();

    return (
        <EmailVerificationPage
            currentUser={authState.currentUser}
            isResending={authState.isResending}
            resendMessage={authState.resendMessage}
            resendError={authState.resendError}
            onResendEmail={authState.handleResendEmail}
        />
    );
};

/**
 * 🏠 PAGE PRINCIPALE AVEC LOGIQUE
 */
const DashboardPage = () => {
    // Utilisation du contexte au lieu du hook direct
    const authState = useAuth();
    return <MainApp user={authState.currentUser} />;
};

/**
 * 🌐 COMPOSANT ROUTER PRINCIPAL
 * 
 * Tous les composants utilisent maintenant le même contexte d'auth
 * Les erreurs de connexion seront correctement partagées !
 * 
 * ✅ Future flags ajoutés pour React Router v7
 */
const AppRouter = () => {
    return (
        <BrowserRouter
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
            }}
        >
            <Routes>
                {/* 🔐 ROUTES D'AUTHENTIFICATION */}
                <Route
                    path="/login"
                    element={
                        <ProtectedRoute>
                            <LoginPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/register"
                    element={
                        <ProtectedRoute>
                            <RegisterPage />
                        </ProtectedRoute>
                    }
                />

                {/* 📧 ROUTE DE VÉRIFICATION EMAIL */}
                <Route
                    path="/verify-email"
                    element={
                        <ProtectedRoute requireAuth={true}>
                            <EmailVerificationRoute />
                        </ProtectedRoute>
                    }
                />

                {/* 🏠 ROUTE PRINCIPALE PROTÉGÉE */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute requireAuth={true} requireVerifiedEmail={true}>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />

                {/* 🎯 ROUTE PAR DÉFAUT */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* 404 - Route non trouvée */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter; 
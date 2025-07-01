import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import './main.css';
import App from '/imports/ui/App';

/**
 * Configuration globale du gestionnaire de liens de vérification email
 * IMPORTANT : Doit être configuré au niveau global, pas dans un composant React
 * 
 * Cette fonction intercepte tous les clics sur les liens de vérification email
 * et permet de gérer le flux de vérification de manière personnalisée
 */
Accounts.onEmailVerificationLink((token, done) => {

  // Stocker le token et l'état dans le localStorage pour que l'App puisse les récupérer
  localStorage.setItem('emailVerificationToken', token);
  localStorage.setItem('emailVerificationInProgress', 'true');

});

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container);
  root.render(<App />);
});

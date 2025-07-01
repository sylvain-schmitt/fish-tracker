import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import fs from 'fs';
import path from 'path';
import { STORAGE_CONFIG } from './ImageConfig.js';

/**
 * 🖼️ SERVEUR D'IMAGES PERSONNALISÉ
 * 
 * Ce module crée une route personnalisée pour servir les images uploadées
 * si Meteor ne sert pas correctement les fichiers statiques du dossier public/
 * 
 * Route : /api/images/:filename
 * Exemple : http://localhost:3000/api/images/fish-user123-timestamp.jpeg
 */

/**
 * 🎯 FONCTION POUR TROUVER LE DOSSIER RACINE DU PROJET
 */
const getProjectRoot = () => {
    let projectRoot;

    if (process.env.PWD && fs.existsSync(path.join(process.env.PWD, '.meteor'))) {
        projectRoot = process.env.PWD;
    } else {
        let currentDir = process.cwd();
        while (currentDir !== '/' && !fs.existsSync(path.join(currentDir, '.meteor'))) {
            currentDir = path.dirname(currentDir);
        }
        projectRoot = currentDir;
    }

    return projectRoot;
};

/**
 * 🛠️ CONFIGURATION DU SERVEUR D'IMAGES
 */
export const setupImageServer = () => {

    // Route pour servir les images : /api/images/:userId/:filename
    WebApp.connectHandlers.use('/api/images', (req, res, next) => {
        // Extraire userId et filename de l'URL
        const urlParts = req.url.substring(1).split('/'); // Enlever le "/" initial et séparer
        
        if (urlParts.length !== 2) {
            res.writeHead(400);
            res.end('Format d\'URL invalide. Attendu: /api/images/userId/filename');
            return;
        }

        const [userId, filename] = urlParts;

        if (!userId || !filename) {
            res.writeHead(400);
            res.end('UserId et nom de fichier requis');
            return;
        }

        try {
            // Construire le chemin vers le fichier avec le dossier utilisateur
            const projectRoot = getProjectRoot();
            const userDirectory = STORAGE_CONFIG.getUserDirectory(userId);
            const filePath = path.join(projectRoot, userDirectory, filename);


            // Vérifier que le fichier existe
            if (!fs.existsSync(filePath)) {
                res.writeHead(404);
                res.end('Image non trouvée');
                return;
            }

            // Lire le fichier
            const fileBuffer = fs.readFileSync(filePath);

            // Déterminer le type MIME basé sur l'extension
            const ext = path.extname(filename).toLowerCase();
            let mimeType = 'application/octet-stream';

            switch (ext) {
                case '.jpg':
                case '.jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case '.png':
                    mimeType = 'image/png';
                    break;
                case '.webp':
                    mimeType = 'image/webp';
                    break;
                case '.gif':
                    mimeType = 'image/gif';
                    break;
            }

            // Envoyer l'image avec les bons headers
            res.writeHead(200, {
                'Content-Type': mimeType,
                'Content-Length': fileBuffer.length,
                'Cache-Control': 'public, max-age=31536000', // Cache 1 an
                'ETag': `"${filename}-${fs.statSync(filePath).mtime.getTime()}"`
            });

            res.end(fileBuffer);

        } catch (error) {
            console.error(`❌ [IMAGE SERVER] Erreur pour ${userId}/${filename}:`, error);
            res.writeHead(500);
            res.end('Erreur serveur');
        }
    });

};

/**
 * 🔄 FONCTION POUR MODIFIER L'URL DE BASE
 * 
 * Cette fonction met à jour la configuration pour utiliser le serveur personnalisé
 */
export const updateImageBaseUrl = () => {
    // Modifier la configuration pour utiliser notre serveur personnalisé
    STORAGE_CONFIG.BASE_URL = '/api/images/';
}; 
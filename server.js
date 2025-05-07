const http = require('http');
const app = require('./app');

const normalizePort = val => {
    const port = parseInt(val, 10); // On essaie de convertir en nombre

    if (isNaN(port)) { // Si ce n’est pas un nombre (ex: une chaîne nommée comme un pipe)
        return val; // On retourne la valeur telle quelle
    }
    if (port >= 0) { // Si c’est un numéro de port valide
        return port;
    }
    return false; // Sinon, on retourne false pour indiquer une erreur
};

const port = normalizePort(process.env.PORT || 4000); //4000 remplace 3000 car la requête du frontend se fait sur le port 3000.
app.set('port', port); // On informe express du port choisi

const errorHandler = error => {
    if (error.syscall !== 'listen') { // Si l'erreur ne concerne pas l'écoute du port, on la relance
        throw error;
    }
    const address = server.address(); // On récupère l'adresse deu serveur
    const bind = typeof address === 'string' ? 'pipe' + address : 'port' + port; // On détermine le type: pipe ou port
    switch (error.code) { // On gère les erreurs connues
        case 'EACCES': // Pas les permissions nécessaires
            console.error(bind + ' requires elevated privileges.');
            process.exit(1); //On arrête le serveur avec une erreur
            break;
        case 'EADDRINUSE': // Le port est déjà utilisé
            console.error(bind + ' is already in use.');
            process.exit(1); // On arrête aussi avec une erreur
            break;
        default: // Toute autre erreur est relancée
            throw error;
    }
};

const server = http.createServer(app); // On créé le serveur en lui passant l'app Express

server.on('error', errorHandler); // On attache notre gestionnaire d'erreur au serveur
server.on('listening', () => { // Quand le serveur démarre, on affiche une info dans la console
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe' + address : 'port' + port;
    console.log('Listening on ' + bind);
});

server.listen(port); // On dit au serveur de commencer à écouter sur le port choisi
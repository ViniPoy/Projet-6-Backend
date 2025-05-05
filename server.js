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
app.set('port', port); // ON informe express du port choisi

const errorHandler = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe' + address : 'port' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges.');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.');
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const server = http.createServer(app);

server.on('error', errorHandler);
server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe' + address : 'port' + port;
    console.log('Listening on ' + bind);
});

server.listen(port);
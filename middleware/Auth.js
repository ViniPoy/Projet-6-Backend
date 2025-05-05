const jwt = require('jsonwebtoken'); // Permet de décoder et vérifier le token d'authentification.

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; 
        // On extrait le token depuis le header Authorization : "Bearer <token>"
        // split(' ') crée un tableau ["Bearer", "<token>"], donc on prend l'élément [1]

        const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
        // On vérifie le token avec la clé secrète (même utilisée pour signer lors du login)
        // jwt.verify renvoie le payload (ici un objet avec userId)

        const userId = decodedToken.userId; 
        // On extrait le userId contenu dans le token

        req.auth = { userId: userId }; 
        // On ajoute le userId au champ `auth` de l’objet `req` (ça permet de l'utiliser ailleurs)

        next(); 
        // On passe au middleware suivant (ou à la route si c'était le dernier)
    } catch (error) {
        res.status(401).json({ error });
    }
};
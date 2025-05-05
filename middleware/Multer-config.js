const multer = require('multer'); // Multer est un middleware pour gérer les fichiers entrants (ex: images)

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images') // ON enregistre le fichier dans le dossier images
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_'); //On remplace les espaces par des underscores pour éviter les problèmes dans les noms de fichiers
        const extension = MIME_TYPES[file.mimetype]; // On détermine l'extension correcte en fonction du type MIME du fichier
        callback(null, name + Date.now() + '.' + extension); // On génère un nom unique avec la date/heure pour éviter les collisions de noms
    }
});

module.exports = multer({storage: storage}).single('image'); // On exporte notre middleware configuré pour géré un seul fichier nommé 'image' (champ attendu dans le formulaire)
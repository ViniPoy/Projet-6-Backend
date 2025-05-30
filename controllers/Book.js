const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const Book = require('../models/Book');

exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
};

exports.getBestRatedBook = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 }) // On trie les livres dans l'ordre décroissant
        .limit(3) // Et on n'en affiche que 3, donc ici les trois mieux notés
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book); // On récupère le contenu json de l'objet livre
    delete bookObject._id; // Puis on supprime l'id fournit par le json car un nouveau  est fournit par l'api
    delete bookObject._userId; // Ainsi que le userID sur le même principe

    const inputPath = req.file.path; // ex: images/monimage123.jpg
    const filename = req.file.filename.split('.')[0] + '.webp'; // ex monimage123.webp
    const outputPath = path.join('images', filename); // images/monimage123.webp

    sharp(inputPath)
        .webp({ quality: 100 }) // compression de l'image
        .toFile(outputPath)
        .then(() => {
            //On supprime l'originale non compressé
            fs.unlink(inputPath, (err) => {
                if (err) console.error('Erreur de suppression fichier original: ', err);
            });
            const rating = bookObject.rating ?? bookObject.ratings?.[0]?.grade ?? 0; // S'il y a un champ rating simple, on le prend, sinon on essaie de prendre la première note du tableau 'ratings', si aucune de ces deux notes ne sont défini, on prend 0 par défaut.
            const ratings = bookObject.ratings ?? [{ // Si le tableau bookObject.rating existe on le garde, sinon on en créé un avec une seule note.
                userId: req.auth.userId,
                grade: rating
            }]
            const book = new Book({ // On créé un nouvel objet livre
                ...bookObject, // Avec le contenu géré en début de code
                userId: req.auth.userId, // Auquel on ajoute un nouveau userId (qui viens de auth)
                ratings, // Ainsi qu'une note 
                averageRating: rating, // Qu'on initialise en tant que moyenne de note
                imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}` // Et on lui ajoute une image qu'on a compressé en webp.
            });
            book.save() // ON enregistre le livre.
                .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error })); 
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? { // Est-ce qu'il y a une image:
        ...JSON.parse(req.body.book), // Si oui on récupère le contenu Json de l'objet livre
        imageUrl: '' // Et on prévoie de modifier l'imageUrl après compression (ce champ doit exister maintenant pour pouvoir y ajouter une valeur plus tard)
    } : { ...req.body }; // Sinon on récupère juste les données de l'objet livre

    delete bookObject._userId; // On supprime le userId qui sera remplacé par un userId provenant de l'auth

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: 'Non autorisé' });
            }
            
            //Si une nouvelle image est fournie
            if (req.file) {
                const inputPath = req.file.path;
                const filename = req.file.filename.split('.')[0] + '.webp';
                const outputPath = path.join('images', filename);

                sharp(inputPath)
                    .webp({ quality: 100 })
                    .toFile(outputPath)
                    .then(() => {
                        // On définit l'URL compressée
                        bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${filename}`;
                        // On supprime l'image non compressée
                        fs.unlink(inputPath, (err) => {
                            if (err) console.warn('Suppression ancienne image échouée : ', err.message);
                        });
                        //On supprime l'ancienne image (l'image associée au livre lors de la création)
                        const oldFilename = book.imageUrl?.split('/images/')[1];
                        if (oldFilename) {
                            fs.unlink(path.join('images', oldFilename), (err) => {
                                if (err) console.warn('Suppression ancienne image échouée : ', err.message);
                            });
                        }
                        Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id }) // ON met à jour le livre avec les nouvelles données.
                            .then(() => res.status(200).json({ message: 'Livre modifié avec image compressée !' }))
                            .catch(error => res.status(400).json({ error }));
                    })
                    .catch(error => res.status(500).json({ error }));
            } else {
                //Aucun fichier image à traiter
                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Livre modifié !' }))
                    .catch(error => res.status(400).json({ error }));
            }
        })
        .catch(error => res.status(400).json({ error }));  
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({message: 'Non autorisé'});
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({_id: req.params.id})
                        .then(() => res.status(200).json({message: 'Livre supprimé !'}))
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => res.status(500).json({ error }));
};

exports.rateBook = (req, res, next) => {
    const userId = req.auth.userId;
    const grade = req.body.rating;
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (!book) return res.status(404).json({ message: 'Livre non trouvé.' });
            if (book.ratings.some(rated => rated.userId === userId)) {
                return res.status(400).json({ message: 'Vous avez déjà noté ce livre !' });
            };
            book.ratings.push({ userId, grade });
            const total = book.ratings.reduce((sum, rated) => sum + rated.grade, 0);
            book.averageRating = total / book.ratings.length;
            book.save()
                .then(updatedBook => res.status(200).json(updatedBook))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));
};
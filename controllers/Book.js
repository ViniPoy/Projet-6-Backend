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
        .sort({ averageRating: -1 })
        .limit(3)
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

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
            const rating = bookObject.rating ?? bookObject.ratings?.[0]?.grade ?? 0;
            const ratings = bookObject.ratings ?? [{
                userId: req.auth.userId,
                grade: rating
            }]
            const book = new Book({
                ...bookObject,
                userId: req.auth.userId,
                ratings,
                averageRating: rating,
                imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}`
            });
            book.save()
                .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error })); 
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: '' // sera défini après compression
    } : { ...req.body };

    delete bookObject._userId;

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
                        // On définit l'URL comppressée
                        bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${filename}`;
                        // On supprime l'image non compressée
                        fs.unlink(inputPath, (err) => {
                            if (err) console.warn('Suppression ancienne image échouée : ', err.message);
                        });
                        //On supprime l'ancienne image
                        const oldFilename = book.imageUrl?.split('/images/')[1];
                        if (oldFilename) {
                            fs.unlink(path.join('images', oldFilename), (err) => {
                                if (err) console.warn('Suppression ancienne image échouée : ', err.message);
                            });
                        }
                        Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
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
const express = require('express');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

app.get('/api/books', (req, res, next) => {
    const books = [
      {
        _id: 'oeihfzeoi',
        title: 'Mon premier objet',
        author: 'George Abitboll',
        imageUrl: 'https://cdn.pixabay.com/photo/2019/06/11/18/56/camera-4267692_1280.jpg',
        year: 1922,
        genre: 'SF',
        ratings: [{
            userId: 'qsomihvqios',
            grade: 4,
        }],
        averageRating: 4
      },
      {
        _id: 'oeihfzhdzu',
        title: 'Mon premier objet',
        author: 'George Abitboll',
        imageUrl: 'https://cdn.pixabay.com/photo/2019/06/11/18/56/camera-4267692_1280.jpg',
        year: 1922,
        genre: 'SF',
        ratings: [{
            userId: 'qsomihvqios',
            grade: 4,
        }],
        averageRating: 4
      },
    ];
    res.status(200).json(books);
});

app.post('/api/books', (req, res, next) => {
    console.log(req.body);
    res.status(201).json({ message: 'objet créé !' });
});

module.exports = app;
const express = require('express');
const mongoose = require('mongoose');

const User = require('./models/User');
const Book = require('./models/Book');

const app = express();
mongoose.connect('mongodb+srv://ViniPoy:Devastator1990!@cluster0.wryjhkn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    {useNewUrlParser: true,
    useUnifiedTopology: true})
    .then(() => console.log('Connexion à mongoDB réussie !'))
    .catch(() => console.log('Connexion à mongoDB échouée !'));

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

app.get('/api/books', (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
});

app.get('/api/books/:id', (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
});

app.post('/api/books', (req, res, next) => {
    delete req.body._id;
    const book = new Book({ ...req.body });
    book.save()
    .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
    .catch(error => res.status(400).json({ error }));
});

module.exports = app;
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const bookRoutes = require('./routes/Book');
const userRoutes = require('./routes/User');

const app = express(); // On crée l'application Express
// Connexion à la base de donnèes MongoDB via mongoose
mongoose.connect('mongodb+srv://ViniPoy:Devastator1990!@cluster0.wryjhkn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    {useNewUrlParser: true,
    useUnifiedTopology: true})
    .then(() => console.log('Connexion à mongoDB réussie !'))
    .catch(() => console.log('Connexion à mongoDB échouée !'));

app.use(express.json()); // Middleware pour parser automatiquement les requêtes JSON entrantes
// Middleware pour gérer le CORS (Cross Origin Resource Sharing)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Autorise tout lees domaines à acceder a l'API
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'); // Autorise ces headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS'); // Autorise ces méthodes http
    next();
  });

app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images'))); // Middleware pour servir les images statiques du dossier images

module.exports = app;
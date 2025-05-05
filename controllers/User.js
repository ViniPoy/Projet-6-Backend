const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10) // On récupère le mdp et on le hash avec un 'salt' de 10 tours
        .then(hash => { 
            const user = new User({  // Puis on créé un utilisateur avec un hash du mdp 
                email: req.body.email,
                password: hash
            });
            user.save() // Et on l'enregistre
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));
};

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email }) // On cherche un utilisateur via son mail
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: 'Paire identifiant/mot de passe incorrecte.' }); // S'il n'éxiste pas on envoie une erreur 401
            } else {
                bcrypt.compare(req.body.password, user.password) // Sinon on compare son mdp avec celui enregistré
                    .then(valid => {
                        if (!valid) {
                            return res.status(401).json({ message: 'Paire identifiant/mot de passe incorrecte.' }); // Si ce n'est pas le bon mdp, erreur
                        } else {
                            res.status(200).json({ // Si c'est le bon mdp, on envoie une réponse contenat le userId et un token valable 24h ici
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id },
                                    'RANDOM_TOKEN_SECRET',
                                    { expiresIn: '24h' }
                                )
                            });
                        }
                    })
                    .catch(error => res.status(500).json({ error }));
            }
        })
        .catch(error => res.status(500).json({ error }));
};
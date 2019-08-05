const { Router } = require('express');
const { body } = require('express-validator/check');

const User = require('../models/user');
const { login, profile, signup, editProfile, joinCommunity, quitCommunity, editPassword, getSignup, sendMessage } = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

const router = Router();

router.get('/signup', getSignup);
router.put('/signup', [
    body('email')
        .isEmail()
        .withMessage('Veuillez entrer une adresse mail valide.')
        .custom((email, { req }) => {
            return User.findOne({ email })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('Cette adresse mail est déjà utilisée !');
                    }
                });
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .withMessage('Le mot de passe doit posséder au moins 8 caractères.')
        .isLength({ min: 8 }),
    body('password_confirmation')
        .trim()
        .withMessage('Le mot de passe confirmé doit posséder au moins 8 caractères.')
        .isLength({ min: 8 }),
    body('name')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Le nom complet doit posséder au moins 5 caractères.')
        .isLength({ min: 5 })
], signup);

router.post('/login', [
    body('email')
        .isEmail()
        .withMessage('Veuillez entrer une adresse mail valide.')
        .normalizeEmail(),
    body('password')
        .trim()
        .withMessage('Le mot de passe doit posséder au moins 8 caractères.')
        .isLength({ min: 8 })
], login);

router.get('/profile', isAuth, profile);
router.post('/profile', isAuth, [
    body('email')
        .isEmail()
        .withMessage('Veuillez entrer une adresse mail valide.')
        .normalizeEmail(),
    body('name')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Le nom complet doit posséder au moins 5 caractères.')
        .isLength({ min: 5 })
], editProfile);
router.post('/profile/password', isAuth, [
    body('password')
        .trim()
        .withMessage('Le mot de passe doit posséder au moins 8 caractères.')
        .isLength({ min: 8 })
], editPassword);

router.post('/community/:userId/join', isAuth, joinCommunity);
router.post('/community/:userId/quit', isAuth, quitCommunity);

router.post('/message', isAuth, sendMessage);

module.exports = router;
const { Router } = require('express');
const { body } = require('express-validator/check');

const usersController = require('../controllers/admin/users');
const rolesController = require('../controllers/admin/roles');
const productsController = require('../controllers/admin/products');
const ordersController = require('../controllers/admin/orders');
const isAdmin = require('../middleware/is-admin');
const isSeller = require('../middleware/is-seller');
const isAuth = require('../middleware/is-auth');
const User = require('../models/user');

const router = Router();

// Admin users routes
router.get('/users', isAuth, isAdmin, usersController.index);
router.post('/users', isAuth, isAdmin, [
    body('email').isEmail().normalizeEmail()
        .withMessage('Veuillez entrer une adresse mail valide.')
        .custom((email, { req }) => {
            return User.findOne({ email })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('Cette adresse mail est déjà utilisée !');
                    }
                });
        }),
    body('password').trim().isLength({ min: 8 }).isString()
        .withMessage('Le mot de passe doit posséder au moins 8 caractères.'),
    body('name').trim().not().isEmpty().isLength({ min: 5 }).isString()
        .withMessage('Le nom complet doit posséder au moins 5 caractères.'),
    body('roleId').trim().isLength({ min: 8 }).isString()
        .withMessage('Veuillez sélectionner un rôle de la liste.')
], usersController.store);
router.get('/users/create', isAuth, isAdmin, usersController.create);
router.get('/users/:userId', isAuth, isAdmin, usersController.edit);
router.post('/users/:userId', isAuth, isAdmin, [
    body('email').isEmail().normalizeEmail()
        .withMessage('Veuillez entrer une adresse mail valide.'),
    body('name').trim().not().isEmpty().isLength({ min: 5 }).isString()
        .withMessage('Le nom complet doit posséder au moins 5 caractères.'),
    body('roleId').trim().isLength({ min: 8 }).isString()
        .withMessage('Veuillez sélectionner un rôle de la liste.')
], usersController.update);
router.delete('/users/:userId', isAuth, isAdmin, usersController.destroy);

// Admin orders routes
router.get('/orders', isAuth, isAdmin, ordersController.index);
router.delete('/orders/:orderId', isAuth, isAdmin, ordersController.destroy);

// Admin products routes
router.get('/products', isAuth, isSeller, productsController.index);
router.post('/products', isAuth, isSeller, [
    body('title').trim().isLength({ min: 3, max: 50 }).isString()
        .withMessage('Le nombre de caractères du titre doit être compris entre 3 et 50.'),
    body('description').trim().isLength({ max: 200 }).isString()
        .withMessage('Le nombre de caractères de la description doit être inférieur à 200'),
    body('price').isNumeric()
        .withMessage('Le prix doit être un nombre.'),
    body('quantity').isNumeric()
        .withMessage('La quantité doit être un nombre.'),
], productsController.store);
router.get('/products/:productId', isAuth, isSeller, productsController.edit);
router.post('/products/:productId', isAuth, isSeller, [
    body('title').trim().isLength({ min: 3, max: 50 }).isString()
        .withMessage('Le nombre de caractères du titre doit être compris entre 3 et 50.'),
    body('description').trim().isLength({ max: 200 }).isString()
        .withMessage('Le nombre de caractères de la description doit être inférieur à 200'),
    body('price').isNumeric()
        .withMessage('Le prix doit être un nombre.'),
    body('quantity').isNumeric()
        .withMessage('La quantité doit être un nombre.'),
], productsController.update);
router.delete('/products/:productId', isAuth, isSeller, productsController.destroy);

// Admin roles routes
router.get('/roles', isAuth, isAdmin, rolesController.index);
router.post('/roles', isAuth, isAdmin, [
    body('name').trim().isLength({ min: 3 }).isString()
        .withMessage('Le nom doit posséder au moins 3 caractères.')
], rolesController.store);
router.get('/roles/:roleId', isAuth, isAdmin, rolesController.edit);
router.post('/roles/:roleId', isAuth, isAdmin, [
    body('name').trim().isLength({ min: 3 }).isString()
        .withMessage('Le nom doit posséder au moins 3 caractères.')
], rolesController.update);
router.delete('/roles/:roleId', isAuth, isAdmin, rolesController.destroy);

module.exports = router;
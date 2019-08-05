const { Router } = require('express');

const {
    getProducts,
    getProduct,

    getCart,
    postAddCartItem,
    postSubtractCartItem,
    postSetCartItem,
    postDeleteCartItem,
    postClearCart,
    getMyCommunity,
    getMyCommunities,
    postMyCommunity,
    getCommunity,
    getCommunities,

    getCheckout,
    getOrders,
    getInvoice,
    postOrder
} = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');
const isSeller = require('../middleware/is-seller');

const router = Router();

// Products routes
router.get('/products', getProducts);
router.get('/products/:productId', getProduct);

// Cart routes
router.get('/cart', isAuth, getCart);
router.post('/cart-add-item', isAuth, postAddCartItem);
router.post('/cart-subtract-item', isAuth, postSubtractCartItem);
router.post('/cart-set-item', isAuth, postSetCartItem);
router.post('/cart-delete-item', isAuth, postDeleteCartItem);
router.post('/cart-clear', isAuth, postClearCart);

// Communities routes
router.get('/community', isAuth, isSeller, getMyCommunity);
router.get('/communities', isAuth, getMyCommunities);
router.post('/community', isAuth, isSeller, postMyCommunity);
router.get('/community/:userId', getCommunity);
router.get('/communities/all/', getCommunities);

// Orders routes
router.get('/checkout', isAuth, getCheckout);
router.get('/orders', isAuth, getOrders);
router.post('/order', isAuth, postOrder);
router.get('/orders/:orderId', getInvoice);

module.exports = router;
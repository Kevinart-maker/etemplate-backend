const express = require('express')
const{
    getProducts,
    getProduct,
    createProduct,
    deleteProduct,
    updateProduct,
    addReview,
    getProductReviews,
    searchProducts,
    handleCheckout,
    verifyPayment,
    addToFavourites,
    getFavourites,
    removeFromFavourites
} = require('../controllers/productController')
const { requireAuth, requireAdmin } = require('../middleware/requireAuth')
const upload = require('../middleware/uploadMiddleware')

const router = express.Router()

// public routes
// get all products
router.get('/', getProducts)

// get single product
router.get('/:slug', getProduct)

//get searched products
router.get('/search', searchProducts);


// Admin routes (e.g., for adding, updating, or deleting products)
// These routes require authentication and admin role
// Post a new product
router.post('/',requireAuth, requireAdmin , upload.array('images', 10), createProduct)

// delete a product
router.delete('/:id',requireAuth, requireAdmin , deleteProduct)

// update a product
router.patch('/:id',requireAuth, requireAdmin , upload.array('images', 10), updateProduct)

// Add this new route (make sure it's protected by your auth middleware)
router.post('/:id/reviews', requireAuth, addReview);

// Get reviews for a product
router.get('/:id/reviews', getProductReviews);

// Payment routes
router.post('/checkout', requireAuth, handleCheckout);
router.get('/payment/verify', requireAuth, verifyPayment);

// Wishlist routes
router.post('/favourite', requireAuth, addToFavourites);
router.get('/favourite', requireAuth, getFavourites);
router.delete('/favourite/:id', requireAuth, removeFromFavourites);

module.exports = router
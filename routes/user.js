const express = require('express');
const rateLimit = require('express-rate-limit');

// Controller functions
const {
    signupUser,
    loginUser,
    getAllUsers,
    searchUsers,
    deleteUser,
    resetPassword,
    sendResetEmail,
    updateUserProfile,
    getUserStats
} = require('../controllers/userController.js');

const {
    requireAuth,
    requireAdmin,
    requireSuperAdmin
} = require('../middleware/requireAuth.js');

const upload = require('../middleware/uploadMiddleware.js');

const router = express.Router();

const signupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 signup requests per windowMs
    message: 'Too many signup attempts, please try again later',
});

// Login route
router.post('/login', loginUser);

// Signup route
router.post('/signup', signupLimiter, signupUser);

// Example protected routes
// These are routes that require the user to be authenticated

// Admin route to get all users
router.get('/', requireAuth, requireAdmin, getAllUsers); // Fetch all users

router.get('/protected', requireAuth, (_, res) => {
    res.send('This is a protected route for authenticated users.');
});

// These are routes that require the user to be an admin
router.get('/admin-only', requireAuth, requireAdmin, (_, res) => {
    res.send('This is a protected route for admin users only.');
});

// Search users
router.get('/search', requireAuth, requireAdmin, searchUsers);

// delete users
router.delete('/:id', requireAuth, requireSuperAdmin, deleteUser);

router.post('/forgot-password', sendResetEmail);
router.post('/reset-password', resetPassword);

// Update user profile route
router.patch('/profile', requireAuth, upload.single('image'), updateUserProfile);

router.get('/stats', requireAuth, requireAdmin, getUserStats);
// This route is for getting user statistics

module.exports = router;
const express = require('express');

// Controller functions
const { signupUser, loginUser, getAllUsers, searchUsers, deleteUser, resetPassword, sendResetEmail, updateUserProfile } = require('../controllers/userController');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middleware/requireAuth');
const upload = require('../middleware/uploadMiddleware')

const router = express.Router();

// Login route
router.post('/login', loginUser);

// Signup route
router.post('/signup', signupUser);

// Example protected routes
// These are routes that require the user to be authenticated

// Admin route to get all users
router.get('/', requireAuth, requireAdmin, getAllUsers); // Fetch all users

router.get('/protected', requireAuth, (req, res) => {
    res.send('This is a protected route for authenticated users.');
});

// These are routes that require the user to be an admin
router.get('/admin-only', requireAuth, requireAdmin, (req, res) => {
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

module.exports = router;
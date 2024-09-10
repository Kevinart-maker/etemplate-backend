const express = require('express');

// Controller functions
const { signupUser, loginUser, getAllUsers, searchUsers } = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/requireAuth');

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

module.exports = router;
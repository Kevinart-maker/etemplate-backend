const User = require('../modules/userModel')
const jwt = require('jsonwebtoken')
const { Resend } = require('resend');
require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cloudinary = require('../config/cloudinary');
const moment = require('moment');

const resend = new Resend(process.env.RESEND_API_KEY);

const createToken = (_id, role) =>{
    return jwt.sign({ _id, role }, process.env.SECRET, { expiresIn: '3d' })
}

// configure google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/user/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
    try{
        let user = await User.findOne({ googleId: profile.id });

        if(!user){
            user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                authProvider: 'google',
                role: 'user',
            });
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
})

// Google Login Route Handler 
const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });
const googleAuthCallback = passport.authenticate('google', {
    failureRedirect: '/login',
    session: false,
});

const googleAuthSuccess = async (req, res) => {
    if(!req.user){
        return res.status(400).json({ error: 'Google authentication failed' });
    }

    const token = createToken(req.user._id, req.user.role);
    res.redirect(`htttps://yourfrontend.com/auth-success?token=${token}`);
}

// login user 
const loginUser = async (req, res) => {

    const { email, password } = req.body

    try{
        const user = await User.login(email, password)

        // create a token 
        const token = createToken(user._id, user.role)

        res.status(200).json({ email, token, role: user.role })
    } catch(error){
        res.status(400).json({ error: error.message })
    }
    
}

// signup user
const signupUser = async (req, res) => {
    const { email, password, role, name } = req.body

    try{
        const user = await User.signup(email, password, role, name)

        // create a token 
        const token = createToken(user._id, user.role)

        console.log('New user signed up:', { name, email, role }); // Log the user info

        res.status(200).json({ name, email, token, role })
    } catch(error){
        res.status(400).json({ error: error.message })
    }
}

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Search Users
const searchUsers = async (req, res) => {
    const { query } = req.query;

    try {
        const users = await User.find({
            $or: [
                { email: { $regex: query, $options: 'i' } },
                { role: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } } // Added search by name
            ]
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search users' });
    }
}

// Delete user
const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await User.findByIdAndDelete(id);
        
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
}


// Send Password Reset Email
const sendResetEmail = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const resetToken = user.generateResetToken();
        await user.save();

        const resetLink = `https://clabed.vercel.app/reset-password/${resetToken}`;

        // Send email with Resend
        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'Password Reset',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link is valid for 30 minutes.</p>`,
        });

        res.json({ message: 'Password reset email sent!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send reset email' });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.resetPassword(token, newPassword);
        res.json({ message: 'Password reset successful!' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
    const { name } = req.body;
    const userId = req.user._id; // Assuming `requireAuth` middleware adds `req.user`

    let imageUrl;

    // Handle image upload if a file is provided
    if (req.file) {
        try {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;

            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'users',
                format: 'webp',
                transformation: [
                    { width: 400, height: 400, crop: 'limit' },
                    { quality: 'auto' },
                ],
            });

            imageUrl = result.secure_url;
        } catch (error) {
            return res.status(400).json({ error: 'Error uploading image' });
        }
    }

    try {
        // Update the user's profile
        const updates = {};
        if (name) updates.name = name;
        if (imageUrl) updates.image = imageUrl;

        const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getUserStats = async (req, res) => {
    try {
      const today = moment().startOf('day');
      const yesterday = moment().subtract(1, 'day').startOf('day');
  
      const todayCount = await User.countDocuments({
        createdAt: { $gte: today.toDate() }
      });
  
      const yesterdayCount = await User.countDocuments({
        createdAt: {
          $gte: yesterday.toDate(),
          $lt: today.toDate()
        }
      });
  
      const total = await User.countDocuments();
  
      const percentageChange = yesterdayCount === 0
        ? 100
        : ((todayCount - yesterdayCount) / yesterdayCount) * 100;
  
      res.json({
        total,
        today: todayCount,
        yesterday: yesterdayCount,
        percentageChange: Number(percentageChange.toFixed(1))
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

module.exports = { 
    signupUser, loginUser, getAllUsers, searchUsers, deleteUser, sendResetEmail, resetPassword, updateUserProfile, googleAuth, googleAuthCallback, googleAuthSuccess, getUserStats
}
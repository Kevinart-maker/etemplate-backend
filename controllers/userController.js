const User = require('../modules/userModel')
const jwt = require('jsonwebtoken')

const createToken = (_id, role) =>{
    return jwt.sign({ _id, role }, process.env.SECRET, { expiresIn: '3d' })
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
    const { email, password, role } = req.body

    try{
        const user = await User.signup(email, password, role)

        // create a token 
        const token = createToken(user._id)

        console.log('New user signed up:', { email, role }); // Log the user info

        res.status(200).json({ email, token, role })
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
                { role: { $regex: query, $options: 'i' } }
            ]
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search users' });
    }
}


module.exports = { signupUser, loginUser, getAllUsers, searchUsers }
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')
const crypto = require('crypto'); 

const Schema = mongoose.Schema

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String, // Optional for Google users
  },
  googleId: {
    type: String, // Stores Google account ID
    unique: true,
    sparse: true, // Allows multiple null values
  },
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    required: true,
    default: 'email',
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user',
  },
  image: {
    type: String, // URL to the user's profile image
    default: null, // Default image URL
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Static signup method
userSchema.statics.signup = async function (email, password, role, name) {
    
    // Validation
    if (!email || !password || !role || !name) {
      throw Error('All fields must be filled');
    }
    if (!validator.isEmail(email)) {
      throw Error('Email is not valid');
    }
    if (!validator.isStrongPassword(password)) {
      throw Error('Password is not strong enough');
    }
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      throw Error('Role is not valid');
    }
  
    const exists = await this.findOne({ email });
  
    if (exists) {
      throw Error('Email already exists');
    }
  
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
  
    const user = await this.create({ email, password: hash, role, name, authProvider: 'email' });
  
    return user;
  };

// static login method
userSchema.statics.login = async function(email, password){
    
    if(!email || !password){
        throw Error('All fields must be filled')
    }

    const user = await this.findOne({ email })

    if(!user){
        throw Error('Incorrect Email')
    }
    
    const match = await bcrypt.compare(password, user.password)

    if(!match){
        throw Error('Incorrect Passsword')
    }

    return user
    
}


// Generate Reset Token
userSchema.methods.generateResetToken = function () {
  this.resetToken = crypto.randomBytes(32).toString('hex');
  this.resetTokenExpiry = Date.now() + 1000 * 60 * 30; // Token expires in 30 mins
  return this.resetToken;
};

// Reset Password
userSchema.statics.resetPassword = async function (token, newPassword) {
  const user = await this.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }, // Ensure the token is still valid
  });

  if (!user) {
      throw Error('Invalid or expired token');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return user;
};

module.exports = mongoose.model('Template Users', userSchema)
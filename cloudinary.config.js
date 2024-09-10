const cloudinary = require('cloudinary').v2

cloudinary.config({
    cloud_name : 'dmg9is6s2',
    api_key : '248292737665128',
    api_secret : 'zZ9RdWRLpEcb0ry2mjIvtEE71h8'
})

module.exports = cloudinary;
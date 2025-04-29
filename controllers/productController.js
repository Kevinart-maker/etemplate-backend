const mongoose = require('mongoose')
const Products = require('../modules/productModel')
const User = require('../modules/userModel')
const cloudinary = require('../config/cloudinary')
const axios = require('axios');

// get all products
const getProducts = async (req, res) => {
    const { category, brand, price } = req.query;

    let filter = {};

    if (category) {
        filter.category = category;
    }
    if (brand) {
        filter.brand = brand;
    }
    if (price) {
        filter.price = { $lte: price };
    }

    try {
        const products = await Products.find(filter).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// get a single product by slug
const getProduct = async (req, res) => {
    const { slug } = req.params;

    try {
        const product = await Products.findOne({ slug });

        if (!product) {
            return res.status(404).json({ error: 'Product not found!' });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};


// create a new product
const createProduct = async (req, res) => {
    const { name, description, price, category, brand, stock } = req.body;
    
    let imageUrls = [];

    // Handle image uploads
    if (req.files && req.files.length > 0) {
        try {
            // Upload each image to Cloudinary
            const uploadPromises = req.files.map(async (file) => {
                const b64 = Buffer.from(file.buffer).toString('base64');
                const dataURI = `data:${file.mimetype};base64,${b64}`;
                
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'products',
                    format: 'webp',
                    transformation: [
                        { width: 1200, height: 800, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                });
                return result.secure_url;
            });

            imageUrls = await Promise.all(uploadPromises);
        } catch (error) {
            return res.status(400).json({ error: 'Error uploading images' });
        }
    }

    let emptyFields = []

    if(!name) {
        emptyFields.push('name')
    }
    if(!description) {
        emptyFields.push('description')
    }
    if(!price) {
        emptyFields.push('price')
    }
    if(!category) {
        emptyFields.push('category')
    }
    if(!brand) {
        emptyFields.push('brand')
    }
    if(!stock) {
        emptyFields.push('stock')
    }
    if(imageUrls.length === 0) {
        emptyFields.push('images')
    }

    if(emptyFields.length > 0) {
        return res.status(400).json({error: "Please fill in all the fields", emptyFields})
    }

    // add doc to db
    try {
        const product = await Products.create({ 
            name,
            description,
            price,
            category,
            brand,
            stock,
            images: imageUrls
        })
        res.status(200).json(product)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

// delete a product
const deleteProduct = async (req, res)=>{
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: "No such product"})
    }

    const product = await Products.findOneAndDelete({_id: id})

    if(!product){
        return res.status(400).json({error: 'Product not found!'})
    }

    res.status(200).json(product)
}

// update a product
const updateProduct = async (req, res) => {
    const { id } = req.params;

    // Validate the product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "No such product" });
    }

    let updates = { ...req.body };
    let imageUrls = [];

    // Handle image uploads if new images are provided
    if (req.files && req.files.length > 0) {
        try {
            const uploadPromises = req.files.map(async (file) => {
                const b64 = Buffer.from(file.buffer).toString('base64');
                const dataURI = `data:${file.mimetype};base64,${b64}`;

                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'products',
                    format: 'webp',
                    transformation: [
                        { width: 1200, height: 800, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                });
                return result.secure_url;
            });

            imageUrls = await Promise.all(uploadPromises);
            updates.images = imageUrls; // Add the new image URLs to the updates
        } catch (error) {
            return res.status(400).json({ error: 'Error uploading images' });
        }
    }

    // Prevent updating restricted fields
    delete updates._id;
    delete updates.reviews;

    try {
        // Update the product in the database
        const product = await Products.findOneAndUpdate(
            { _id: id },
            updates,
            { new: true, runValidators: true } // Ensure validation is applied
        );

        if (!product) {
            return res.status(404).json({ error: "Product not found!" });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// add review and rating
const addReview = async (req, res) => {
    const { id } = req.params;
    const { comment, rating } = req.body;
    const user = req.user._id; // Assuming you have user info from auth middleware

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "No such product" });
    }

    // Validate rating
    if (rating < 0 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 0 and 5" });
    }

    try {
        // Check if user has already reviewed this product
        const product = await Products.findById(id);
        const existingReview = product.reviews.find(
            review => review.user.toString() === user.toString()
        );

        if (existingReview) {
            return res.status(400).json({ error: "You have already reviewed this product" });
        }

        // Add the new review
        const updatedProduct = await Products.findByIdAndUpdate(
            id,
            {
                $push: { reviews: { user, comment, rating } },
                $set: {
                    rating: (
                        (product.rating * product.reviews.length + rating) / 
                        (product.reviews.length + 1)
                    ).toFixed(1)
                }
            },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found!' });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// get reviews for a product
const getProductReviews = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "No such product" });
    }

    try {
        const product = await Products.findById(id)
            .populate({
                path: 'reviews.user',
                select: 'name email' // Only get user's name and email
            });

        if (!product) {
            return res.status(404).json({ error: 'Product not found!' });
        }

        res.status(200).json(product.reviews);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Search products
const searchProducts = async (req, res) => {
    try {
        const { query } = req.query; // Get the search query from the request

        console.log('Search query:', query);

        if (!query) {
            const products = await Products.find({});
            console.log('Found all products:', products);
            return res.status(200).json(products);
        }

        // Perform a case-insensitive search on name, category, and brand fields
        const products = await Products.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } },
                { brand: { $regex: query, $options: 'i' } }
            ]
        });

        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found!' });
        }

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Handle cart items and create Paystack payment
const handleCheckout = async (req, res) => {
    const { cartItems, totalAmount } = req.body;
    const user = req.user;

    try {
        // Create a payment reference
        const reference = `paystack_${Date.now()}`;

        // Initialize Paystack payment
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: user.email,
                amount: totalAmount * 100, // Convert to kobo
                reference,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        // Save payment details in the database
        await Products.updateMany(
            { _id: { $in: cartItems } },
            {
                $push: {
                    payments: {
                        user: user._id,
                        amount: totalAmount,
                        reference,
                    },
                },
            }
        );

        res.status(200).json({ paymentUrl: response.data.data.authorization_url });
    } catch (error) {
        console.error('Paystack error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to initialize payment', details: error.response ? error.response.data : error.message });
    }
    
};

// Verify if payment was successful
const verifyPayment = async (req, res) => {
    const { reference } = req.query;

    try {
        // Verify payment with Paystack
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const paymentStatus = response.data.data.status;

        // Update payment status in the database
        await Products.updateMany(
            { 'payments.reference': reference },
            { $set: { 'payments.$.status': paymentStatus } }
        );

        res.status(200).json({ status: paymentStatus });
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify payment' });
    }
};

// Add an item to the user's wishlist
const addToFavourites = async (req, res) => {
    const { productId } = req.body;
    const user = req.user;

    try {
        const product = await Products.findByIdAndUpdate(
            productId,
            { $addToSet: { favourites: { user: user._id } } },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Added to favourites', product });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add to favourites' });
    }
};

// Get all items in the user's wishlist
const getFavourites = async (req, res) => {
    const user = req.user;

    try {
        const products = await Products.find({ 'favourites.user': user._id });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch favourites' });
    }
};

// Remove an item from the user's wishlist
const removeFromFavourites = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    try {
        const product = await Products.findByIdAndUpdate(
            id,
            { $pull: { favourites: { user: user._id } } },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Removed from favourites', product });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove from favourites' });
    }
};

module.exports = {
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
}
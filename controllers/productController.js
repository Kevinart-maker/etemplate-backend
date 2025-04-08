const mongoose = require('mongoose')
const Products = require('../modules/productModel')
const cloudinary = require('../config/cloudinary')

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

// get a single product
const getProduct = async (req, res)=>{
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: "No such product"})
    }

    const product = await Products.findById(id)

    if(!product){
        return res.status(404).json({error: 'Product not found!'})
    }

    res.status(200).json(product)
}

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
const updateProduct = async (req, res)=>{
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: "No such product"})
    }

    const product = await Products.findOneAndUpdate(
        {_id: id}, 
        { ...req.body },
        { new: true }
    )
    if(!product){
        return res.status(400).json({error: 'Product not found!'})
    }

    res.status(200).json(product)
}

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

        if (!query) {
            return res.status(400).json({ error: 'Search query is required!' });
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

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    deleteProduct,
    updateProduct,
    addReview,
    getProductReviews,
    searchProducts
}
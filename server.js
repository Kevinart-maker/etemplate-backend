require('dotenv').config();
const Products = require('./modules/productModel')


const passport = require('passport');

const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
const cors = require('cors');
const userRoutes = require('./routes/user')

// Express app
const app = express();

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


app.use((req, res, next) => {
    // console.log(req.path, req.method);
    console.log(`${req.method} request for '${req.url}'`);
    next();
});

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

// Routes
app.use('/api/products/', productRoutes);
app.use('/api/product/search', searchProducts);
app.use('/api/user', userRoutes);

// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Connected to db & listening on port ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log(error);
    });
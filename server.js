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

const allowedOrigins = [
    'https://clabed.vercel.app',
    'https://clabed-frontend.vercel.app',
    'http://localhost:5173',
    'https://www.clabedautos.com'
];

const corsOptions = {
    origin: (origin, callback) => {
        console.log("Incoming request from:", origin); // Log request origins
        
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);  // Allow request
        } else {
            console.error(`Blocked CORS request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));  // Reject request
        }
    },
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

// search vehicles
const searchVehicles = async (req, res) => {
    const { query } = req.query;
    console.log("Searched query: ", query)
    try {
        if (!query) {
            // If the query is empty, return all vehicles
            const vehicles = await Vehicles.find({});
            console.log('Found all vehicles:', vehicles);
            return res.status(200).json(vehicles);
        }
        
        
        const numericFields = ['year', 'mileage'];
        const queryConditions = [];

        // Construct query conditions based on the query
        if (query) {
            const numericQuery = Number(query);
            if (!isNaN(numericQuery)) {
                // Handle numeric fields
                numericFields.forEach(field => {
                    queryConditions.push({ [field]: numericQuery });
                });
            }
            // Handle string fields
            const stringFields = [
                'make', 'model', 'condition', 'available', 'engineType', 
                'transmission', 'fuelType', 'exteriorColor', 'interiorColor', 
                'interiorMaterial', 'location'
            ];
            stringFields.forEach(field => {
                queryConditions.push({ [field]: { $regex: query, $options: 'i' } });
            });
        }

        const vehicles = await Vehicles.find({
            $or: queryConditions
        });
        console.log('Found vehicles:', vehicles);
        res.status(200).json(vehicles);
    } catch (error) {
        console.error('Error searching vehicles:', error);
        res.status(500).json({ error: 'Failed to search vehicles' });
    }
};

// Routes
app.use('/api/products/', productRoutes);
app.use('/api/vehicle/search', searchVehicles);
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
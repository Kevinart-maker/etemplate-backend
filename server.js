require('dotenv').config();
const Vehicles = require('./modules/productModel')


const express = require('express');
const mongoose = require('mongoose');
const vehicleRoutes = require('./routes/vehicleRoutes');
const cors = require('cors');
const userRoutes = require('./routes/user')

// Express app
const app = express();

const corsOptions = {
    origin: 'https://clabed.vercel.app/',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
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

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://clabed.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);  // Respond OK to preflight
    }
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
app.use('/api/vehicles/', vehicleRoutes);
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

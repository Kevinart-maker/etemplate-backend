const express = require('express')
const{
    getVehicles,
    getVehicle,
    createVehicle,
    deleteVehicle,
    updateVehicle
} = require('../controllers/vehicleController')
const { requireAuth, requireAdmin } = require('../middleware/requireAuth')

const router = express.Router()

// public routes
// get all vehicles
router.get('/', getVehicles)


// Admin routes (e.g., for adding, updating, or deleting vehicles)
// These routes require authentication and admin role
// get single vehicle
router.get('/:id', getVehicle)

// Post a new vehicle
router.post('/',requireAuth , createVehicle)

// delete a vehicle
router.delete('/:id',requireAuth , deleteVehicle)

// update a vehicle
router.patch('/:id',requireAuth , updateVehicle)

module.exports = router
const express = require('express');
const {updateUserData, getAccount, getOverview, getTour, login, getMyTours} = require('../controllers/viewsController');
const {isLoggedIn, protect} = require('../controllers/authController');
const {createBookingCheckout} = require('../controllers/bookingController');

const router = express.Router();



router.get('/', createBookingCheckout, isLoggedIn, getOverview);
router.get('/tours/:slug',isLoggedIn, getTour);
router.get('/login',isLoggedIn, login);
router.get('/me',protect, getAccount);
router.get('/my-tours',protect, getMyTours);

router.post('/submit-user-data', protect, updateUserData);

module.exports = router;
const express = require('express');
const { getCheckoutSession, getAllBookings, getBooking, createBooking, updateBooking, deleteBooking } = require('./../controllers/bookingController');
const {protect, restrictTo} = require('./../controllers/authController');

const router = express.Router();

router.get('/checkout-session/:tourId', protect, getCheckoutSession)

router.use(restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(getAllBookings)
  .post(createBooking);

router
  .route('/:id')
  .get(getBooking)
  .patch(updateBooking)
  .delete(deleteBooking);

module.exports = router
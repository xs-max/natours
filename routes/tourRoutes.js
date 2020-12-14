const express = require('express');
const {uploadTourImages, resizeTourImages ,getDistances, getToursWithin, getMonthlyPlan, getTourStats, aliasTopTOurs, getAllTours, getTour, addTour, patchTour, deleteTour, checkId, checkBody} = require('./../controllers/tourController');
const {protect, restrictTo} = require('./../controllers/authController');
const reviewRouter = require('./reviewRoute');

const router = express.Router();

// router.route('/:tourId/reviews').post(protect, restrictTo('user'), createReview);

router.use('/:tourId/reviews', reviewRouter);

//param middleware
// router.param('id', checkId);
router.route('/top-5-cheap').get(aliasTopTOurs, getAllTours);
router.route('/monthly-plan/:year').get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router.route('/tour-Stats').get(getTourStats);

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(getDistances);

router.route('/')
    .get(getAllTours)
    .post(protect,restrictTo('admin', 'lead-guide'), addTour);

router.route('/:id')
    .get(getTour)
    .patch(protect, restrictTo('admin', 'lead-guide'),uploadTourImages, resizeTourImages, patchTour)
    .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);



module.exports = router;


const Review = require('./../models/reviewModel');
const catchAsync = require('../utils/cactchAsync');
const AppError  = require('../utils/appError');
const factory = require('./handlerFactory');

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//     let filter = {};
//     if(req.params.tourId) filter = {tour: req.params.tourId};
//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: 'success',
//         results: reviews.length,
//         data: {
//             reviews
//         }
//     });
// });

exports.getAllReviews = factory.getAll(Review);

exports.setTourUserId = (req, res, next) => {
     // Allow nested route
     if (!req.body.tour) req.body.tour = req.params.tourId;
     if (!req.body.user) req.body.user = req.user.id;
     next();
}



// exports.createReview = catchAsync(async (req, res, next) => {
   

//     const newReview = await Review.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             review: newReview
//         }
//     });
// });

exports.getReview = factory.getOne(Review); 

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
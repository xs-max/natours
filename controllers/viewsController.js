const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/cactchAsync');

exports.getOverview = catchAsync( async (req, res, next) => {
    // 1) Get tour data from collection
    const tours = await Tour.find();

    // 2) Build template

    // 3) buildtemplate using data from step 1

    res.status(200).set("Content-Security-Policy", "script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.0/axios.min.js https://js.stripe.com/v3/").render('overview', {
        title: 'All tours',
        tours
    });
});

exports.getTour = catchAsync( async(req, res, next) => {
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if(!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }

    res.status(200).set("Content-Security-Policy", "script-src  'self'  https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.js https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.0/axios.min.js https://js.stripe.com/v3/; worker-src blob: ;").render('tour', {
        title: tour.name,
        tour
    });
});

exports.login = (req, res) => {
    res.status(200).set("Content-Security-Policy", "script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.0/axios.min.js https://js.stripe.com/v3/").render('login', {
        title: 'Log into your account'
    });

}

exports.getAccount = (req, res) => {
    res.status(200).set("Content-Security-Policy", "script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.0/axios.min.js https://js.stripe.com/v3/").render('account', {
        title: 'Your account'
    });
}

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    },
    {
        new: true,
        runValidators: true
    }
    );

    res.status(200).set("Content-Security-Policy", "script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.0/axios.min.js https://js.stripe.com/v3/").render('account', {
        title: 'Your account',
        user: updatedUser
    });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
    // 1) Find all booking 
    const bookings = await Booking.find({user: req.user.id});

    // 2) Find tours with the returned IDs
    const tourIds = bookings.map(el => el.tour );
    const tours = await Tour.find({_id: {$in: tourIds }});

    res.status(200).set("Content-Security-Policy", "script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.0/axios.min.js https://js.stripe.com/v3/").render('overview', {
        title: 'My Tours',
        tours
    });
})
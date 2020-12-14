const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const ApiFeatures = require('./../utils/apiFeatures');
const catchAsync = require('../utils/cactchAsync');
const AppError  = require('../utils/appError');
const factory = require('./handlerFactory');




const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an Image ! please upload only images', 404), false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {

    if (!req.files.imageCover || !req.files.images) return next();

    // Cover Image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

    // Images
    await Promise.all(req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
        await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
    }));

    next();
});

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// exports.checkId = (req, res, next ,val) => {
//     if (+val > tours.length) {
//         return res.status(404).json({
//             status: 'failed',
//             message: 'invalid id'
//         })
//     }
//     next();
// }

// exports.checkBody = (req, res, next) => {
//     if(!req.body.name || !req.body.price) {
//         return res.status(404).json({
//             status: 'failed',
//             message:'body missing name or price'
//         });
//     }

//     next();
// }

// Route handlers
exports.aliasTopTOurs = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}


// exports.getAllTours = catchAsync(async (req, res, next) => {
//     console.log(req.query);
//         // Execute query
//         const features = new ApiFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();
//         const tours = await features.query;  

//         //Send Response
//         res.status(200).json({
//             status: 'success',
//             results: tours.length,
//             data: {
//                 tours: tours
//             }
//         })
//     // try{
        
//     // }catch (err) {
//     //     res.status(404).json({
//     //         status: 'failed',
//     //         message: err.message
//     //     })
//     // }
    
// });

exports.getAllTours = factory.getAll(Tour);


// exports.getTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findById(req.params.id).populate('reviews');
//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//     }
//         res.status(200).json({
//             status: 'success',
//             data: {
//                 tour: tour
//             }
//         })
//     // try {
        
//     // }catch (err) {
//     //     res.status(404).json({
//     //         status: 'failed',
//     //         message: 'Ivalid ID'
//     //     })
//     // }
    
// });

exports.getTour = factory.getOne(Tour, {path: 'reviews'});



// exports.addTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body);

//         res.status(201).json({
//             status: 'success',
//             data: {
//                 tour : newTour
//             }
//         });
//     // try{
        
//     // }catch (err) {
//     //     res.status(404).json({
//     //         status: 'failed',
//     //         message: 'Invalid Data sent'
//     //     })
//     // }
   
// });

exports.addTour = factory.createOne(Tour);

// exports.patchTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true
//     });
//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//     }
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour: tour
//         }
//     }) 
//     // try{
        
//     // }catch (err) {
//     //     res.status(400).json({
//     //         status: 'failed',
//     //         message: err
//     //     })
//     // }
    
// });

exports.patchTour = factory.updateOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//     }
//         res.status(204).json({
//             status: 'success',
//             data: null
//         })
    // try{
        
    // }catch(err){
    //     res.status(400).json({
    //         status: 'failed',
    //         message: err
    //     })
    // }
    
// });

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: {ratingsAverage: {$gte: 4.5}}
        },
        {
            $group: {
                _id: {$toUpper: '$difficulty'},
                // _id: '$ratingsAverage',
                numOfTours: {$sum: 1},
                numOfRatings: {$sum: '$ratingsQuantity'},
                averageRating: {$avg: '$ratingsAverage'},
                avgPrice: {$avg: '$price'},
                minPrice: {$min: '$price'},
                maxPrice: {$max: '$price'},
            }
        },
        {
            $sort: {avgPrice: 1}
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: stats
    });
    // try {
        
    // } catch (err) {
    //     res.status(400).json({
    //         status: 'failed',
    //         message: err
    //     });
    // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = +req.params.year;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {$month: '$startDates'},
                numOfToursStarts: {$sum: 1},
                tours: {$push : '$name'}
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0,

            }
        },
        {
            $sort: {numOfToursStarts: -1}
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: plan
    });
    // try {
        
    // } catch (err) {
    //     res.status(400).json({
    //         status: 'failed',
    //         message: err
    //     });
    // }
});


exports.getToursWithin =catchAsync( async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const {lat, lng} = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if(!lat || !lng) {
        next(new AppError('Please provide your current lattitude and longitude in the format lat,lng.', 400));
    }

    const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    });
});

exports.getDistances = catchAsync( async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const {lat, lng} = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if(!lat || !lng) {
        next(new AppError('Please provide your current lattitude and longitude in the format lat,lng.', 400));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinate: [+lng, +lat]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project : {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });
});
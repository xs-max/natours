const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('../utils/cactchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {

//         const extention = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${extention}`);
//     }
// });

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto =catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

    await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

    next();
});

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    })
    return newObj;
}

// exports.getAllUsers = catchAsync(async(req, res, next) => {
//     const users = await User.find();  

//         //Send Response
//         res.status(200).json({
//             status: 'success',
//             results: users.length,
//             data: {
//                 users: users
//             }
//         })
// });

exports.getAllUsers = factory.getAll(User);

exports.updateMe = catchAsync( async (req, res, next) => {
    // console.log(req.file);

    //1) Create Error is user post password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password update', 400));
    }

    //2 filter unwanted fields
    const filteredBody = filterObj(req.body, 'name', 'email');
    if( req.file) filteredBody.photo = req.file.filename;

    //3) update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
})

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {active: false});

    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}
exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'route not yet defined! please use sign up instead'
    })
}

// Do not update password with this
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);


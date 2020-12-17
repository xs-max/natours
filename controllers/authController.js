const crypto = require('crypto');
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/cactchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');


const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
}

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user);
    // const cookieOptions = {
    //     expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    //     httpOnly: true,
    //     secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    // }
    
    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: user
        }
    })
}

exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, req, res);
    // const token = signToken(newUser._id);


    // res.status(201).json({
    //     status: 'Success',
    //     token,
    //     data: {
    //         user: newUser
    //     }
    // })
});

exports.login = catchAsync(async(req, res, next) => {
    const {email, password} = req.body;

    // 1 check if email and password exists
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400))
    }

    //2 check if user exists and password is correct
    const user = await User.findOne({email: email}).select('+password');
    if(!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3 Send token
    createSendToken(user, 200, req, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({status: 'success'});
}

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it exists
    let token = '';
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }
        // console.log(token);
        if (!token) {
            return next(new AppError('You are not logged in, please log in to get access', 401));
        }
    // 2)Validate token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded);

    // 3) check if user still exists
    const freshUser= await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError('The user does no longer exists', 401));
    }

    // 4) check if user change password after token issue
    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed password please log in again', 401));
    }

    // Grant Access to protected route
    req.user = freshUser;
    res.locals.user = freshUser;
    // console.log(req.user);
    next();
});

// Only for rendered pages
exports.isLoggedIn = async (req, res, next) => {
    // 1) Getting token and check if it exists
    if (req.cookies.jwt) {
        try{
            // 2)Validate token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            // 3) check if user still exists
            const currentUser= await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 4) check if user change password after token issue
            if(currentUser.changedPasswordAfter(decoded.iat)){
                return next();
            }

            // There is a logged in user
            res.locals.user = currentUser
            return next();
    
        }catch (err) {
            return next();
        }
    }
        
    next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles [admin, lead-guide]. 
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403))
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async(req, res, next) => {
    // 1) Get User based on posted Email
    const user = await User.findOne({email: req.body.email})
    if (!user) {
        return next(new AppError('There is no user with that email address', 404));
    }

    //2) Generate Random Token
    const resetToken  = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    //3) Send it to user Email
    // console.log(resetUrl);
    // const message = `Forgot your password? Submit a PATCH request your new password and passwordConfirm to
    // :${resetUrl}.\nIf you didn't forget your password please ignore this email!`;
    // // console.log(message);
    try{
        // await sendEmail({
        //     email: req.body.email,
        //     subject: 'Your Password reset token (valid for 10mins)',
        //     message: message
        // });
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetUrl).sendPasswordReset();
    
        res.status(200).json({
            status: 'success',
            message: 'Token Sent to Email'
        })
    }catch(err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('There was an Error sending the email, try again later', 500));
       
    }
    
});

exports.resetPassword = catchAsync( async (req, res, next) => {
    //1) Get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}});

    //2) If token has not expired and there is a user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //3) Update changedPasswordAt property for the user

    //4) Log the user in, send JWT
    createSendToken(user, 200, req, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });
})

exports.updatePassword = catchAsync( async (req, res, next) => {
    //1) Get User from collection
    const user = await User.findById(req.user.id).select('+password');

    //2) check if posted password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong', 401));
    }

    //3) Update the password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm;
    await (await user).save();

    //4) Log user in
    createSendToken(user, 200,req, res);
});


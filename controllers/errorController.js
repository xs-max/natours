const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
    const message = `invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
}

const handleDuplicateField = (err) => {
    const value = err.keyValue.name;
    const message = `Duplicate field value ${value}... Please use another value`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input Data, ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTError = err => new AppError('Invalid Token please login again', 401);
const handleJWTExpiredError = err => new AppError('Your token has expired please login again', 401);

const sendErrorDev = (err, req, res) => {
    if(req.originalUrl.startsWith('/api')) {
        // Api
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
            // errName: err.name
        });
    }else {
        // Rendered Website
        res.status(err.statusCode).render('error', {
            title: 'Something Went Wrong',
            msg: err.message
        })
    }
    
}

const sendErrorProd = (err, req, res) => {
    if(req.originalUrl.startsWith('/api')) {
        // Api
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }else {
            console.error("Error ", err)
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong',
            });
        }
    }else {
        // Rendered Website
        if (err.isOperational) {
            console.error("Error ", err.message)
            res.status(err.statusCode).render('error', {
                title: 'Something Went Wrong',
                msg: err.message
            });
        }else {
            res.status(err.statusCode).render('error', {
                title: 'Something Went Wrong',
                msg: 'Please try again later.'
            });
        }
    }
    
}


module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if(process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    }else if (process.env.NODE_ENV === 'production') {
        let error = {...err};
        error.message = err.message;
        console.log(error)
        if (error.kind === 'ObjectId') error = handleCastErrorDB(error);
        if(error.code == 11000) error = handleDuplicateField(error);
        if (error._message === 'Validation failed') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenEror') error = handleJWTError(error);
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
        sendErrorProd(error, req, res);
    }
    
} 
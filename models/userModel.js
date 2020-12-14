const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
        maxlength: [40, 'Name must be less than 40 characters'],
        minlength: [4, 'Name must be more than 4 characters']
    },
    email: {
        type: String,
        required: [true, 'A user must have anemail'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Enter a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // Only works on save and create
            validator: function(el) {
                return this.password === el;
            },
            message: 'Passwords don\'t match'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    }

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre('save', async function(next) {
    // Only run this function if password was modified
    if(!this.isModified('password')) return next();
    //Hash password
    this.password = await bcrypt.hash(this.password, 12)
    // delete passwordConfirm
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre(/^find/, function(next) {
    // this points to the current query
    this.find({active: {$ne: false}});
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000, 10);
        // console.log(this.passwordChangedAt, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }

    // False means not changed
    return false;
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    // console.log({resetToken}, this.passwordResetToken);
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model('User', userSchema);


module.exports = User;
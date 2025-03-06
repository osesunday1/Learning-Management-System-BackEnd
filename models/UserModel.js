// Importing necessary modules
import crypto from 'crypto'; // Used for generating secure random tokens
import mongoose from 'mongoose'; // ODM (Object Data Modeling) library for MongoDB
import validator from 'validator'; // Library for validating input data (e.g., email validation)
import bcrypt from 'bcrypt'; // Used for hashing passwords


// Define the User schema with Mongoose
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please insert your name'] // Name is required
    },

    email: {
        type: String,
        required: [true, 'please provide your email'], // Email is required
        unique: true, // Ensures emails are unique in the database
        lowercase: true, // Converts email to lowercase before saving
        validate: [validator.isEmail, 'please provide a valid email'] // Uses validator library to check if email is valid
    },

    photo: String, // Optional field for storing user profile photo URL

    role: {
        type: String,
        enum: ['student', 'educator', 'admin'], // Defines possible user roles
        default: 'student' // Default role is 'student'
    },

    password: {
        type: String,
        required: [true, 'Please provide password'], // Password is required
        minlength: 3, // Password must have at least 4 characters
        select: false // Ensures password is not returned in queries by default
    },
    
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'], // Password confirmation is required
        validate: {
            // Custom validation to check if passwordConfirm matches password
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!' // Error message if passwords do not match
        }
    },

    passwordChangedAt: Date, // Stores timestamp when password was last changed
    passwordResetToken: String, // Stores hashed reset token for password recovery
    passwordResetExpires: Date, // Stores expiration time of reset token

    active: {
        type: Boolean,
        default: true, // By default, users are active
        select: false // This field is hidden from query results
    }
});

// Mongoose pre-save middleware for hashing password before saving to the database
userSchema.pre('save', async function(next) {
    // Only run if password is modified
    if (!this.isModified('password')) return next();

    // Hash the password using bcrypt with a cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete the passwordConfirm field to ensure it's not stored in the database
    this.passwordConfirm = undefined;

    // Set passwordChangedAt to one second earlier to prevent JWT issues
    this.passwordChangedAt = Date.now() - 1000;

    next();
});

// Mongoose pre-save middleware to set passwordChangedAt field
userSchema.pre('save', function(next) {
    // If the password is not modified or it's a new user, do nothing
    if (!this.isModified('password') || this.isNew) return next();

    // Update passwordChangedAt field
    this.passwordChangedAt = Date.now() - 1000;
    
    next();
});

// Mongoose pre-query middleware to filter out inactive users
userSchema.pre(/^find/, function(next) {
    // 'this' refers to the current query
    this.find({ active: { $ne: false } }); // Ensures only active users are fetched

    next();
});

// Method to compare entered password with the stored hashed password (Used in login)
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Method to check if the password was changed after issuing a JWT token
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp; // Returns true if password was changed after JWT timestamp
    }

    return false; // Password has not been changed
};

// Method to generate a password reset token
userSchema.methods.createPasswordResetToken = function() {
    // Generate a random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the reset token before storing it in the database
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set token expiration time (20 minutes from now)
    this.passwordResetExpires = Date.now() + 20 * 60 * 1000;

    return resetToken; // Return plain reset token (hashed version is stored)
};

// Create and export the User model
const User = mongoose.model('User', userSchema);

export default User;
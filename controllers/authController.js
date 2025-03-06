import jwt from 'jsonwebtoken'; // Import JWT for authentication
import { promisify } from 'util'; // Converts callback-based functions to Promise-based
import crypto from 'crypto'; // Used for generating secure random tokens
import UserModel from '../models/UserModel.js'; // Import User model
import HttpError from '../utils/httpError.js'; // Custom error handling class
// ============================
// 🔹 Generate JWT Token
// ============================
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN // Token expiration from .env
    });
};

// ============================
// 🔹 Send JWT Token in Response
// ============================
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id); // Generate JWT token with user ID

    res.status(statusCode).json({
        status: 'success',
        token, // Send token to the client
        data: { user }
    });
};

// ============================
// 🔹 User Signup (Register)
// ============================
export const signup = async (req, res, next) => {
    try {
        // 1) Create a new user in the database
        const newUser = await UserModel.create({
            name: req.body.name,
            email: req.body.email,
            role: req.body.role || 'student', // Default role is 'student'
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm
        });

        // 2) Send JWT token in response
        createSendToken(newUser, 201, res);
    } catch (err) {
        return next(new HttpError(`Signup failed: ${err.message}`, 500));
    }
};

// ============================
// 🔹 User Login
// ============================
export const login = async (req, res, next) => {
    const { email, password, role } = req.body;

    // 1) Ensure email and password are provided
    if (!email || !password) {
        return next(new HttpError('Please provide email and password', 400));
    }

    try {
        // 2) Find user by email and retrieve password (since it's not selected by default)
        const user = await UserModel.findOne({ email }).select('+password');

        // 3) Check if user exists and password is correct
        if (!user || !(await user.correctPassword(password, user.password))) {
            return next(new HttpError('Incorrect email or password', 401));
        }

        // 4) Send JWT token if authentication is successful
        createSendToken(user, 200, res);
    } catch (err) {
        return next(new HttpError(`Login failed: ${err.message}`, 500));
    }
};

// ============================
// 🔹 Protect Routes (Require Authentication)
// ============================
export const protect = async (req, res, next) => {
    let token;

    // 1) Extract JWT token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; // Extract token after 'Bearer'
    }

    if (!token) {
        return next(new HttpError('You are not logged in. Please login to access this resource', 401));
    }

    try {
        // 2) Verify token and decode payload
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // 3) Check if the user still exists
        const freshUser = await UserModel.findById(decoded.id);
        if (!freshUser) {
            return next(new HttpError('User does not exist', 401));
        }

        // 4) Ensure user hasn't changed password after token was issued
        if (freshUser.changedPasswordAfter(decoded.iat)) {
            return next(new HttpError('User recently changed password. Please log in again.', 401));
        }

        // 5) Grant access to protected route
        req.user = freshUser; // Attach user to request
        next();
    } catch (err) {
        return next(new HttpError(`Authentication failed: ${err.message}`, 500));
    }
};

// ============================
// 🔹 Role-Based Access Control
// ============================
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // Check if user has the required role
        if (!roles.includes(req.user.role)) {
            return next(new HttpError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

// ============================
// 🔹 Forgot Password (Send Reset Token)
// ============================
export const forgotPassword = async (req, res, next) => {
    try {
        // 1) Find user by email
        const user = await UserModel.findOne({ email: req.body.email });
        if (!user) {
            return next(new HttpError('No user found with this email address', 404));
        }

        // 2) Generate password reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // 3) Send email with reset token
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        const message = `Click the following link to reset your password: ${resetURL}`;

        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token (valid for 10 min)',
            message
        });

        res.status(200).json({ status: 'success', message: 'Token sent to email' });
    } catch (err) {
        return next(new HttpError(`Error sending password reset token: ${err.message}`, 500));
    }
};

// ============================
// 🔹 Reset Password
// ============================
export const resetPassword = async (req, res, next) => {
    try {
        // 1) Hash the reset token to find matching user
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        // 2) Find user by hashed token and check if token is still valid
        const user = await UserModel.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return next(new HttpError('Token is invalid or has expired', 400));
        }

        // 3) Set new password and clear reset token fields
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // 4) Send new token to log user in
        createSendToken(user, 200, res);
    } catch (err) {
        return next(new HttpError('Error resetting password', 500));
    }
};

// ============================
// 🔹 Update Password
// ============================
export const updatePassword = async (req, res, next) => {
    try {
        // 1) Get user and include password field
        const user = await UserModel.findById(req.user.id).select('+password');

        // 2) Verify current password
        if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
            return next(new HttpError('Your current password is incorrect', 401));
        }

        // 3) Update password
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        await user.save();

        // 4) Send new token after updating password
        createSendToken(user, 200, res);
    } catch (err) {
        return next(new HttpError(`Error updating password: ${err.message}`, 500));
    }
};
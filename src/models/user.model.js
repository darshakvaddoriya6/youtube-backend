    import mongoose, { Schema } from "mongoose";
    import jwt from "jsonwebtoken";
    import bcrypt from "bcrypt";
    import validator from 'validator'; // <-- 1. IMPORT THE LIBRARY
    import { timezoneTransform } from "../helpers/timezoneTransform.js";

    const userSchema = new Schema(
        {
            username: {
                type: String,
                unique: true,
                lowercase: true,
                trim: true,
                index: true,
            },
            email: {
                type: String,
                required: [true, 'Email is required'],
                unique: true,
                lowercase: true,
                trim: true,
                // <-- 2. ADD VALIDATOR FOR EMAIL
                validate: {
                    validator: function (v) {
                        return validator.isEmail(v);
                    },
                    message: props => `${props.value} is not a valid email address!`
                }
                // You can also use a shorter array syntax:
                // validate: [validator.isEmail, 'Please provide a valid email']
            },
            fullName: {
                type: String,
                required: true,
                trim: true,
                index: true,
            },
            avatar: {
                type: String, //cloudinary url
                required: true,
            },
            coverImage: {
                type: String, //cloudinary url
            },
            watchHistory: [
                {
                    video: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Video"
                    },
                    watchedAt: Date
                }
            ],
            watchLater: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Video"
                }
            ],
            savedPlaylists: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Playlist"
                }
            ],
            password: {
                type: String,
                required: [true, 'Password is required'],
                // <-- 3. ADD VALIDATOR FOR PASSWORD
                validate: {
                    validator: function (v) {
                        // Example: Require at least 8 characters, 1 lowercase, 1 uppercase, 1 number, and 1 symbol.
                        return validator.isStrongPassword(v, {
                            minLength: 8,
                            minLowercase: 1,
                            minUppercase: 1,
                            minNumbers: 1,
                            minSymbols: 1
                        });
                    },
                    message: () => `Password is not strong enough. It must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.`
                }
            },
            refreshToken: {
                type: String,
            },
        },
        {
            timestamps: true
        }
    );

    // This pre-save hook will run AFTER the validation
    userSchema.pre("save", async function (next) {
        if (!this.isModified("password")) return next();

        this.password = await bcrypt.hash(this.password, 10);
        next();
    });

    userSchema.methods.isPasswordCorrect = async function (password) {
        return await bcrypt.compare(password, this.password);
    };

    userSchema.methods.genrateAccessToken = function () {
        return jwt.sign(
            {
                _id: this._id,
                email: this.email,
                username: this.username,
                fullName: this.fullName,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        );
    };

    userSchema.methods.genrateRefreshToken = function () {
        return jwt.sign(
            {
                _id: this._id,
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        );
    };

    userSchema.set("toJSON", {
        transform: timezoneTransform,
    });

    export const User = mongoose.model("User", userSchema);
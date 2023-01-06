import mongoose from 'mongoose';
const { Schema } = mongoose;

export const usersSchema = new Schema(
    {
        _id: String,
        email: { type: String, default: '' },
        avatar: { type: String },
        password: { type: String, select: false },
        username: { type: String },
        permissionFlags: Number,
    }, 
    { id: false }
);
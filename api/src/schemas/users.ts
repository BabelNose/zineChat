import mongoose from 'mongoose';
const { Schema } = mongoose;

export const usersSchema = new Schema(
    {
        email: { type: String, default: '' },
        avatar: { type: String },
        password: { type: String },
        username: { type: String }
    }
);
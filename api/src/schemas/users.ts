import mongoose from 'mongoose';
const { Schema } = mongoose;

const usersSchema = new Schema(
    {
        name: String,
        avatar: String,
    }
);
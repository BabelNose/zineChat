import mongoose from 'mongoose';
import { IClient } from '../../interfaces/oauth/IClient';
const { Schema } = mongoose;

export const clientsSchema = new Schema<IClient>(
    {
        clientId: { type: String },
        clientSecret: { type: String },
        redirectUris: { type: [String] }
    }
);
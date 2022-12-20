import mongoose from 'mongoose';
import { IToken } from '../../interfaces/oauth/IToken';
const { Schema } = mongoose;

export const tokensSchema = new Schema<IToken>(
    {
        accessToken: { type: String },
        accessTokenExpiresOn: { type: Date },
        client : { type: Object },
        clientId: { type: String },
        refreshToken: { type: String },
        refreshTokenExpiresOn: { type: Date },
        user : { type: Object },
        userId: { type: String },
      }
);
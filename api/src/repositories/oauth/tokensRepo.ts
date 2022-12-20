import mongoose from "mongoose";
import { IToken } from "../../interfaces/oauth/IToken";
import { tokensSchema } from "../../schemas/oauth/tokens";

export const tokensRepo = mongoose.model<IToken>('OAuthTokens', tokensSchema);
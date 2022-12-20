import mongoose from "mongoose";
import { IClient } from "../../interfaces/oauth/IClient";
import { clientsSchema } from "../../schemas/oauth/clients";

export const clientsRepo = mongoose.model<IClient>('OAuthClients', clientsSchema);


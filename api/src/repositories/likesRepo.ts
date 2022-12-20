import mongoose from "mongoose";
import { likesSchema } from "../schemas/likes";

export const clientsRepo = mongoose.model('likes', likesSchema);

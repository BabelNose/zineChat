import mongoose from "mongoose";
import { postsSchema } from "../schemas/posts";

export const postsRepo = mongoose.model('posts', postsSchema);


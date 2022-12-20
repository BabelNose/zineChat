import { orm } from "../connections";
import { usersSchema } from "../schemas/users";

export const usersRepo = orm.model('users', usersSchema);


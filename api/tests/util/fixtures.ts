import UsersDao from '../../src/users/daos/users.dao';
import { CreateUserDto } from "../../src/users/dtos/create.user.dto";
import argon2  from "argon2";
import { PermissionFlag } from "../../src/common/enums/common.permissionflag.enum";

class Fixtures {
    async adminUserFixture(email:string, username:string, password:string):Promise<any>{
        const hashedPassword:string = await argon2.hash(password);
        const admin:CreateUserDto = {
            email:email,
            username:username,
            password:hashedPassword,
            permissionFlags: PermissionFlag.ALL_PERMISSIONS
        }
        return UsersDao.addUserWithPermission(admin);
    }
}

export default Fixtures;
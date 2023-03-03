import UsersDao from '../../src/users/daos/users.dao';
import topicsDao from '../../src/daily-posts/daos/topics.dao';
import argon2  from "argon2";
import { CreateUserDto } from "../../src/users/dtos/create.user.dto";
import { PermissionFlag } from "../../src/common/enums/common.permissionflag.enum";
import { CreateTopicDto } from '../../src/daily-posts/dtos/create.topic.dto';

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
    
    async basicUserFixture(email:string, username:string, password:string):Promise<any>{
        const hashedPassword:string = await argon2.hash(password);
        const user:CreateUserDto = {
            email:email,
            username:username,
            password:hashedPassword,
            permissionFlags: PermissionFlag.ALL_PERMISSIONS
        }
        return UsersDao.addUser(user);
    }

    async topicFixture(text:string, startDate:number):Promise<any>{
        const topic:CreateTopicDto = {
            text:text,
            startDate:new Date(startDate)
        }
        return topicsDao.addTopic(topic)
    }
}

export default Fixtures;
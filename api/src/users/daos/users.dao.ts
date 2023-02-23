
import { CreateUserDto } from '../dtos/create.user.dto';
import { PutUserDto } from '../dtos/put.user.dto';
import { PatchUserDto } from '../dtos/patch.user.dto';
import mongooseService from '../../common/services/mongoose.service';
import debug from 'debug';
import { PermissionFlag } from '../../common/enums/common.permissionflag.enum';

const log: debug.IDebugger = debug('app:users-dao');

class UsersDao {
    Schema = mongooseService.getMongoose().Schema;
    userSchema = new this.Schema({
        email: { type: String, default: '' },
        avatar: { type: String },
        password: { type: String, select: false },
        username: { type: String },
        permissionFlags: Number,
    },
    {
        'toJSON': {
            virtuals: true,
            versionKey:false,
            transform: (doc, ret) => {
                log(ret);
                delete ret._id
            }
        }
    });

    User = mongooseService.getMongoose().model('Users', this.userSchema);

    constructor() {
        log('Created new instance of UsersDao');
    }

    async addUser(userFields: CreateUserDto) {
        const user = new this.User({
            ...userFields,
            permissionFlags: PermissionFlag.FREE_PERMISSION,
        });
        const response = await user.save();
        return response.id;
    }

    async getUserByEmail(email: string) {
        return this.User.findOne({ email: email }).exec();
    }
    
    async getUserById(userId: string) {
        return this.User.findById(userId).exec();
    }
    
    async getUsers(limit = 25, page = 0) {
        return this.User.find({})
            .limit(limit)
            .skip(limit * page)
            .exec();
    }

    async updateUserById(
        userId: string,
        userFields: PatchUserDto | PutUserDto
    ) {
        const existingUser = await this.User.findOneAndUpdate(
            { _id: userId },
            { $set: userFields },
            { new: true }
        ).exec();
    
        return existingUser;
    }

    async removeUserById(userId: string) {
        return this.User.deleteOne({ _id: userId }).exec();
    }

    async getUserByEmailWithPassword(email: string) {
        return this.User.findOne({ email: email })
            .select('_id email permissionFlags +password')
            .exec();
    }
}

export default new UsersDao();
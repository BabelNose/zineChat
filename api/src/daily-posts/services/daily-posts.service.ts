import DailyPostsDao from '../daos/daily-posts.dao';
import { CRUD } from '../../common/interfaces/crud.interface';
import { CreateDailyPostDto } from '../dtos/create.daily-post.dto';
import { PutDailyPostDto } from '../dtos/put.daily-post.dto';
import { PatchDailyPostDto } from '../dtos/patch.daily-post.dto';

class DailyPostsService implements CRUD {
    async create(resource: CreateDailyPostDto) {
        return DailyPostsDao.addDailyPost({...resource, timestamp:new Date()});
    }

    async deleteById(id: string) {
        return DailyPostsDao.removePostById(id);
    }

    async list(limit: number, page: number) {
        return DailyPostsDao.getDailyPosts(limit, page);
    }

    async patchById(id: string, resource: PatchDailyPostDto) {
        return DailyPostsDao.updateDailyPostById(id, resource);
    }

    async readById(id: string) {
        return DailyPostsDao.getDailyPostById(id);
    }

    async putById(id: string, resource: PutDailyPostDto) {
        return DailyPostsDao.updateDailyPostById(id, resource);
    }
}

export default new DailyPostsService();
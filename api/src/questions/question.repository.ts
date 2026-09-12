import { DataSource } from 'typeorm';
import { Question } from './question.entity.js';

export function createQuestionRepository(dataSource: DataSource) {
    return dataSource.getRepository(Question).extend({
        addTags(questionId: string, tagIds: string[]): Promise<void> {
            return this.createQueryBuilder()
                .relation(Question, 'tags')
                .of(questionId)
                .add(tagIds);
        },

        removeTag(questionId: string, tagId: string): Promise<void> {
            return this.createQueryBuilder()
                .relation(Question, 'tags')
                .of(questionId)
                .remove(tagId);
        },
    });
}

export type QuestionRepository = ReturnType<typeof createQuestionRepository>;

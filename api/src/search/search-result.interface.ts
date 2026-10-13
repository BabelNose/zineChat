export type SearchResourceType = 'question' | 'answer' | 'comment' | 'tag';

export interface SearchResult {
    resourceType: SearchResourceType;
    resourceId: string;
    questionId: string;
}

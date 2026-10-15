export type SearchResourceType = 'question' | 'answer' | 'comment';

export interface SearchResult {
    resourceType: SearchResourceType;
    resourceId: string;
    questionId: string;
}

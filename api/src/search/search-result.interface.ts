export type SearchResourceType = 'question' | 'answer' | 'comment';

export interface SearchResultTag {
    id: string;
    tag: string;
}

export interface SearchResult {
    resourceType: SearchResourceType;
    resourceId: string;
    questionId: string;
    /** The matched resource's own text - the question, answer, or comment body. */
    text: string;
    /** This result's own creation date. */
    created: string;
    /** The owning question's text, creation date, tags, and answer/comment counts -
     * same values as `text`/`created` above when resourceType is 'question'. */
    questionText: string;
    questionCreated: string;
    answerCount: number;
    commentCount: number;
    tags: SearchResultTag[];
}

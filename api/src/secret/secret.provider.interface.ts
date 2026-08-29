export interface ISecretProvider{
    getAll():void;
    get(key:string): string;
}

export const ISecretProvider = Symbol('ISecretProvider');
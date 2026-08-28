import { Inject, Injectable } from '@nestjs/common';
import { ISecretProvider } from './secret.provider.interface.js';

@Injectable()
export class SecretService {
    constructor(
        @Inject(ISecretProvider)
        private readonly secretProvider: ISecretProvider,
    ){}

    get(key:string) {
        return this.secretProvider.get(key);
    }
}

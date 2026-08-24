import { ISecretProvider } from "./secret.provider.interface";
import { secrets } from "./local.secrets"
import { Injectable } from "@nestjs/common";

@Injectable()
export class LocalSecretProvider implements ISecretProvider{
    getAll(): Object {
        return secrets;
    }

    get(key: string): string {
        return secrets[key];
    }
}
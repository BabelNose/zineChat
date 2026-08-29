import { ISecretProvider } from "./secret.provider.interface.js";
import { secrets } from "./local.secrets.js"
import { Injectable } from "@nestjs/common";

@Injectable()
export class LocalSecretProvider implements ISecretProvider{
    getAll(): Object {
        return secrets;
    }

    get(key: keyof typeof secrets): string {
        return secrets[key];
    }
}
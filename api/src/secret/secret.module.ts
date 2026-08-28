import { Module } from '@nestjs/common';
import { SecretService } from './secret.service.js';
import { ISecretProvider } from './secret.provider.interface.js';
import { LocalSecretProvider } from './secret.provider.local.js';

@Module({
  providers: [SecretService, {
      provide: ISecretProvider,
      useClass: LocalSecretProvider,
    },],
    exports: [SecretService, {
      provide: ISecretProvider,
      useClass: LocalSecretProvider,
    },]
})
export class SecretModule {}

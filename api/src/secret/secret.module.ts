import { Module } from '@nestjs/common';
import { SecretService } from './secret.service';
import { ISecretProvider } from './secret.provider.interface';
import { LocalSecretProvider } from './secret.provider.local';

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

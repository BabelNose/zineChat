import { Module } from '@nestjs/common';
import { SecretModule } from '../../secret/secret.module.js';
import { CursorCodecService } from './cursor-codec.service.js';

@Module({
    imports: [SecretModule],
    providers: [CursorCodecService],
    exports: [CursorCodecService],
})
export class PaginationModule {}

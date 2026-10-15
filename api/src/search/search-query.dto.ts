import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationQueryDto } from '../common/pagination/pagination.dto.js';

export class SearchQueryDto extends PaginationQueryDto {
    @IsString()
    @IsNotEmpty()
    q: string;
}

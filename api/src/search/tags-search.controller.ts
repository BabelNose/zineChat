import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service.js';
import { SearchQueryDto } from './search-query.dto.js';

@Controller('tags')
export class TagsSearchController {
    constructor(private readonly searchService: SearchService) {}

    @Get('search')
    search(@Query() query: SearchQueryDto) {
        return this.searchService.searchTags(query);
    }
}

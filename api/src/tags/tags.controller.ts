import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { TagsService } from './tags.service.js';
import { CreateTagDto } from './create.tag.dto.js';
import { UpdateTagDto } from './update.tag.dto.js';
import { SearchQueryDto } from '../search/search-query.dto.js';

@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: CreateTagDto) {
        return this.tagsService.create(dto);
    }

    @Get()
    findAll() {
        return this.tagsService.findAll();
    }

    @Get('search')
    search(@Query() query: SearchQueryDto) {
        return this.tagsService.search(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tagsService.findOneOrFail(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
        return this.tagsService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.tagsService.remove(id);
    }
}

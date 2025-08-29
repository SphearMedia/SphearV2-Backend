import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MusicalService } from './musical.service';
import { UpdateMusicalDto } from './dto/musical.dto';

@Controller('musical')
export class MusicalController {
  constructor(private readonly musicalService: MusicalService) {}

  @Post()
  create(@Body() createMusicalDto: UpdateMusicalDto) {
   // return this.musicalService.create(createMusicalDto);
  }

  @Get()
  findAll() {
   // return this.musicalService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
   // return this.musicalService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMusicalDto: UpdateMusicalDto) {
  //  return this.musicalService.update(+id, updateMusicalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
   // return this.musicalService.remove(+id);
  }
}

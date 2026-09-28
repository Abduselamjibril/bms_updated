import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AssignRoleDto } from './dto/assign-role.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from '../../common/decorators/auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@Auth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/signature')
  @ApiOperation({ summary: 'Get current user signature' })
  async getMySignature(@Req() req: any) {
    return this.usersService.getSignature(req.user.id);
  }

  @Post('me/signature')
  @ApiOperation({ summary: 'Upload or draw current user signature' })
  @UseInterceptors(FileInterceptor('file'))
  async saveMySignature(
    @Req() req: any,
    @Body('signature_svg') signatureSvg?: string,
    @Body('signature_png_base64') signaturePngBase64?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.saveSignature(
      req.user.id,
      signatureSvg,
      signaturePngBase64,
      file,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @Permissions('users:create')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @Permissions('users:read')
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @Permissions('users:read')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user details or reset password' })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update data',
    examples: {
      example1: {
        value: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          status: 'active',
        },
      },
    },
  })
  @Permissions('users:update')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate an inactive user' })
  @Permissions('users:update')
  async activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user (set status=inactive)' })
  @Permissions('users:delete')
  async remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }

  @Post('assign-role')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({ status: 201, description: 'Role assigned to user.' })
  @Permissions('users:update')
  async assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.usersService.assignRole(assignRoleDto);
  }
}

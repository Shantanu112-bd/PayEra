import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ApiMockAuth } from "../common/decorators/api-auth-headers.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { MockAuthGuard } from "../common/guards/mock-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { UserRole } from "../generated/prisma";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersDto } from "./dto/list-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@ApiMockAuth()
@UseGuards(MockAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Create a user." })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "List users with pagination and filters." })
  list(@Query() query: ListUsersDto) {
    return this.usersService.list(query);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get a user profile and linked entities." })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update a user." })
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Post(":id/activate")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Activate a user." })
  activate(@Param("id") id: string) {
    return this.usersService.activate(id);
  }

  @Post(":id/suspend")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Suspend a user." })
  suspend(@Param("id") id: string) {
    return this.usersService.suspend(id);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Soft-delete a user." })
  softDelete(@Param("id") id: string) {
    return this.usersService.softDelete(id);
  }
}

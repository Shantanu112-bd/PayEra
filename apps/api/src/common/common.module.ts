import { Global, Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { MockAuthGuard } from "./guards/mock-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Global()
@Module({
  exports: [MockAuthGuard, PrismaModule, RolesGuard],
  imports: [PrismaModule],
  providers: [MockAuthGuard, RolesGuard],
})
export class CommonModule {}

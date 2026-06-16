import { Body, Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ApiMockAuth } from "../common/decorators/api-auth-headers.decorator";
import {
  CurrentUser,
  type AuthenticatedPrincipal,
} from "../common/decorators/current-user.decorator";
import { MockAuthGuard } from "../common/guards/mock-auth.guard";
import { AuthService } from "./auth.service";
import { MockLoginDto } from "./dto/mock-login.dto";
import { WalletChallengeDto } from "./dto/wallet-challenge.dto";
import { WalletLoginDto } from "./dto/wallet-login.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("mock-login")
  @ApiOperation({
    summary: "Create or reuse a demo user and return the mock auth header.",
  })
  mockLogin(@Body() dto: MockLoginDto) {
    return this.authService.mockLogin(dto);
  }

  @Post("wallet/challenge")
  @ApiOperation({ summary: "Generate a mock wallet login challenge." })
  walletChallenge(@Body() dto: WalletChallengeDto) {
    return this.authService.issueWalletChallenge(dto);
  }

  @Post("wallet/login")
  @ApiOperation({
    summary: "Create or reuse a user from a wallet login simulation.",
  })
  walletLogin(@Body() dto: WalletLoginDto) {
    return this.authService.walletLogin(dto);
  }

  @Get("me")
  @UseGuards(MockAuthGuard)
  @ApiMockAuth()
  @ApiOperation({ summary: "Return the active mock-authenticated user." })
  me(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.authService.me(principal);
  }
}

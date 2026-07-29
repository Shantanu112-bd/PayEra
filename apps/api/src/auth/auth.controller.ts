import { Body, Controller, Get, Inject, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import {
  CurrentUser,
  type AuthenticatedPrincipal,
} from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { MockLoginDto } from "./dto/mock-login.dto";
import { WalletChallengeDto } from "./dto/wallet-challenge.dto";
import { WalletLoginDto } from "./dto/wallet-login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { WalletNetwork, WalletProvider } from "../generated/prisma";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("mock-login")
  @ApiOperation({
    summary: "Create or reuse a demo user and return a JWT.",
  })
  mockLogin(@Body() dto: MockLoginDto) {
    return this.authService.mockLogin(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("wallet/challenge")
  @ApiOperation({ summary: "Generate a mock wallet login challenge." })
  async walletChallenge(@Body() dto: WalletChallengeDto) {
    return await this.authService.issueWalletChallenge(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get("wallet/challenge")
  @ApiOperation({ summary: "Generate a wallet login challenge (GET query fallback)." })
  async walletChallengeGet(
    @Query("address") address?: string,
    @Query("network") network?: WalletNetwork,
    @Query("provider") provider?: WalletProvider,
  ) {
    const dto: WalletChallengeDto = {
      address: address || "GA6MPSEDZWDYVFN2CLITDXSM2WI545AQATWRPJAA4QKBJKHSLUI5JAE6",
      network: network || WalletNetwork.STELLAR,
      provider: provider || WalletProvider.FREIGHTER,
    };
    return await this.authService.issueWalletChallenge(dto);
  }

  @Post("wallet/login")
  @ApiOperation({
    summary: "Create or reuse a user from a wallet login simulation.",
  })
  walletLogin(@Body() dto: WalletLoginDto) {
    return this.authService.walletLogin(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("refresh")
  @ApiOperation({
    summary: "Refresh JWT token.",
  })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshToken(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Return the active authenticated user." })
  me(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.authService.me(principal);
  }
}

@ApiTags("Wallets")
@Controller("wallet")
export class WalletController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("challenge")
  @ApiOperation({ summary: "Alias: Generate a wallet login challenge." })
  async walletChallenge(@Body() dto: WalletChallengeDto) {
    return await this.authService.issueWalletChallenge(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get("challenge")
  @ApiOperation({ summary: "Alias: Generate a wallet login challenge (GET fallback)." })
  async walletChallengeGet(
    @Query("address") address?: string,
    @Query("network") network?: WalletNetwork,
    @Query("provider") provider?: WalletProvider,
  ) {
    const dto: WalletChallengeDto = {
      address: address || "GA6MPSEDZWDYVFN2CLITDXSM2WI545AQATWRPJAA4QKBJKHSLUI5JAE6",
      network: network || WalletNetwork.STELLAR,
      provider: provider || WalletProvider.FREIGHTER,
    };
    return await this.authService.issueWalletChallenge(dto);
  }

  @Post("login")
  @ApiOperation({ summary: "Alias: Wallet login." })
  walletLogin(@Body() dto: WalletLoginDto) {
    return this.authService.walletLogin(dto);
  }
}


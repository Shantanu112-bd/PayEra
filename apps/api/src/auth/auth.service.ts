import { BadRequestException, Inject, Injectable } from "@nestjs/common";

import { UserRole, UserStatus, WalletStatus } from "../generated/prisma";
import { PrismaService } from "../prisma/prisma.service";
import { createReadableId, createReferralCode } from "../common/utils/ids";
import {
  normalizeEmail,
  normalizePhone,
  normalizeWalletAddress,
} from "../common/utils/normalizers";
import type { AuthenticatedPrincipal } from "../common/decorators/current-user.decorator";
import type { MockLoginDto } from "./dto/mock-login.dto";
import type { WalletChallengeDto } from "./dto/wallet-challenge.dto";
import type { WalletLoginDto } from "./dto/wallet-login.dto";

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async mockLogin(dto: MockLoginDto) {
    const emailNormalized = normalizeEmail(dto.email);
    const phoneE164 = normalizePhone(dto.phoneE164);

    if (emailNormalized === undefined && phoneE164 === undefined) {
      throw new BadRequestException("Either email or phoneE164 is required");
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(emailNormalized === undefined ? [] : [{ emailNormalized }]),
          ...(phoneE164 === undefined ? [] : [{ phoneE164 }]),
        ],
      },
    });

    const user =
      existingUser === null
        ? await this.prisma.user.create({
            data: {
              displayName: dto.displayName ?? null,
              email: dto.email ?? null,
              emailNormalized: emailNormalized ?? null,
              phoneE164: phoneE164 ?? null,
              referralCode: createReferralCode(),
              role: dto.role ?? UserRole.CONSUMER,
              status: UserStatus.ACTIVE,
            },
          })
        : await this.prisma.user.update({
            data: {
              ...(dto.displayName === undefined ? {} : { displayName: dto.displayName }),
              lastLoginAt: new Date(),
              ...(existingUser.status === UserStatus.PENDING_ONBOARDING
                ? { status: UserStatus.ACTIVE }
                : {}),
            },
            where: { id: existingUser.id },
          });

    return {
      auth: this.toMockAuth(user.id),
      user,
    };
  }

  issueWalletChallenge(dto: WalletChallengeDto) {
    const nonce = createReadableId("NONCE");
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 5 * 60 * 1000);

    return {
      expiresAt,
      message: `CryptoPay Network login\nnetwork=${dto.network}\nprovider=${dto.provider}\naddress=${dto.address}\nnonce=${nonce}`,
      nonce,
    };
  }

  async walletLogin(dto: WalletLoginDto) {
    const addressNormalized = normalizeWalletAddress(dto.address);
    const wallet = await this.prisma.wallet.findUnique({
      include: { user: true },
      where: {
        network_addressNormalized: {
          addressNormalized,
          network: dto.network,
        },
      },
    });

    if (wallet !== null) {
      const user = await this.prisma.user.update({
        data: { lastLoginAt: new Date(), status: UserStatus.ACTIVE },
        where: { id: wallet.userId },
      });

      await this.prisma.wallet.update({
        data: {
          lastUsedAt: new Date(),
          status: WalletStatus.ACTIVE,
        },
        where: { id: wallet.id },
      });

      return {
        auth: this.toMockAuth(user.id),
        user,
        wallet,
      };
    }

    const user = await this.prisma.user.create({
      data: {
        displayName: dto.displayName ?? null,
        referralCode: createReferralCode(),
        role: dto.role ?? UserRole.CONSUMER,
        status: UserStatus.ACTIVE,
        wallets: {
          create: {
            address: dto.address,
            addressNormalized,
            isPrimary: true,
            lastUsedAt: new Date(),
            network: dto.network,
            provider: dto.provider,
            status: WalletStatus.ACTIVE,
            verifiedAt: new Date(),
          },
        },
      },
    });
    const createdWallet = await this.prisma.wallet.findFirstOrThrow({
      where: { userId: user.id },
    });

    return {
      auth: this.toMockAuth(user.id),
      user,
      wallet: createdWallet,
    };
  }

  async me(principal: AuthenticatedPrincipal) {
    return this.prisma.user.findUniqueOrThrow({
      include: {
        wallets: true,
      },
      where: { id: principal.id },
    });
  }

  private toMockAuth(userId: string) {
    return {
      header: "x-user-id",
      scheme: "mock-header",
      value: userId,
    };
  }
}

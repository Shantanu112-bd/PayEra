import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { jsonObject } from "../common/utils/json";
import { normalizeWalletAddress } from "../common/utils/normalizers";
import { toPagination } from "../common/utils/pagination";
import { UserRole, WalletStatus, type Prisma } from "../generated/prisma";
import type { AuthenticatedPrincipal } from "../common/decorators/current-user.decorator";
import type { CreateWalletDto } from "./dto/create-wallet.dto";
import type { ListWalletsDto } from "./dto/list-wallets.dto";
import type { UpdateWalletDto } from "./dto/update-wallet.dto";

@Injectable()
export class WalletsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(owner: AuthenticatedPrincipal, dto: CreateWalletDto) {
    const addressNormalized = normalizeWalletAddress(dto.address);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary === true) {
        await tx.wallet.updateMany({
          data: { isPrimary: false },
          where: { userId: owner.id },
        });
      }

      return tx.wallet.create({
        data: {
          address: dto.address,
          addressNormalized,
          isPrimary: dto.isPrimary ?? false,
          label: dto.label ?? null,
          metadata: jsonObject(dto.metadata),
          network: dto.network,
          provider: dto.provider,
          publicKey: dto.publicKey ?? null,
          status: WalletStatus.ACTIVE,
          userId: owner.id,
          verifiedAt: new Date(),
        },
      });
    });
  }

  async list(owner: AuthenticatedPrincipal, query: ListWalletsDto) {
    const { skip, take } = toPagination(query);
    const where: Prisma.WalletWhereInput = {
      ...(owner.role === UserRole.ADMIN ? {} : { userId: owner.id }),
      ...(query.network === undefined ? {} : { network: query.network }),
      ...(query.provider === undefined ? {} : { provider: query.provider }),
      ...(query.status === undefined ? {} : { status: query.status }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.wallet.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        where,
      }),
      this.prisma.wallet.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(owner: AuthenticatedPrincipal, id: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id },
    });

    if (wallet === null) {
      throw new NotFoundException("Wallet not found");
    }

    this.assertWalletAccess(owner, wallet.userId);

    return wallet;
  }

  async update(owner: AuthenticatedPrincipal, id: string, dto: UpdateWalletDto) {
    const wallet = await this.findOne(owner, id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary === true) {
        await tx.wallet.updateMany({
          data: { isPrimary: false },
          where: { userId: wallet.userId },
        });
      }

      return tx.wallet.update({
        data: {
          ...(dto.isPrimary === undefined ? {} : { isPrimary: dto.isPrimary }),
          ...(dto.label === undefined ? {} : { label: dto.label }),
          ...(dto.metadata === undefined ? {} : { metadata: jsonObject(dto.metadata) }),
          ...(dto.status === undefined ? {} : { status: dto.status }),
        },
        where: { id },
      });
    });
  }

  async disconnect(owner: AuthenticatedPrincipal, id: string) {
    await this.findOne(owner, id);

    return this.prisma.wallet.update({
      data: {
        isPrimary: false,
        status: WalletStatus.DISCONNECTED,
      },
      where: { id },
    });
  }

  private assertWalletAccess(owner: AuthenticatedPrincipal, userId: string) {
    if (owner.role === UserRole.ADMIN || owner.id === userId) {
      return;
    }

    throw new ForbiddenException("Wallet belongs to another user");
  }
}

import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { createReadableId } from "../common/utils/ids";
import { jsonObject } from "../common/utils/json";
import { calculateSpendRewardStar } from "../common/utils/rewards";
import { toPagination } from "../common/utils/pagination";
import { RewardStatus, UserRole, type Prisma, type Reward } from "../generated/prisma";
import type { AuthenticatedPrincipal } from "../common/decorators/current-user.decorator";
import type { CalculateSpendRewardDto } from "./dto/calculate-spend-reward.dto";
import type { CreateRewardDto } from "./dto/create-reward.dto";
import type { ListRewardsDto } from "./dto/list-rewards.dto";

@Injectable()
export class RewardsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  calculateSpendReward(dto: CalculateSpendRewardDto) {
    return {
      amountInPaise: dto.amountInPaise,
      formula: "10 STAR per INR 100 spent",
      starAmount: calculateSpendRewardStar(BigInt(dto.amountInPaise)).toString(),
    };
  }

  create(dto: CreateRewardDto) {
    return this.prisma.reward.create({
      data: {
        campaignId: dto.campaignId ?? null,
        formulaVersion: dto.formulaVersion ?? "MANUAL_V1",
        metadata: jsonObject(dto.metadata),
        reason: dto.reason,
        referralId: dto.referralId ?? null,
        ruleSnapshot: jsonObject(dto.ruleSnapshot),
        starAmount: BigInt(dto.starAmount),
        status: dto.status ?? RewardStatus.PENDING,
        transactionId: dto.transactionId ?? null,
        userId: dto.userId,
      },
    });
  }

  async list(owner: AuthenticatedPrincipal, query: ListRewardsDto) {
    const { skip, take } = toPagination(query);
    const where: Prisma.RewardWhereInput = {
      ...(owner.role === UserRole.ADMIN
        ? {}
        : {
            OR: [{ userId: owner.id }, { transaction: { merchant: { ownerUserId: owner.id } } }],
          }),
      ...(query.reason === undefined ? {} : { reason: query.reason }),
      ...(query.status === undefined ? {} : { status: query.status }),
      ...(query.userId === undefined ? {} : { userId: query.userId }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.reward.findMany({
        include: {
          campaign: true,
          referral: true,
          transaction: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        where,
      }),
      this.prisma.reward.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(owner: AuthenticatedPrincipal, id: string) {
    const reward = await this.prisma.reward.findUnique({
      include: {
        campaign: true,
        referral: true,
        transaction: { include: { merchant: true } },
        user: true,
      },
      where: { id },
    });

    if (reward === null) {
      throw new NotFoundException("Reward not found");
    }

    this.assertRewardAccess(owner, reward);

    return reward;
  }

  async balance(owner: AuthenticatedPrincipal, userId?: string) {
    const targetUserId = userId ?? owner.id;

    if (owner.role !== UserRole.ADMIN && targetUserId !== owner.id) {
      throw new ForbiddenException("Cannot read another user's reward balance");
    }

    const [minted, pending, lifetime] = await this.prisma.$transaction([
      this.prisma.reward.aggregate({
        _sum: { starAmount: true },
        where: { status: RewardStatus.MINTED, userId: targetUserId },
      }),
      this.prisma.reward.aggregate({
        _sum: { starAmount: true },
        where: { status: RewardStatus.PENDING, userId: targetUserId },
      }),
      this.prisma.reward.aggregate({
        _sum: { starAmount: true },
        where: { userId: targetUserId },
      }),
    ]);

    return {
      lifetimeStar: lifetime._sum.starAmount ?? 0,
      mintedStar: minted._sum.starAmount ?? 0,
      pendingStar: pending._sum.starAmount ?? 0,
      userId: targetUserId,
    };
  }

  mint(id: string) {
    return this.prisma.reward.update({
      data: {
        mintedAt: new Date(),
        status: RewardStatus.MINTED,
        stellarMintHash: createReadableId("STAR_MINT"),
      },
      where: { id },
    });
  }

  reverse(id: string) {
    return this.prisma.reward.update({
      data: {
        reversedAt: new Date(),
        status: RewardStatus.REVERSED,
      },
      where: { id },
    });
  }

  private assertRewardAccess(
    owner: AuthenticatedPrincipal,
    reward: Reward & {
      transaction: { merchant: { ownerUserId: string | null } } | null;
    },
  ) {
    if (
      owner.role === UserRole.ADMIN ||
      reward.userId === owner.id ||
      reward.transaction?.merchant.ownerUserId === owner.id
    ) {
      return;
    }

    throw new ForbiddenException("Reward is not visible to this user");
  }
}

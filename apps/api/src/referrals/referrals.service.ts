import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { createReferralCode } from "../common/utils/ids";
import { jsonObject } from "../common/utils/json";
import { REFERRAL_REWARD_STAR } from "../common/utils/rewards";
import { toPagination } from "../common/utils/pagination";
import {
  ReferralStatus,
  RewardReason,
  RewardStatus,
  TransactionStatus,
  UserRole,
  type Prisma,
  type Referral,
} from "../generated/prisma";
import type { AuthenticatedPrincipal } from "../common/decorators/current-user.decorator";
import type { AcceptReferralDto } from "./dto/accept-referral.dto";
import type { CreateReferralDto } from "./dto/create-referral.dto";
import type { ListReferralsDto } from "./dto/list-referrals.dto";
import type { QualifyReferralDto } from "./dto/qualify-referral.dto";

@Injectable()
export class ReferralsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  createInvite(owner: AuthenticatedPrincipal, dto: CreateReferralDto) {
    return this.prisma.referral.create({
      data: {
        code: createReferralCode(),
        expiresAt: dto.expiresAt ?? null,
        inviterUserId: owner.id,
        metadata: jsonObject(dto.metadata),
        rewardAmountStar: REFERRAL_REWARD_STAR,
      },
    });
  }

  async accept(owner: AuthenticatedPrincipal, dto: AcceptReferralDto) {
    const referral = await this.prisma.referral.findUnique({
      where: { code: dto.code },
    });

    if (referral === null) {
      throw new NotFoundException("Referral code not found");
    }

    if (referral.inviterUserId === owner.id) {
      throw new BadRequestException("Cannot accept your own referral");
    }

    if (referral.invitedUserId !== null && referral.invitedUserId !== owner.id) {
      throw new BadRequestException("Referral code has already been accepted");
    }

    if (referral.expiresAt !== null && referral.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Referral code has expired");
    }

    return this.prisma.referral.update({
      data: {
        invitedUserId: owner.id,
        status: ReferralStatus.INVITED,
      },
      where: { id: referral.id },
    });
  }

  async list(owner: AuthenticatedPrincipal, query: ListReferralsDto) {
    const { skip, take } = toPagination(query);
    const where: Prisma.ReferralWhereInput = {
      ...(owner.role === UserRole.ADMIN
        ? {}
        : {
            OR: [{ inviterUserId: owner.id }, { invitedUserId: owner.id }],
          }),
      ...(query.status === undefined ? {} : { status: query.status }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.referral.findMany({
        include: {
          invitedUser: true,
          inviterUser: true,
          reward: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        where,
      }),
      this.prisma.referral.count({ where }),
    ]);

    return { items, total };
  }

  async qualify(owner: AuthenticatedPrincipal, id: string, dto: QualifyReferralDto) {
    const referral = await this.findVisible(owner, id);

    if (referral.invitedUserId === null) {
      throw new BadRequestException("Referral has not been accepted");
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: dto.firstTransactionId },
    });

    if (
      transaction === null ||
      transaction.userId !== referral.invitedUserId ||
      transaction.status !== TransactionStatus.COMPLETED
    ) {
      throw new BadRequestException("First transaction must be completed by the invited user");
    }

    return this.prisma.referral.update({
      data: {
        firstTransactionId: dto.firstTransactionId,
        qualifiedAt: new Date(),
        status: ReferralStatus.QUALIFIED,
      },
      where: { id },
    });
  }

  async reward(owner: AuthenticatedPrincipal, id: string) {
    const referral = await this.findVisible(owner, id);

    if (referral.status !== ReferralStatus.QUALIFIED) {
      throw new BadRequestException("Referral must be qualified before reward");
    }

    return this.prisma.$transaction(async (tx) => {
      const reward = await tx.reward.upsert({
        create: {
          formulaVersion: "REFERRAL_V1",
          reason: RewardReason.REFERRAL,
          referralId: referral.id,
          ruleSnapshot: {
            formula: "100 STAR when invited friend completes first payment",
          },
          starAmount: referral.rewardAmountStar,
          status: RewardStatus.MINTED,
          userId: referral.inviterUserId,
          mintedAt: new Date(),
        },
        update: {
          status: RewardStatus.MINTED,
        },
        where: { referralId: referral.id },
      });

      const updatedReferral = await tx.referral.update({
        data: {
          rewardedAt: new Date(),
          status: ReferralStatus.REWARDED,
        },
        where: { id: referral.id },
      });

      return {
        referral: updatedReferral,
        reward,
      };
    });
  }

  private async findVisible(owner: AuthenticatedPrincipal, id: string): Promise<Referral> {
    const referral = await this.prisma.referral.findUnique({ where: { id } });

    if (referral === null) {
      throw new NotFoundException("Referral not found");
    }

    if (
      owner.role === UserRole.ADMIN ||
      referral.inviterUserId === owner.id ||
      referral.invitedUserId === owner.id
    ) {
      return referral;
    }

    throw new ForbiddenException("Referral is not visible to this user");
  }
}

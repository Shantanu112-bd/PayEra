import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { jsonObject } from "../common/utils/json";
import { toPagination } from "../common/utils/pagination";
import {
  BrandStatus,
  type CampaignStatus,
  UserRole,
  type Brand,
  type Campaign,
  type Prisma,
} from "../generated/prisma";
import type { AuthenticatedPrincipal } from "../common/decorators/current-user.decorator";
import type { CreateBrandDto } from "./dto/create-brand.dto";
import type { CreateCampaignDto } from "./dto/create-campaign.dto";
import type { ListCampaignsDto } from "./dto/list-campaigns.dto";
import type { UpdateCampaignDto } from "./dto/update-campaign.dto";

@Injectable()
export class CampaignsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  createBrand(owner: AuthenticatedPrincipal, dto: CreateBrandDto) {
    const ownerUserId = owner.role === UserRole.ADMIN ? (dto.ownerUserId ?? owner.id) : owner.id;

    return this.prisma.brand.create({
      data: {
        metadata: jsonObject(dto.metadata),
        name: dto.name,
        ownerUserId,
        slug: dto.slug,
        status: BrandStatus.ACTIVE,
      },
    });
  }

  listBrands(owner: AuthenticatedPrincipal) {
    return this.prisma.brand.findMany({
      orderBy: { createdAt: "desc" },
      where: owner.role === UserRole.ADMIN ? {} : { ownerUserId: owner.id },
    });
  }

  async createCampaign(owner: AuthenticatedPrincipal, dto: CreateCampaignDto) {
    await this.assertBrandAccess(owner, dto.brandId);

    return this.prisma.campaign.create({
      data: {
        brandId: dto.brandId,
        budgetStar: BigInt(dto.budgetStar),
        description: dto.description ?? null,
        endsAt: dto.endsAt ?? null,
        metadata: jsonObject(dto.metadata),
        name: dto.name,
        rewardAmountStar: BigInt(dto.rewardAmountStar),
        ...(dto.rewardType === undefined ? {} : { rewardType: dto.rewardType }),
        startsAt: dto.startsAt ?? null,
        thresholdAmountPaise: BigInt(dto.thresholdAmountPaise),
      },
    });
  }

  async listCampaigns(owner: AuthenticatedPrincipal, query: ListCampaignsDto) {
    const { skip, take } = toPagination(query);
    const ownedBrandFilter =
      owner.role === UserRole.ADMIN ? {} : { brand: { ownerUserId: owner.id } };
    const where: Prisma.CampaignWhereInput = {
      ...ownedBrandFilter,
      ...(query.brandId === undefined ? {} : { brandId: query.brandId }),
      ...(query.rewardType === undefined ? {} : { rewardType: query.rewardType }),
      ...(query.status === undefined ? {} : { status: query.status }),
      ...(query.search === undefined
        ? {}
        : { name: { contains: query.search, mode: "insensitive" } }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        include: { brand: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        where,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return { items, total };
  }

  async findCampaign(owner: AuthenticatedPrincipal, id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      include: {
        brand: true,
        merchantLinks: { include: { merchant: true } },
      },
      where: { id },
    });

    if (campaign === null) {
      throw new NotFoundException("Campaign not found");
    }

    this.assertCampaignAccess(owner, campaign);

    return campaign;
  }

  async updateCampaign(owner: AuthenticatedPrincipal, id: string, dto: UpdateCampaignDto) {
    await this.findCampaign(owner, id);

    return this.prisma.campaign.update({
      data: {
        ...(dto.budgetStar === undefined ? {} : { budgetStar: BigInt(dto.budgetStar) }),
        ...(dto.description === undefined ? {} : { description: dto.description }),
        ...(dto.endsAt === undefined ? {} : { endsAt: dto.endsAt }),
        ...(dto.metadata === undefined ? {} : { metadata: jsonObject(dto.metadata) }),
        ...(dto.name === undefined ? {} : { name: dto.name }),
        ...(dto.rewardAmountStar === undefined
          ? {}
          : { rewardAmountStar: BigInt(dto.rewardAmountStar) }),
        ...(dto.startsAt === undefined ? {} : { startsAt: dto.startsAt }),
        ...(dto.status === undefined ? {} : { status: dto.status }),
        ...(dto.thresholdAmountPaise === undefined
          ? {}
          : { thresholdAmountPaise: BigInt(dto.thresholdAmountPaise) }),
      },
      where: { id },
    });
  }

  setStatus(owner: AuthenticatedPrincipal, id: string, status: CampaignStatus) {
    return this.updateCampaign(owner, id, { status });
  }

  async addMerchant(owner: AuthenticatedPrincipal, campaignId: string, merchantId: string) {
    await this.findCampaign(owner, campaignId);

    return this.prisma.campaignMerchant.upsert({
      create: {
        campaignId,
        merchantId,
      },
      update: {
        isActive: true,
      },
      where: {
        campaignId_merchantId: {
          campaignId,
          merchantId,
        },
      },
    });
  }

  async analytics(owner: AuthenticatedPrincipal, campaignId: string) {
    await this.findCampaign(owner, campaignId);

    const [transactionStats, merchants, recentRewards] = await this.prisma.$transaction([
      this.prisma.transaction.aggregate({
        _count: { _all: true },
        _sum: { amountInPaise: true },
        where: { campaignId },
      }),
      this.prisma.campaignMerchant.count({
        where: { campaignId, isActive: true },
      }),
      this.prisma.reward.findMany({
        where: { campaignId, status: "MINTED" },
        select: { starAmount: true, createdAt: true },
      })
    ]);

    let totalDistributedSTAR = 0;
    const seriesMap = new Map<string, number>();

    for (const reward of recentRewards) {
      const dateStr = reward.createdAt.toISOString().split("T")[0]!;
      const amount = Number(reward.starAmount);
      totalDistributedSTAR += amount;

      if (!seriesMap.has(dateStr)) {
        seriesMap.set(dateStr, 0);
      }
      seriesMap.set(dateStr, seriesMap.get(dateStr)! + amount);
    }

    const timelineSeries = Array.from(seriesMap.entries())
      .map(([day, distributed]) => ({ day, distributed }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return {
      merchants,
      participantCount: transactionStats._count._all, // Representing participating unique transactions or users
      totalDistributedSTAR,
      revenueInfluencedPaise: transactionStats._sum.amountInPaise ?? 0,
      transactions: transactionStats._count._all,
      timelineSeries,
    };
  }

  private async assertBrandAccess(owner: AuthenticatedPrincipal, brandId: string): Promise<Brand> {
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });

    if (brand === null) {
      throw new NotFoundException("Brand not found");
    }

    if (owner.role === UserRole.ADMIN || brand.ownerUserId === owner.id) {
      return brand;
    }

    throw new ForbiddenException("Brand belongs to another user");
  }

  private assertCampaignAccess(
    owner: AuthenticatedPrincipal,
    campaign: Campaign & { brand: Brand },
  ) {
    if (owner.role === UserRole.ADMIN || campaign.brand.ownerUserId === owner.id) {
      return;
    }

    throw new ForbiddenException("Campaign belongs to another user");
  }
}

import type { Prisma } from "../../generated/prisma";

export function jsonObject(value: Record<string, unknown> | undefined): Prisma.InputJsonObject {
  return (value ?? {}) as Prisma.InputJsonObject;
}

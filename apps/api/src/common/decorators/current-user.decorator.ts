import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { UserRole } from "../../generated/prisma";

export type AuthenticatedPrincipal = {
  id: string;
  role: UserRole;
};

export type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedPrincipal;
};

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedPrincipal | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (data === undefined) {
      return request.user;
    }

    return request.user?.[data];
  },
);

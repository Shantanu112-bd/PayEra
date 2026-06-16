import { applyDecorators } from "@nestjs/common";
import { ApiHeader } from "@nestjs/swagger";

export function ApiMockAuth(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiHeader({
      description: "Mock authenticated user id for MVP/demo environments.",
      name: "x-user-id",
      required: true,
    }),
    ApiHeader({
      description: "Optional request id for admin/audit correlation.",
      name: "x-request-id",
      required: false,
    }),
  );
}

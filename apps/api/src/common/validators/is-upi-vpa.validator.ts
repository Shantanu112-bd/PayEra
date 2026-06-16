import { applyDecorators } from "@nestjs/common";
import { Matches } from "class-validator";

export function IsUpiVpa(): PropertyDecorator {
  return applyDecorators(
    Matches(/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9._-]{2,64}$/, {
      message: "must be a valid UPI VPA for the mocked UPI rail",
    }),
  );
}

import { applyDecorators } from "@nestjs/common";
import { Matches } from "class-validator";

export function IsStellarPublicKey(): PropertyDecorator {
  return applyDecorators(
    Matches(/^G[A-Z2-7]{55}$/, {
      message: "must be a valid Stellar public key",
    }),
  );
}

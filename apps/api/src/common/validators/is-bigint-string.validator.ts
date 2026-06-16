import { applyDecorators } from "@nestjs/common";
import { Matches } from "class-validator";

export function IsBigIntString(): PropertyDecorator {
  return applyDecorators(
    Matches(/^(0|[1-9]\d*)$/, {
      message: "must be a non-negative integer encoded as a string",
    }),
  );
}

export function IsPositiveBigIntString(): PropertyDecorator {
  return applyDecorators(
    Matches(/^[1-9]\d*$/, {
      message: "must be a positive integer encoded as a string",
    }),
  );
}

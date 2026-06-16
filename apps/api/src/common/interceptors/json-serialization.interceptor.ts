import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";

type DecimalLike = {
  constructor: {
    name: string;
  };
  toString(): string;
};

@Injectable()
export class JsonSerializationInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    return next.handle().pipe(map((value) => serializeForJson(value)));
  }
}

function serializeForJson(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isDecimalLike(value)) {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeForJson(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeForJson(nested)]),
    );
  }

  return value;
}

function isDecimalLike(value: unknown): value is DecimalLike {
  return (
    value !== null &&
    typeof value === "object" &&
    "constructor" in value &&
    "toString" in value &&
    (value as DecimalLike).constructor.name === "Decimal"
  );
}

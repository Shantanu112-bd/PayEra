import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from "@nestjs/common";

import { Prisma } from "../../generated/prisma";

type ErrorResponse = {
  error: string;
  message: string;
  statusCode: number;
};

type HttpResponse = {
  status(statusCode: number): {
    json(body: ErrorResponse): void;
  };
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    const { statusCode, message } = mapPrismaError(exception);

    response.status(statusCode).json({
      error: exception.code,
      message,
      statusCode,
    });
  }
}

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): {
  message: string;
  statusCode: number;
} {
  if (error.code === "P2002") {
    return {
      message: "A record with the supplied unique value already exists",
      statusCode: HttpStatus.CONFLICT,
    };
  }

  if (error.code === "P2025") {
    return {
      message: "Record not found",
      statusCode: HttpStatus.NOT_FOUND,
    };
  }

  if (error.code === "P2003") {
    return {
      message: "A referenced record does not exist",
      statusCode: HttpStatus.BAD_REQUEST,
    };
  }

  return {
    message: "Database request failed",
    statusCode: HttpStatus.BAD_REQUEST,
  };
}

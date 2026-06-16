import type { PaginationDto } from "../dto/pagination.dto";

export function toPagination(query: PaginationDto): {
  skip: number;
  take: number;
} {
  const page = query.page;
  const take = query.limit;

  return {
    skip: (page - 1) * take,
    take,
  };
}

export interface PaginationRequest {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
}

export interface PaginationResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

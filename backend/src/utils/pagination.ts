export function parsePagination(query: {
  page?: unknown;
  pageSize?: unknown;
}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const pageSize = query.pageSize === undefined ? 10 : Number(query.pageSize);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 50
  ) {
    throw new Error("page must be a positive integer and pageSize must be between 1 and 50");
  }

  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function buildPaginationMeta(page: number, pageSize: number, total: number) {
  return {
    page: Math.min(page, Math.max(Math.ceil(total / pageSize), 1)),
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}
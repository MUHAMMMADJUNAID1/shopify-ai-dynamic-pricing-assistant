const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export function parsePagination(request: Request) {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  return {
    limit,
    cursor: url.searchParams.get("cursor"),
  };
}

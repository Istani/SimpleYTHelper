const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const DISCORD_ID = /^\d{1,32}$/;

export function parseDetailPage(searchParams = {}) {
  const requestedLimit = Number.parseInt(searchParams.limit ?? '', 10);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;
  const cursor = typeof searchParams.cursor === 'string' && DISCORD_ID.test(searchParams.cursor)
    ? searchParams.cursor
    : null;
  return { limit, cursor };
}

export function pageResult(records, limit, cursorField = 'id') {
  const hasMore = records.length > limit;
  const items = hasMore ? records.slice(0, limit) : records;
  return {
    items,
    nextCursor: hasMore ? items.at(-1)?.[cursorField] ?? null : null,
  };
}

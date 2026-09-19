import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import {
  CategoryKind,
  CodexEntryDetail,
  CodexEntrySummary,
  CodexLink,
  CodexRef,
} from '../types';

const summarySelect = {
  id: true,
  slug: true,
  kind: true,
  key: true,
  title: true,
} as const;

export async function listCodexEntries(filter: {
  kind?: CategoryKind | undefined;
}): Promise<CodexEntrySummary[]> {
  return prisma.codexEntry.findMany({
    where: filter.kind ? { kind: filter.kind } : {},
    select: summarySelect,
    orderBy: [{ kind: 'asc' }, { title: 'asc' }],
  });
}

export async function getCodexEntry(slug: string): Promise<CodexEntryDetail> {
  const entry = await prisma.codexEntry.findUnique({
    where: { slug },
    select: { ...summarySelect, summary: true, signals: true },
  });
  if (!entry) throw new NotFoundError(`Codex entry ${slug} not found`);
  return entry;
}

/**
 * Attaches titles to grader-derived refs and drops any whose entry doesn't
 * exist, so a result screen never renders a dead link. Order is preserved
 * (intended first, over-applied after).
 */
export async function resolveCodexLinks(refs: CodexRef[]): Promise<CodexLink[]> {
  if (refs.length === 0) return [];
  const rows = await prisma.codexEntry.findMany({
    where: { slug: { in: refs.map((r) => r.slug) } },
    select: { slug: true, title: true },
  });
  const titleBySlug = new Map(rows.map((r) => [r.slug, r.title]));
  return refs.flatMap((ref) => {
    const title = titleBySlug.get(ref.slug);
    return title === undefined ? [] : [{ ...ref, title }];
  });
}

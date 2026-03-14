export function normalizeTags(tags: string[]) {
  const uniqueTags = new Set<string>();

  for (const tag of tags) {
    const normalized = tag.trim();
    if (!normalized) {
      continue;
    }

    uniqueTags.add(normalized);
  }

  return [...uniqueTags];
}

export function splitTagInput(value: string) {
  return normalizeTags(value.split(/[,\n]/));
}

export function joinTags(tags: string[]) {
  return normalizeTags(tags).join(', ');
}

export const parseTagInput = splitTagInput;
export const formatTagInput = joinTags;

const DISCORD_MESSAGE_LIMIT = 1_800;

export function chunkDiscordMessage(content: string): string[] {
  if (content.length === 0) return [];

  const chunks: string[] = [];
  let currentChunk = "";

  for (const line of content.split("\n")) {
    const nextChunk = currentChunk.length === 0 ? line : `${currentChunk}\n${line}`;

    if (nextChunk.length <= DISCORD_MESSAGE_LIMIT) {
      currentChunk = nextChunk;
      continue;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = "";
    }

    if (line.length <= DISCORD_MESSAGE_LIMIT) {
      currentChunk = line;
      continue;
    }

    let start = 0;
    while (start < line.length) {
      chunks.push(line.slice(start, start + DISCORD_MESSAGE_LIMIT));
      start += DISCORD_MESSAGE_LIMIT;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

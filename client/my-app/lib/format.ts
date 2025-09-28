export const domainFromUrl = (url: string): string => {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch (error) {
    console.error("Invalid URL provided for domain parsing", { url, error });
    return url;
  }
};

export const appendChunk = (prev: string, chunk: string): string => {
  if (!prev) return chunk;
  if (!chunk) return prev;

  // Remove accidental double spaces caused by SSE chunking boundaries
  const merged = `${prev}${chunk}`;
  return merged.replace(/\s{3,}/g, "  ");
};

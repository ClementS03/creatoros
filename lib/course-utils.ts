export function isLessonAvailable(
  lesson: { drip_days: number; id?: string },
  orderCreatedAt: string,
  unlockedIds: Set<string>,
  now: Date = new Date()
): boolean {
  if (lesson.id && unlockedIds.has(lesson.id)) return true;
  if (lesson.drip_days === 0) return true;
  const unlockAt = new Date(orderCreatedAt);
  unlockAt.setDate(unlockAt.getDate() + lesson.drip_days);
  return now >= unlockAt;
}

export function parseVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}?enablejsapi=1` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}?enablejsapi=1` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

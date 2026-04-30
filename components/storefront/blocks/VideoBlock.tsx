import type { VideoData } from "@/types/blocks";
import { parseVideoUrl } from "@/lib/lp-utils";

export function VideoBlock({ data }: { data: VideoData }) {
  const embedUrl = parseVideoUrl(data.url);
  if (!embedUrl) return null;

  return (
    <section className="py-10 px-4 border-t">
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full rounded-xl border"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {data.caption && (
          <p className="text-xs text-muted-foreground text-center">{data.caption}</p>
        )}
      </div>
    </section>
  );
}

import { ShortVideo, Video } from "./types";

const get = <T = any>(obj: any, path: (string | number)[]): T | undefined =>
    path.reduce(
        (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
        obj
    );

export type WatchItem = Video | ShortVideo;

export interface ParseResult {
    items: WatchItem[];
    continuation: string | null;
}

export function parseWatchNext(data: any[]): ParseResult {
    const items: WatchItem[] = [];
    let continuation: string | null = null;

    for (const item of data) {
        /* ================= NORMAL VIDEO ================= */
        if (item.lockupViewModel) {
            const title = get<string>(item, [
                "lockupViewModel",
                "metadata",
                "lockupMetadataViewModel",
                "title",
                "content",
            ]);

            if (!title) continue;

            // Python logic:
            // if not "Mix" in title or "hindi" in title
            if (title.includes("Mix") && !title.toLowerCase().includes("hindi")) {
                continue;
            }

            const views = get<string>(item, [
                "lockupViewModel",
                "metadata",
                "lockupMetadataViewModel",
                "metadata",
                "contentMetadataViewModel",
                "metadataRows",
                1,
                "metadataParts",
                0,
                "text",
                "content",
            ]);

            if (!views || views.includes("View full playlist")) continue;

            const uploadedAgo = get<string>(item, [
                "lockupViewModel",
                "metadata",
                "lockupMetadataViewModel",
                "metadata",
                "contentMetadataViewModel",
                "metadataRows",
                1,
                "metadataParts",
                1,
                "text",
                "content",
            ]);

            // ✅ CHANNEL PHOTO (instead of channel handle)
            const channelPhoto = get<string>(item, [
                "lockupViewModel",
                "metadata",
                "lockupMetadataViewModel",
                "image",
                "decoratedAvatarViewModel",
                "avatar",
                "avatarViewModel",
                "image",
                "sources",
                0,
                "url",
            ]);

            items.push({
                type: "video",
                videoId: item.lockupViewModel.contentId,
                title,
                views,
                channel: channelPhoto,
                publishedOn: uploadedAgo
            });
        }

        /* ================= SHORTS SHELF ================= */
        if (item.reelShelfRenderer) {
            const shortsItems = item.reelShelfRenderer.items ?? [];
            const videos: Video[] = [];

            for (const s of shortsItems) {
                const videoId = get<string>(s, [
                    "shortsLockupViewModel",
                    "entityId",
                ])?.replace("shorts-shelf-item-", "");

                const title = get<string>(s, [
                    "shortsLockupViewModel",
                    "overlayMetadata",
                    "primaryText",
                    "content",
                ]);

                const views = get<string>(s, [
                    "shortsLockupViewModel",
                    "overlayMetadata",
                    "secondaryText",
                    "content",
                ]);

                if (!videoId || !title || !views) continue;

                videos.push({
                    type: "video",
                    videoId,
                    title,
                    views,
                });
            }

            // Python treats reelShelf as one entity
            if (videos.length) {
                items.push({
                    type: "shorts",
                    videoId: videos[0].videoId,
                    videos,
                });
            }
        }

        /* ================= CONTINUATION ================= */
        if (item.continuationItemRenderer) {
            continuation =
                get<string>(item, [
                    "continuationItemRenderer",
                    "continuationEndpoint",
                    "continuationCommand",
                    "token",
                ]) ?? continuation;
        }
    }

    return { items, continuation };
}


import { decode as atob } from "base-64"; // install: npm install base-64
import { Video, VideoDescription } from "../../../utils/types";
import { NativeModules } from 'react-native'
import { extractItems } from "../../CommanScreen/backends/xhmparsers/parser";
import { uncutmazaVideoSchema } from "../../CommanScreen/backends/schemas";


export function decodeLParam(url: string): string | null {
    try {
        // 1️⃣ extract 'l' parameter manually
        const query = url.split("?")[1] || "";
        const params = query.split("&").map(p => p.split("="));
        const lParam = params.find(([key]) => key === "l")?.[1];
        if (!lParam) return null;

        // 2️⃣ fix URL-safe base64 & padding
        let raw = decodeURIComponent(lParam).replace(/-/g, "+").replace(/_/g, "/");
        raw += "=".repeat((4 - (raw.length % 4)) % 4);

        // 3️⃣ decode base64 to binary string
        const decodedStr = atob(raw);

        // 4️⃣ extract URL using regex
        const match = decodedStr.match(/https?:\/\/[^\x00-\x20"']+/);
        return match ? match[0] : null;
    } catch (err) {
        console.error("Error decoding URL:", err);
        return null;
    }
}

export async function getHlsStreamVariants(
    masterUrl: string
): Promise<StreamVariant[]> {
    const response = await fetch(masterUrl);
    const text = await response.text();

    const lines = text.split("\n");
    const variants: StreamVariant[] = [];

    let currentResolution: string | undefined;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Parse resolution from EXT-X-STREAM-INF
        if (line.startsWith("#EXT-X-STREAM-INF")) {
            const resMatch = line.match(/RESOLUTION=(\d+x\d+)/);
            currentResolution = resMatch ? resMatch[1] : undefined;
            continue;
        }

        // Next non-comment line is the variant playlist URL
        if (line && !line.startsWith("#") && currentResolution) {
            const absoluteUrl = line.startsWith("http")
                ? line
                : new URL(line, masterUrl).toString();

            variants.push({
                ref: absoluteUrl,
                type: "hls",
                resolution: currentResolution,
            });

            currentResolution = undefined;
        }
    }

    return variants;
}

export function getDomainUrl(videoUrl: string): string {
    const match = videoUrl.match(/^(https?:\/\/[^\/]+)/i);
    return match ? match[1] : "";
}


async function xhamsterPlayerPage(
    mvideo: Video,
    url: string
): Promise<VideoDescription> {

    const { MyNativeModule } = NativeModules;

    const baseVideoDetails: VideoDescription = {
        title: mvideo.title,
        channelName: mvideo.channelName ?? "",
        channelPhoto: "",
        channelId: "",
        video: mvideo,
        hashTags: "",
        hlsUrl: "",
        views: 0,
        uploaded: "scrapper failed",
        subscriber: "",
        likes: "",
        dislikes: "",
        commentsCount: "00k",
        suggestedVideos: [],
    };

    let jsoboject: any;
    try {
        const jsonString = await MyNativeModule.getXhInitials(url);
        jsoboject = JSON.parse(jsonString);
    } catch {
        return baseVideoDetails;
    }



    const result = extractItems(jsoboject);
    const homepage = getDomainUrl(jsoboject.videoModel.pageURL) + "/";
    const videoHeaders: VideoHeaders = {
        Referer: homepage,
        Origin: homepage,
        "User-Agent": "Mozilla/5.0",
        Accept: "*/*",
    };

    const streamingVariants = await getHlsStreamVariants(jsoboject?.hlsUrl ?? "")
    streamingVariants.push(
        {
            type: "mp4",
            ref: jsoboject.mp4Url,
            resolution: "480p"
        }
    )


    return {
        ...baseVideoDetails,
        channelPhoto:
            jsoboject?.videoSponsor?.avatarUrl ??
            mvideo.channel ??
            "",
        channelId: jsoboject?.videoEntity?.authorId ?? "",
        hlsUrl: jsoboject?.hlsUrl ?? "",
        views: jsoboject?.videoEntity?.views ?? 0,
        uploaded: jsoboject?.videoEntity?.dateAgo ?? "",
        commentsCount: jsoboject?.videoEntity?.commentsCount ?? 0,
        suggestedVideos: result.videos,
        streamingRefrer: videoHeaders,
        streamingSources: streamingVariants
    };
}

async function handleUncustMaza(mvideo: Video, link: string): Promise<VideoDescription> {
    const { MyNativeModule } = NativeModules;

    let jsonString: string;
    const baseVideoDetails: VideoDescription = {
        title: mvideo.title,
        channelName: mvideo.channelName ?? "",
        channelPhoto: "",
        channelId: "",
        video: mvideo,
        hashTags: "",
        hlsUrl: "",
        views: 0,
        uploaded: "scrapper failed",
        subscriber: "",
        likes: "",
        dislikes: "",
        commentsCount: "00k",
        suggestedVideos: [],
    };


    try {
        jsonString = await MyNativeModule.htmlJsonBridge(
            link,
            JSON.stringify({
                ...uncutmazaVideoSchema,
                video: {
                    selector: "video#my-video",
                    attr: "src",
                    scope: "global"
                },
                series: {
                    selector: ".series-list a",
                    scope: "global",
                    multiple: true,
                    attr: "text"        // ✅ FIX
                },

                models: {
                    selector: ".model-list a",
                    scope: "global",
                    multiple: true,
                    attr: "text"        // ✅ FIX
                }
            })
        );
    } catch (e) {
        console.error("Native call failed", e);
        return baseVideoDetails;
    }

    // 1️⃣ Basic sanity check
    if (!jsonString || typeof jsonString !== "string") {
        console.warn("Invalid response:", jsonString);
        return baseVideoDetails;
    }

    // Native side returns "error: ..."
    if (jsonString.startsWith("error:") || jsonString.startsWith("http error")) {
        console.warn("Extractor error:", jsonString);
        return baseVideoDetails;
    }

    let data: any;

    // 2️⃣ Safe JSON parse
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON parse failed", jsonString);
        return baseVideoDetails;
    }

    console.log(data);




    // 3️⃣ Validate structure
    if (!data || !Array.isArray(data.items)) {
        console.warn("Invalid JSON structure:", data);
        return baseVideoDetails;
    }

    // 4️⃣ Map items → Video[]
    const videos: Video[] = [];

    for (const item of data.items) {
        if (!item?.title || !item?.thumbnail) continue;

        videos.push({
            title: String(item.title),
            thumbnail: String(item.thumbnail),
            duration: item.duration ?? "",
            publishedOn: item.uploaded ?? "",
            views: "Views Not found",
            type: "video",
            pageUrl: item.url,
            videoId: String(item.url ?? item.title),
        });
    }

    const homepage = getDomainUrl(mvideo.pageUrl ?? "") + "/";


    const videoHeaders: VideoHeaders = {
        Referer: homepage,
        Origin: homepage,
        "User-Agent": "Mozilla/5.0",
        Accept: "*/*",
    };

    const streamingVariants: StreamVariant[] = []
    streamingVariants.push(
        {
            type: "mp4",
            ref: data.globals.video,
            resolution: "HD"
        }
    )
    const tags = data.globals.series + " " + data.globals.models

    return {
        ...baseVideoDetails,
        channelPhoto: "https://uncutmaza.com.co/wp-content/uploads/2024/11/cropped-UncutMaza-32x32.png",
        channelId: "Uncutmaza",
        hlsUrl: "",
        views: 0,
        channelName: "Uncutmaza",
        uploaded: mvideo.publishedOn ?? "",
        commentsCount: "0",
        suggestedVideos: videos,
        streamingRefrer: videoHeaders,
        streamingSources: streamingVariants,
        hashTags: tags

    };
}


export async function getVideoFileUrlAndDetails(video: Video): Promise<VideoDescription> {
    console.log(video);

    const mpageUrl = decodeLParam(video.pageUrl ?? "")

    const videoDetails: VideoDescription = {
        title: video.title,
        channelName: video.channelName ?? "",
        channelPhoto: "",
        channelId: "",
        video: video,
        hashTags: "",
        hlsUrl: "",
        views: 0,
        uploaded: "scrapper failed",
        subscriber: "",
        likes: "",
        dislikes: "",
        commentsCount: "0",
    }

    if ((mpageUrl ?? "").includes("xh.partners")) {
        return await xhamsterPlayerPage(video, mpageUrl ?? "");
    }

    if (video.pageUrl?.includes("xhamster")) {
        return await xhamsterPlayerPage(video, video.pageUrl ?? "");
    }

    if (video.pageUrl?.includes("uncutmaza")) {
        return await handleUncustMaza(video, video.pageUrl);
    }

    return videoDetails

}

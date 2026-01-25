import { Video } from "../../../utils/types";
import {
    NativeModules
} from 'react-native'
import { extractItems, metaPornCatSimplifiers, metaPornSimplifiers } from "./xhmparsers/parser";
import { metaPornVideoSchema, uncutmazaVideoSchema } from "./schemas";


async function handleMetaPornFeeds(link: string): Promise<Video[]> {
    const { MyNativeModule } = NativeModules;
    const BASE_URL = "https://www.metaporn.com";

    const jsonString = await MyNativeModule.htmlJsonBridge(
        "https://www.metaporn.com/",
        JSON.stringify(metaPornVideoSchema)
    );

    const parsed = JSON.parse(jsonString);

    parsed.items = parsed.items.map((item: any) => ({
        ...item,
        href: item.href
            ? new URL(item.href, BASE_URL).toString()
            : null,
        thumbnail: item.thumbnail
            ? new URL(item.thumbnail, BASE_URL).toString()
            : null,
    }));

    return metaPornSimplifiers(JSON.stringify(parsed));
}

async function handleUncustMaza(link: string): Promise<Video[]> {
    console.log(link);

    const { MyNativeModule } = NativeModules;

    let jsonString: string;

    try {
        jsonString = await MyNativeModule.htmlJsonBridge(
            link,
            JSON.stringify(uncutmazaVideoSchema)
        );
    } catch (e) {
        console.error("Native call failed", e);
        return [];
    }

    // 1️⃣ Basic sanity check
    if (!jsonString || typeof jsonString !== "string") {
        console.warn("Invalid response:", jsonString);
        return [];
    }

    // Native side returns "error: ..."
    if (jsonString.startsWith("error:") || jsonString.startsWith("http error")) {
        console.warn("Extractor error:", jsonString);
        return [];
    }

    let data: any;

    // 2️⃣ Safe JSON parse
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON parse failed", jsonString);
        return [];
    }

    // 3️⃣ Validate structure
    if (!data || !Array.isArray(data.items)) {
        console.warn("Invalid JSON structure:", data);
        return [];
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

    return videos;
}



export async function feeds(params: string): Promise<Video[]> {
    const videos: Video[] = [];
    const { MyNativeModule } = NativeModules;

    if (params.includes("xhamster1")) {
        const jsonString = await MyNativeModule.getXhInitials(
            'https://xhamster1.desi/'
        );
        const result = extractItems(JSON.parse(jsonString));
        return result.videos
    }
    if (params.includes("metaporn")) {
        return await handleMetaPornFeeds(params)
    }

    if (params.includes("uncutmaza")) {
        return await handleUncustMaza(params);
    }

    return videos;
}


export async function nextBrowseContinuation(baseUrl: string, currentPage: number, currentCategory: string, query: string): Promise<Video[]> {
    console.log("browisng");
    const videos: Video[] = [];
    const { MyNativeModule } = NativeModules;

    if (baseUrl.includes("xhamster1")) {
        let url = '';
        if (query) {
            url = `https://xhamster1.desi/search/${encodeURIComponent(query)}?page=${currentPage}`;
        } else {
            url = `https://xhamster1.desi/${currentPage}`;
        }
        const jsonString = await MyNativeModule.getXhInitials(url);
        const result = extractItems(JSON.parse(jsonString));
        return result.videos
    }

    if (baseUrl.includes("metaporn")) {

        if (currentCategory == "") {
            return videos;
        }

    }

    if (baseUrl.includes("uncutmaza")) {
        return await handleUncustMaza(baseUrl + `${currentPage}/`);
    }

    return videos;
}


export async function searchApi(baseUrl: string, trimmed: string) {
    const { MyNativeModule } = NativeModules;
    const videos: Video[] = [];
    if (baseUrl.includes("xhamster1")) {
        const url = `https://xhamster1.desi/search/${encodeURIComponent(
            trimmed
        )}`;
        const jsonString = await MyNativeModule.getXhInitials(url);
        const result = extractItems(JSON.parse(jsonString));
        return result.videos
    }

    if (baseUrl.includes("metaporn")) {

    }
    return videos;
}


export async function categoryItems(baseUrl: string, pageNo: number) {
    const { MyNativeModule } = NativeModules;
    const videos: Video[] = [];
    if (baseUrl.includes("xhamster1")) {

    }

    if (baseUrl.includes("metaporn")) {
        const BASE_URL = "https://www.metaporn.com";
        const metaPornVideoSchema = {
            container: "div.card.sub",

            title: {
                tag: "a",
                selector: ".item-title",
                attr: "text",
            },

            thumbnail: {
                tag: "img",
                selector: ".item-image",
                attr: "src",
            },
            host: {
                tag: "a",
                selector: ".item-source",
                attr: "text",
            },

            outUrl: {
                tag: "a",
                selector: ".item-link.rate-link",
                attr: "href",
            },
        };

        console.log(pageNo);
        if (pageNo == 1) {
            const jsonString = await MyNativeModule.htmlJsonBridge(
                baseUrl,
                JSON.stringify(metaPornVideoSchema)

            );

            const parsed = JSON.parse(jsonString);

            parsed.items = parsed.items.map((item: any) => ({
                ...item,
                outUrl: item.outUrl
                    ? new URL(item.outUrl, BASE_URL).toString()
                    : null,
                thumbnail: item.thumbnail
                    ? new URL(item.thumbnail, BASE_URL).toString()
                    : null,
            }));

            return metaPornCatSimplifiers(JSON.stringify(parsed));
        } else {
            const jsonString = await MyNativeModule.htmlJsonBridge(
                baseUrl + `?page=${pageNo}`,
                JSON.stringify(metaPornVideoSchema)

            );

            const parsed = JSON.parse(jsonString);

            parsed.items = parsed.items.map((item: any) => ({
                ...item,
                outUrl: item.outUrl
                    ? new URL(item.outUrl, BASE_URL).toString()
                    : null,
                thumbnail: item.thumbnail
                    ? new URL(item.thumbnail, BASE_URL).toString()
                    : null,
            }));

            return metaPornCatSimplifiers(JSON.stringify(parsed));
        }
    }
    return videos;
}
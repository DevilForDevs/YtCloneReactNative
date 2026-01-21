import { Video } from "../../../utils/types";
import {
    NativeModules
} from 'react-native'
import { extractItems, metaPornCatSimplifiers, metaPornSimplifiers } from "./xhmparsers/parser";

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

        const BASE_URL = "https://www.metaporn.com";

        const Schema = {
            container: "div.card.group.relative.block.space-y-1",

            title: {
                tag: "a",
                selector: ".collection-title",
                attr: "text",
            },

            href: {
                tag: "a",
                selector: ".collection-title",
                attr: "href",
            },

            thumbnail: {
                tag: "img",
                selector: ".item-image",
                attr: "src",
            },
        };
        const jsonString = await MyNativeModule.htmlJsonBridge(
            "https://www.metaporn.com/",
            JSON.stringify(Schema)
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
    return videos;
}


export async function nextBrowseContinuation(baseUrl: string, currentPage: number, currentCategory: string, query: string): Promise<Video[]> {
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
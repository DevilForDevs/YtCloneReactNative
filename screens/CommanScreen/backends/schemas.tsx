export const metaPornVideoSchema = {
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

export const uncutmazaVideoSchema = {
    container: ".videos a.video",

    title: {
        selector: "h2.vtitle",
        attr: "text",
    },

    url: {
        selector: "",
        attr: "href",
    },

    thumbnail: {
        selector: "",
        attr: "data-bg",
    },

    duration: {
        selector: "span.time",
        attr: "text",
    },

    uploaded: {
        selector: "span.ago",
        attr: "text",
    },
};

export const xmazaSchema = {
    container: "article.loop-video",

    title: {
        selector: "header.entry-header span",
        attr: "text",
    },

    url: {
        selector: "a",
        attr: "href",
    },

    thumbnail: {
        selector: "img",
        attr: ["data-src", "src"],
    },

    duration: {
        selector: ".duration",
        attr: "text",
    },

    quality: {
        selector: ".hd-video",
        attr: "text",
    },

    postId: {
        selector: "article",
        attr: "data-post-id",
    },

    videoUid: {
        selector: "article",
        attr: "data-video-uid",
    },
}



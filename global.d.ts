import { ShortVideo, Video } from "./utils/types";

export { };

declare global {
    

    type SearchModelStore = {
        searchItems: Video|ShortVideo[],
        addSearchItem: (item: Video|ShortVideo[]) => void,
    }
    

    

}

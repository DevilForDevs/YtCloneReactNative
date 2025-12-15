export interface Video {
  type: "video";
  videoId: string;
  title: string;
  duration?: string;
  views: string;
  channel?: string;
  publishedOn?: string;
}

export interface VideoDescription {
  title: string,
  views: number,
  uploaded: string,
  hashTags: string,
  likes: string,
  dislikes: string,
  subscriber: string,
  commentsCount: string,
  channelPhoto: string,
  channelName: string,
  video: Video
}

export interface ShortVideo {
  type: "shorts";   // plural, consistent
  videos: Video[];  // actual parsed videos,
  videoId: string;

}

export interface SearchResponse {
  videos: (Video | ShortVideo)[];
  continuation: string | null;
}

export interface VideoStore {
  //states
  totalVideos: (Video | ShortVideo)[];
  seenVideosIds: string[];
  continuation: string;
  query: string;
  //updates
  addVideo: (item: Video | ShortVideo) => void;
  addSeenVideoId: (videoId: string) => void
  setContinuation: (continuation: string) => void;
  setQuery: (query: string) => void;
  clearVideos: () => void;
  clearSeenVideosIds: () => void;
};

export interface DownloadItem {
  video: Video;
  speed: string;
  isStopped: boolean;       // fixed typo
  isFinished: boolean;
  transferInfo: string;     // fixed typo
  message: string;
  progressPercent: number;

}

export interface DownloadStoreModel {
  totalDownloads: DownloadItem[];
  addDownloadItem: (item: DownloadItem, index: number) => void;
  updateItem: (
    videoId: string,
    updates: Partial<Pick<DownloadItem, 'speed' | 'transferInfo' | 'progressPercent' | "message">>
  ) => void;
  updateFinished: (videoId: string, isFinished: boolean) => void;
  updateStopped: (videoId: string, isStopped: boolean) => void;
}


export interface FormatGroup {
  itag: number,
  info: string,
  contentLength: number,
  url: string,

}

export interface AskFormatModel {
  title: string,
  formatGroup: FormatGroup[]
}

import { StyleSheet, Text, View, NativeModules, FlatList, ActivityIndicator, Pressable } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { extractItems, fetchM3u8Resolutions } from '../CommanScreen/backends/xhmparsers/parser';
import Player from '../VideoPlayerScreen/widgets/Player';
import { useVideoStoreForPlaylist, useVideoStoreForSearch, useVideoStoreForWatch } from '../../utils/Store';
import { Video, ShortVideo } from '../../utils/types';
import GridItem from '../CommanScreen/widgets/GridItem';
import { ListRenderItem } from 'react-native';
import { VideoDescription } from '../../utils/types';
import VideoDetails from '../VideoPlayerScreen/widgets/VideoDetails';
import { decodeLParam } from './backends/utils';


type NavigationProp = RouteProp<
    RootStackParamList,
    'CommanPlayerScreen'
>;

export default function CommanPlayerScreen() {
    const route = useRoute<NavigationProp>();
    const { arrivedVideo } = route.params;
    const { MyNativeModule } = NativeModules;
    const [mediaUrl, setMediaUrl] = useState("")
    const [endedAsScreen, setEndedAsScreen] = useState(false);
    const [showFlatList, setFlatList] = useState(true);
    const listRef = useRef<FlatList>(null);
    const onEndReachedCalledDuringMomentum = useRef(false);

    const [menuVisible, setMenuVisible] = useState(false);
    const [pageNo, setPageNo] = useState(2);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [retryCount, setRetryCount] = useState(3);
    const [isSearch, setIsSearch] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<VideoDescription>();
    const [pagingParams, setPagingParams] = useState<any>(null);


    const {
        totalVideos,
        addVideo,
        clearVideos,
        setQuery,
        query,
    } = useVideoStoreForSearch();


    function buildNextPagingParams(
        base: any,
        pageNo: number
    ) {
        if (!base) return null;

        return {
            ...base,
            page: pageNo,
            currentlyShownCount:
                (base.currentlyShownCount ?? 0) + 12,
            // ⚠️ keep this stable across pages
            viewIdForce: base.viewIdForce,
            "tabId": null,
            "tabType": "video",
            "isDesktop": true,
            "withWidget": true,
            videoId: currentVideo?.video.videoId
        };
    }


    async function loadData(mvideo: Video) {

        const jsonString = await MyNativeModule.getXhInitials(
            decodeLParam(mvideo.pageUrl ?? "")
        );
        const jsoboject = JSON.parse(jsonString);
        console.log(jsoboject);
        const result = extractItems(jsoboject);
        setMediaUrl(jsoboject.mp4Url);
        result.videos.forEach(element => {
            addVideo(element);
        });
        const paging =
            jsoboject?.relatedVideosComponent?.pagingRequestData;

        if (paging) {
            setPagingParams(paging);
        }

        setCurrentVideo({
            title: mvideo.title,
            channelName: mvideo.channelName ?? "",
            channelPhoto:
                jsoboject?.videoSponsor?.avatarUrl ??
                mvideo.channel ??
                "",
            channelId: jsoboject?.videoEntity?.authorId ?? "",
            video: mvideo,
            hashTags: "",
            hlsUrl: "",
            views: jsoboject?.videoEntity?.views ?? 0,
            uploaded: jsoboject?.videoEntity?.dateAgo ?? "",
            subscriber: "",
            likes: "",
            dislikes: "",
            commentsCount: jsoboject?.videoEntity?.commentsCount ?? 0
        });


    }


    useEffect(() => {
        loadData(arrivedVideo)
    }, []);

    const toggleFlatList = () => {

        if (showFlatList) {
            setFlatList(false)
        } else {
            setFlatList(true)
        }

    }


    async function handleItemClick(item: Video | ShortVideo) {
        if (item.type == "video") {
            setPageNo(2);
            loadData(item);
        }
    }

    const renderItem: ListRenderItem<Video | ShortVideo> = ({ item }) => {
        if (item.type === 'video') {
            return <GridItem video={item} onItemClick={() => handleItemClick(item)} />;
        }
        return null;
    };

    const nextBrowse = useCallback(async () => {
        if (isFetchingMore) return;
        if (!currentVideo || !pagingParams) return;

        try {
            setIsFetchingMore(true);

            const nextParams = buildNextPagingParams(
                pagingParams,
                pageNo
            );

            const jsonString = await MyNativeModule.getXhRelated(
                JSON.stringify(nextParams),
                currentVideo.video.pageUrl
            );

            const jsoboject = JSON.parse(jsonString);
            const result = extractItems(jsoboject);

            result.videos.forEach(addVideo);

            // 🔥 update paging data from response
            const newPaging =
                jsoboject?.relatedVideosComponent?.pagingRequestData;

            if (newPaging) {
                setPagingParams(newPaging);
            }

            setPageNo(prev => prev + 1);
            setRetryCount(0);

        } catch (e) {
            console.log("Pagination error", e);
            setRetryCount(prev => prev + 1);
        } finally {
            setIsFetchingMore(false);
        }
    }, [isFetchingMore, pagingParams, pageNo, currentVideo]);


    const renderFooter = () => {
        if (isFetchingMore) {
            return (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" />
                </View>
            );
        }

        if (retryCount >= 3) {
            return (
                <View style={styles.centerState}>
                    <Text style={styles.retryText}>Something went wrong</Text>
                    <Pressable style={styles.retryBtn} onPress={nextBrowse}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </Pressable>
                </View>
            );
        }

        return null;
    };

    async function handleProgress() {

    }


    return (
        <SafeAreaView style={styles.root}>
            <Player
                startAsScreen={endedAsScreen}
                url={mediaUrl}
                videoId={""}
                toggleFlatList={toggleFlatList}
                showMenu={() => console.log("more")}
                onProgressSave={handleProgress}
                key={"player"}   // ✅ stable
                distroyScreen={() => console.log("progressasve")}
                onToggle={(val) => console.log("progressasve")}
                videoEnded={(endedAsScreen) => {
                    setEndedAsScreen(endedAsScreen);

                }}
                pageUrl={arrivedVideo.pageUrl}
            />
            {
                showFlatList ? <FlatList
                    ref={listRef}
                    data={totalVideos}
                    numColumns={2}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={renderItem}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.contentContainer}
                    removeClippedSubviews
                    initialNumToRender={6}
                    maxToRenderPerBatch={6}
                    windowSize={7}
                    onEndReached={() => {
                        if (!onEndReachedCalledDuringMomentum.current) {
                            nextBrowse();
                            onEndReachedCalledDuringMomentum.current = true;
                        }
                    }}
                    onMomentumScrollBegin={() => {
                        onEndReachedCalledDuringMomentum.current = false;
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListHeaderComponent={
                        currentVideo ? (
                            <VideoDetails
                                videoDes={currentVideo}
                                onDownloadPress={() =>
                                    console.log("ranjan")
                                }
                                onChannelClick={() => console.log("channel click")}
                            />
                        ) : (
                            <ActivityIndicator size="large" color="red" style={{ margin: 20 }} />
                        )
                    }
                /> : <></>
            }
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    centerState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },

    retryText: {
        color: "#999",
        marginBottom: 12,
        fontSize: 14,
    },

    retryBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#ff0000", // YouTube red 😉
    },

    retryBtnText: {
        color: "#fff",
        fontWeight: "600",
    },
    columnWrapper: {
        gap: 20,
    },
    contentContainer: {
        gap: 10,
        marginHorizontal: 12,
    },

    root: {
        paddingBottom: 10
    }
})
import {
    StyleSheet,
    Text,
    View,
    Image, NativeModules, FlatList,
    ActivityIndicator, Pressable

} from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import SearchBar from './widgets/SearchBar'
import OverflowMenu from './widgets/OverflowMenu'
import GridItem from './widgets/GridItem'
import { extractItems } from './backends/xhmparsers/parser'
import { useVideoStoreForWatch } from '../../utils/Store'
import { ShortVideo, Video } from '../../utils/types'
import { ListRenderItem } from 'react-native';
import { useNavigation } from '@react-navigation/native'


export default function CommanScreen() {
    const { MyNativeModule } = NativeModules;
    const navigation = useNavigation<navStack>();


    const listRef = useRef<FlatList>(null);
    const onEndReachedCalledDuringMomentum = useRef(false);

    const [menuVisible, setMenuVisible] = useState(false);
    const [pageNo, setPageNo] = useState(1);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isSearch, setIsSearch] = useState(false);

    const {
        totalVideos,
        addVideo,
        clearVideos,
        setQuery,
        query,
    } = useVideoStoreForWatch();

    useEffect(() => {
        loadHome();
    }, []);

    const loadHome = async () => {
        try {
            const jsonString = await MyNativeModule.getXhInitials(
                'https://xhamster1.desi/'
            );
            const result = extractItems(JSON.parse(jsonString));
            result.videos.forEach(element => {
                addVideo(element)
            });
            setPageNo(2);
        } catch (e) {
            console.log('Initial load failed', e);
        }
    };


    const nextBrowse = useCallback(async () => {
        if (isFetchingMore) return;

        try {
            setIsFetchingMore(true);

            const currentPage = pageNo;
            let url = '';

            if (isSearch) {
                const trimmed = query.trim();
                if (!trimmed) return;

                url = `https://xhamster1.desi/search/${encodeURIComponent(
                    trimmed
                )}?page=${currentPage}`;
            } else {
                url = `https://xhamster1.desi/${currentPage}`;
            }

            const jsonString = await MyNativeModule.getXhInitials(url);
            const result = extractItems(JSON.parse(jsonString));

            result.videos.forEach(element => {
                addVideo(element)
            });
            setPageNo(prev => prev + 1);
            setRetryCount(0);
        } catch (e) {
            console.log('Pagination error', e);

            if (retryCount < 3) {
                setRetryCount(prev => prev + 1);
                nextBrowse();
            }
        } finally {
            setIsFetchingMore(false);
        }
    }, [isFetchingMore, isSearch, pageNo, query, retryCount]);

    /* -------------------- SEARCH -------------------- */

    const search = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        clearVideos();
        setQuery(trimmed);
        setIsSearch(true);
        setRetryCount(0);

        try {
            const url = `https://xhamster1.desi/search/${encodeURIComponent(
                trimmed
            )}`;
            const jsonString = await MyNativeModule.getXhInitials(url);
            const result = extractItems(JSON.parse(jsonString));

            result.videos.forEach(element => {
                addVideo(element)
            });
            setPageNo(2);
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
        } catch (e) {
            console.log('Search failed', e);
        }
    };

    async function handleItemClick(item: Video | ShortVideo) {
        if (item.type == "video") {
            navigation.navigate("CommanPlayerScreen", { arrivedVideo: item })
        }
    }

    const renderItem: ListRenderItem<Video | ShortVideo> = ({ item }) => {
        if (item.type === 'video') {
            return <GridItem video={item} onItemClick={() => handleItemClick(item)} />;
        }
        return null;
    };



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

    /* -------------------- UI -------------------- */

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.left}>
                    <Image
                        source={{ uri: 'https://picsum.photos/id/237/536/354' }}
                        style={styles.logo}
                    />
                    <Text style={styles.title}>CommanScreen</Text>
                </View>

                <SearchBar onSubmit={search} />

                <OverflowMenu
                    visible={menuVisible}
                    onToggle={() => setMenuVisible(v => !v)}
                    onClose={() => setMenuVisible(false)}
                    items={[
                        { label: 'Categories', onPress: () => setMenuVisible(false) },
                        { label: 'Tags', onPress: () => setMenuVisible(false) },
                    ]}
                />
            </View>

            <FlatList
                ref={listRef}
                data={totalVideos}
                numColumns={2}
                keyExtractor={item => item.videoId}
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
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
        zIndex: 10,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logo: {
        width: 28,
        height: 28,
        resizeMode: 'contain',
        marginRight: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
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
})

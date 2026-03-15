import React, { useRef, useEffect } from "react";
import {
    requireNativeComponent,
    UIManager,
    findNodeHandle,
    NativeSyntheticEvent,
} from "react-native";

// Native Component reference
const ExoPlayerViewNative = requireNativeComponent("ExoPlayerView");

interface ExoPlayerViewProps {
    videoUrl: string;
    audioUrl?: string;
    onProgress?: (value: number) => void;
    onDuration?: (value: number) => void;
    onPlaying?: (isPlaying: boolean) => void;
    style?: any;
}

const ExoPlayerView: React.FC<ExoPlayerViewProps> = ({
    videoUrl,
    audioUrl,
    onProgress,
    onDuration,
    onPlaying,
    style,
}) => {
    const ref = useRef<any>(null);

    // Commands
    const play = () => {
        UIManager.dispatchViewManagerCommand(
            findNodeHandle(ref.current),
            UIManager.getViewManagerConfig("ExoPlayerView").Commands.play,
            []
        );
    };

    const pause = () => {
        UIManager.dispatchViewManagerCommand(
            findNodeHandle(ref.current),
            UIManager.getViewManagerConfig("ExoPlayerView").Commands.pause,
            []
        );
    };

    const seek = (position: number) => {
        UIManager.dispatchViewManagerCommand(
            findNodeHandle(ref.current),
            UIManager.getViewManagerConfig("ExoPlayerView").Commands.seek,
            [position]
        );
    };

    const changeVideo = (url: string) => {
        UIManager.dispatchViewManagerCommand(
            findNodeHandle(ref.current),
            UIManager.getViewManagerConfig("ExoPlayerView").Commands.changeVideo,
            [url]
        );
    };

    // Event handlers
    const handleProgress = (event: NativeSyntheticEvent<{ value: number }>) => {
        onProgress?.(event.nativeEvent.value);
    };

    const handleDuration = (event: NativeSyntheticEvent<{ value: number }>) => {
        onDuration?.(event.nativeEvent.value);
    };

    const handlePlaying = (event: NativeSyntheticEvent<{ isPlaying: boolean }>) => {
        onPlaying?.(event.nativeEvent.isPlaying);
    };

    return (
        <ExoPlayerViewNative
            ref={ref}
            style={style}
            videoUrl={videoUrl}
            audioUrl={audioUrl}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onPlaying={handlePlaying}
        />
    );
};

export default ExoPlayerView;
export { ExoPlayerView };
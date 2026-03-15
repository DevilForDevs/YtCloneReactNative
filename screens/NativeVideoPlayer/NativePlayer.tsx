import React, { useRef } from "react";
import {
    requireNativeComponent,
} from "react-native";
import {
    ViewProps,
    NativeSyntheticEvent
} from "react-native";

interface ProgressEvent {
    value: number;
}

interface DurationEvent {
    value: number;
}

interface PlayingEvent {
    isPlaying: boolean;
}

interface ExoPlayerProps extends ViewProps {
    videoUrl?: string;
    audioUrl?: string;

    onProgress?: (e: NativeSyntheticEvent<ProgressEvent>) => void;
    onDuration?: (e: NativeSyntheticEvent<DurationEvent>) => void;
    onPlaying?: (e: NativeSyntheticEvent<PlayingEvent>) => void;
}

const ExoPlayerView =
    requireNativeComponent<ExoPlayerProps>("ExoPlayerView");

export default function ExoPlayer2() {

    const ref = useRef(null);

    return (
        <ExoPlayerView
            ref={ref}
            style={{ width: "100%", height: 250 }}
            videoUrl="https://rr8---sn-gwpa-25ud.googlevideo.com/videoplayback?expire=1773502177&ei=gSq1aYqnK8KD4dkPrYeiwQ8&ip=152.59.154.170&id=o-AB89VAOy2Rats4j6rdaLlp-fSa7wQ7dITeKyrSlMWA1H&itag=139&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&cps=590&met=1773480577%2C&mh=1a&mm=31%2C29&mn=sn-gwpa-25ud%2Csn-gwpa-25uy&ms=au%2Crdu&mv=m&mvi=8&pl=24&rms=au%2Cau&gcr=in&initcwndbps=766250&bui=AVNa5-zI5aGTMXixPV5fEEc9IMmBDJW_HgeowzfQjLtzpFDsd7BWLLew71cWhkNfduSg3uGfQ4y1KkZl&spc=6dlaFJZBtP5xgpCFSjyTDNu9UnBulg7Aw7amULh_aaSOKisSLSY&vprv=1&svpuc=1&mime=audio%2Fmp4&rqh=1&gir=yes&clen=1631851&dur=267.400&lmt=1771673200903691&mt=1773480330&fvip=4&keepalive=yes&fexp=51565116%2C51565682%2C51791334&c=ANDROID&txp=5532534&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cgcr%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Crqh%2Cgir%2Cclen%2Cdur%2Clmt&sig=AHEqNM4wRgIhAL2jI5DTHT7xlsK_c0l961b53R_KIC4fcZJou1HYhGC-AiEAgPxZFwVFsdT1L5J21z1EPXshNqWD4TELx8AA1KuEZjs%3D&lsparams=cps%2Cmet%2Cmh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Crms%2Cinitcwndbps&lsig=APaTxxMwRgIhAMLgVpSN5s6ckn3tiyZcYahgZKKPg2iL9H3FdAIHAUTEAiEAylWV8-gPs-kYoxgVdRWCPIaI5882ugD-TACJ-kH6hCQ%3D"
            audioUrl="https://rr8---sn-gwpa-25ud.googlevideo.com/videoplayback?expire=1773502177&ei=gSq1aYqnK8KD4dkPrYeiwQ8&ip=152.59.154.170&id=o-AB89VAOy2Rats4j6rdaLlp-fSa7wQ7dITeKyrSlMWA1H&itag=139&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&cps=590&met=1773480577%2C&mh=1a&mm=31%2C29&mn=sn-gwpa-25ud%2Csn-gwpa-25uy&ms=au%2Crdu&mv=m&mvi=8&pl=24&rms=au%2Cau&gcr=in&initcwndbps=766250&bui=AVNa5-zI5aGTMXixPV5fEEc9IMmBDJW_HgeowzfQjLtzpFDsd7BWLLew71cWhkNfduSg3uGfQ4y1KkZl&spc=6dlaFJZBtP5xgpCFSjyTDNu9UnBulg7Aw7amULh_aaSOKisSLSY&vprv=1&svpuc=1&mime=audio%2Fmp4&rqh=1&gir=yes&clen=1631851&dur=267.400&lmt=1771673200903691&mt=1773480330&fvip=4&keepalive=yes&fexp=51565116%2C51565682%2C51791334&c=ANDROID&txp=5532534&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cgcr%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Crqh%2Cgir%2Cclen%2Cdur%2Clmt&sig=AHEqNM4wRgIhAL2jI5DTHT7xlsK_c0l961b53R_KIC4fcZJou1HYhGC-AiEAgPxZFwVFsdT1L5J21z1EPXshNqWD4TELx8AA1KuEZjs%3D&lsparams=cps%2Cmet%2Cmh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Crms%2Cinitcwndbps&lsig=APaTxxMwRgIhAMLgVpSN5s6ckn3tiyZcYahgZKKPg2iL9H3FdAIHAUTEAiEAylWV8-gPs-kYoxgVdRWCPIaI5882ugD-TACJ-kH6hCQ%3D"
            onProgress={(e) => console.log(e.nativeEvent.value)}
            onDuration={(e) => console.log(e.nativeEvent.value)}
            onPlaying={(e) => console.log(e.nativeEvent.isPlaying)}
        />
    );
}
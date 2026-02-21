import { StyleSheet } from 'react-native'
import React, { useRef } from 'react'
import WebView from 'react-native-webview';

type WebViewRncProps = {
    uri: string;
    injectedJs?: string;
    onData: (data: any) => void;
    onError: (err: any) => void;
};

export default function WebViewRnc(props: WebViewRncProps) {
    const webRef = useRef<WebView>(null);
    return (
        <WebView
            ref={webRef}
            source={{ uri: props.uri }}
            javaScriptEnabled
            domStorageEnabled
            injectedJavaScript={props.injectedJs}
            onMessage={(event) => {
                try {
                    const parsed = JSON.parse(event.nativeEvent.data);
                    props.onData(parsed) ?? "";
                } catch (err) {
                    props.onError(String(event.nativeEvent.data))
                }
            }}
        />
    )
}

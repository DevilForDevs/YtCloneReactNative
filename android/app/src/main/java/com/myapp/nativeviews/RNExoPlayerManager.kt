package com.myapp.nativeviews

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class RNExoPlayerManager : SimpleViewManager<RNExoPlayerView>() {
    override fun getName(): String = "RNExoPlayer"

    override fun createViewInstance(reactContext: ThemedReactContext): RNExoPlayerView = RNExoPlayerView(reactContext)

    @ReactProp(name = "source")
    fun setSource(
        view: RNExoPlayerView,
        source: ReadableMap,
    ) {
        val uri = source.getString("uri") ?: return
        val headers = mutableMapOf<String, String>()

        if (source.hasKey("headers")) {
            val headersMap = source.getMap("headers")
            val iterator = headersMap?.keySetIterator()

            if (iterator != null) {
                while (iterator.hasNextKey()) {
                    val key = iterator.nextKey()
                    headers[key] = headersMap.getString(key) ?: ""
                }
            }
        }

        view.setSource(uri, headers)
    }

    @ReactProp(name = "paused", defaultBoolean = false)
    fun setPaused(
        view: RNExoPlayerView,
        paused: Boolean,
    ) {
        view.setPaused(paused)
    }

    @ReactProp(name = "resizeMode")
    fun setResizeMode(
        view: RNExoPlayerView,
        mode: String,
    ) {
        view.setResizeMode(mode)
    }

    @ReactProp(name = "poster")
    fun setPoster(
        view: RNExoPlayerView,
        poster: String?,
    ) {
        view.setPoster(poster)
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
        mapOf(
            "onProgress" to mapOf("registrationName" to "onProgress"),
            "onEnd" to mapOf("registrationName" to "onEnd"),
            "onError" to mapOf("registrationName" to "onError"),
        )
}

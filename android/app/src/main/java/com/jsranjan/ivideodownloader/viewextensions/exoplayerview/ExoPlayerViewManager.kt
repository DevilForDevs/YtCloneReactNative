package com.jsranjan.ivideodownloader.viewextensions.exoplayerview

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.jsranjan.ivideodownloader.viewextensions.exoplayerview.ExoPlayerView

class ExoPlayerViewManager(
    private val reactContext: ReactApplicationContext,
) : SimpleViewManager<ExoPlayerView>() {
    override fun getName(): String = "ExoPlayerView"

    override fun createViewInstance(context: ThemedReactContext): ExoPlayerView {
        val view = ExoPlayerView(context)

        view.onProgress = { position ->
            sendEvent(context, view.id, "onProgress", position)
        }

        view.onDurationLoaded = { duration ->
            sendEvent(context, view.id, "onDuration", duration)
        }

        view.isPlaying = { playing ->
            val map = Arguments.createMap()
            map.putBoolean("isPlaying", playing)

            context
                .getJSModule(RCTEventEmitter::class.java)
                .receiveEvent(view.id, "onPlaying", map)
        }

        return view
    }

    // ---------- PROPS ----------

    @ReactProp(name = "videoUrl")
    fun setVideoAndAudio(
        view: ExoPlayerView,
        videoUrl: String,
        audioUrl: String,
    ) {
        view.setVideoAndAudio(videoUrl, audioUrl)
    }

    // ---------- COMMANDS ----------

    override fun getCommandsMap(): Map<String, Int> =
        MapBuilder.of(
            "play",
            1,
            "pause",
            2,
            "seek",
            3,
            "changeVideo",
            4,
        )

    override fun receiveCommand(
        view: ExoPlayerView,
        commandId: Int,
        args: ReadableArray?,
    ) {
        when (commandId) {
            1 -> {
                view.play()
            }

            2 -> {
                view.pause()
            }

            3 -> {
                val position = args?.getDouble(0)?.toLong() ?: 0
                view.seekTo(position)
            }

            4 -> {
                val url = args?.getString(0) ?: return
                view.changeVideo(url)
            }
        }
    }

    // ---------- EVENTS ----------

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
        MapBuilder
            .builder<String, Any>()
            .put("onProgress", MapBuilder.of("registrationName", "onProgress"))
            .put("onDuration", MapBuilder.of("registrationName", "onDuration"))
            .put("onPlaying", MapBuilder.of("registrationName", "onPlaying"))
            .build()

    private fun sendEvent(
        context: ReactContext,
        viewId: Int,
        eventName: String,
        value: Long,
    ) {
        val map = Arguments.createMap()
        map.putDouble("value", value.toDouble())

        context
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(viewId, eventName, map)
    }

    // ---------- CLEANUP ----------

    override fun onDropViewInstance(view: ExoPlayerView) {
        super.onDropViewInstance(view)
        view.release()
    }
}

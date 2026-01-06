package com.myapp

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.myapp.extractors.youtube.FeedRouter
import com.myapp.extractors.youtube.NativeFileDownloader
import com.myapp.extractors.youtube.RelatedShortsFetcher
import com.myapp.extractors.youtube.ShortMetaFetcher
import com.myapp.extractors.youtube.YtInitialDataFetcher
import com.myapp.extractors.youtube.YtPlaylistBrowseFetcher
import com.myapp.extractors.youtube.YtSearchFetcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@ReactModule(name = MyNativeModule.NAME)
class MyNativeModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "MyNativeModule"
    }

    val backThread = CoroutineScope(Dispatchers.IO)

    @ReactMethod
    fun fetchFeed(
        videoId: String?,
        continuation: String?,
        visitorData: String,
        promise: Promise,
    ) {
        backThread.launch {
            try {
                val result =
                    FeedRouter.fetch(
                        videoId = videoId,
                        continuation = continuation,
                        visitorData = visitorData,
                    )

                promise.resolve(result.toString())
            } catch (e: Exception) {
                promise.reject("ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getShortMeta(
        videoId: String,
        promise: Promise,
    ) {
        backThread.launch {
            try {
                val result = ShortMetaFetcher.fetch(videoId)
                promise.resolve(result.toString())
            } catch (e: Exception) {
                promise.reject("ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getRelatedShortVideoIds(
        videoId: String,
        promise: Promise,
    ) {
        backThread.launch {
            try {
                val result = RelatedShortsFetcher.fetch(videoId)
                promise.resolve(result.toString())
            } catch (e: Exception) {
                promise.reject("ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getYtInitialData(
        watchUrl: String,
        promise: Promise,
    ) {
        backThread.launch(Dispatchers.IO) {
            try {
                val result = YtInitialDataFetcher.fetch(watchUrl)
                promise.resolve(result.toString())
            } catch (e: Exception) {
                promise.reject("ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getYtPlaylistBrowse(
        key: String, // "browseId" or "continuation"
        value: String, // VL... or continuation token
        paras: String?, // optional "params"
        promise: Promise,
    ) {
        backThread.launch(Dispatchers.IO) {
            try {
                // Pass paras to the fetcher (it handles null automatically)
                val result = YtPlaylistBrowseFetcher.fetch(key, value, paras)
                promise.resolve(result) // ALWAYS returns a string
            } catch (e: Exception) {
                // Failsafe: should never happen
                promise.resolve(
                    """{"error":"bridge_exception","message":"${e.message}"}""",
                )
            }
        }
    }

    @ReactMethod
    fun searchYoutube(
        query: String,
        continuation: String?,
        params: String?,
        promise: Promise,
    ) {
        backThread.launch(Dispatchers.IO) {
            try {
                val result =
                    YtSearchFetcher.fetch(
                        query = query,
                        continuation = continuation,
                        params = params,
                    )

                promise.resolve(result) // ✅ raw string
            } catch (e: Exception) {
                promise.reject("ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun native_fileDownloader(
        videoInformation: String,
        audioInformation: String,
        videoId: String,
        fileName: String,
    ) {
        backThread.launch {
            val downloader =
                NativeFileDownloader(reactContext) { id, progress, percent, speed, message ->
                    backThread.launch(Dispatchers.Main) {
                        sendProgressUpdate(id, progress, percent, speed, message)
                    }
                }

            downloader.download(
                videoInformation,
                audioInformation,
                videoId,
                fileName,
            )
        }
    }

    private fun sendProgressUpdate(
        videoId: String,
        progress: String,
        percent: Int,
        speed: String,
        message: String,
    ) {
        val params =
            Arguments.createMap().apply {
                putString("videoId", videoId)
                putString("progress", progress)
                putInt("percent", percent)
                putString("speed", speed)
                putString("message", message)
            }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("DownloadProgress", params)
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun addListener(eventName: String?) {
        // Required for RN >= 0.65
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN >= 0.65
    }
}

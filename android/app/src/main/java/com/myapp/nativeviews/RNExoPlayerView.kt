package com.myapp.nativeviews

import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.widget.FrameLayout
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.myapp.R
import java.net.URL
import kotlin.concurrent.thread

class RNExoPlayerView(
    private val reactContext: ThemedReactContext,
) : FrameLayout(reactContext) {
    private val player: ExoPlayer
    private val playerView: PlayerView
    private val progressHandler = Handler(Looper.getMainLooper())

    init {
        LayoutInflater.from(context).inflate(R.layout.view_exoplayer, this, true)
        playerView = findViewById(R.id.playerView)

        player = ExoPlayer.Builder(context).build()
        playerView.player = player
        playerView.controllerAutoShow = true
        playerView.controllerHideOnTouch = true
        playerView.layoutParams =
            LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT,
            )

        player.addListener(
            object : Player.Listener {
                override fun onPlaybackStateChanged(state: Int) {
                    if (state == Player.STATE_ENDED) {
                        // Send onEnd event to JS
                        val event = Arguments.createMap()
                        reactContext
                            .getJSModule(RCTEventEmitter::class.java)
                            .receiveEvent(id, "onEnd", event)
                    }
                }

                override fun onPlayerError(error: PlaybackException) {
                    val map = Arguments.createMap()
                    map.putString("errorString", error.message)
                    reactContext
                        .getJSModule(RCTEventEmitter::class.java)
                        .receiveEvent(id, "onError", map)
                }
            },
        )
    }

    fun setSource(
        url: String,
        headers: Map<String, String>,
    ) {
        val dataSourceFactory =
            DefaultHttpDataSource
                .Factory()
                .setDefaultRequestProperties(headers)

        val mediaSource =
            ProgressiveMediaSource
                .Factory(dataSourceFactory)
                .createMediaSource(MediaItem.fromUri(Uri.parse(url)))

        player.setMediaSource(mediaSource)
        player.prepare()
        progressHandler.post(progressRunnable)
    }

    fun setPaused(paused: Boolean) {
        player.playWhenReady = !paused
    }

    fun setResizeMode(mode: String) {
        playerView.resizeMode =
            when (mode) {
                "contain" -> AspectRatioFrameLayout.RESIZE_MODE_FIT
                "cover" -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                "stretch" -> AspectRatioFrameLayout.RESIZE_MODE_FILL
                else -> AspectRatioFrameLayout.RESIZE_MODE_FIT
            }
    }

    fun setPoster(url: String?) {
        if (url.isNullOrEmpty()) return
        thread {
            try {
                val bitmap = BitmapFactory.decodeStream(URL(url).openStream())
                post {
                    playerView.defaultArtwork = BitmapDrawable(resources, bitmap)
                }
            } catch (_: Exception) {
            }
        }
    }

    fun releasePlayer() {
        progressHandler.removeCallbacks(progressRunnable)
        player.release()
    }

    private val progressRunnable =
        object : Runnable {
            override fun run() {
                if (player.isPlaying) {
                    val event =
                        Arguments.createMap().apply {
                            putDouble("currentTime", player.currentPosition / 1000.0)
                            putDouble("playableDuration", player.bufferedPosition / 1000.0)
                            putDouble("duration", player.duration / 1000.0)
                        }
                    reactContext
                        .getJSModule(RCTEventEmitter::class.java)
                        .receiveEvent(id, "onProgress", event)
                }
                progressHandler.postDelayed(this, 250)
            }
        }
}

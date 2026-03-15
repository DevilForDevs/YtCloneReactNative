package com.jsranjan.ivideodownloader.viewextensions.exoplayerview

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.widget.FrameLayout
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.source.MergingMediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import androidx.media3.ui.PlayerView

class ExoPlayerView(
    context: Context,
) : FrameLayout(context) {
    private val player: ExoPlayer
    private val playerView: PlayerView
    private val dataSourceFactory = DefaultDataSource.Factory(context)

    private var audioSource: MediaSource? = null
    private var currentAudioUrl: String? = null

    private val handler = Handler(Looper.getMainLooper())
    var onProgress: ((Long) -> Unit)? = null
    var onDurationLoaded: ((Long) -> Unit)? = null

    var isPlaying: ((Boolean) -> Unit)? = null

    private val progressRunnable =
        object : Runnable {
            override fun run() {
                val position = player.currentPosition
                onProgress?.invoke(position)

                handler.postDelayed(this, 500)
            }
        }

    init {

        player = ExoPlayer.Builder(context).build()

        playerView =
            PlayerView(context).apply {
                player = this@ExoPlayerView.player
                useController = false
            }

        addView(
            playerView,
            LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT,
            ),
        )

        player.addListener(
            object : Player.Listener {
                override fun onPlaybackStateChanged(state: Int) {
                    when (state) {
                        Player.STATE_BUFFERING -> {
                            isPlaying?.invoke(false)
                        }

                        Player.STATE_READY -> {
                            isPlaying?.invoke(true)

                            val duration = player.duration
                            if (duration > 0) {
                                onDurationLoaded?.invoke(duration)
                            }

                            handler.post(progressRunnable)
                        }

                        Player.STATE_ENDED -> {
                            handler.removeCallbacks(progressRunnable)
                        }

                        Player.STATE_IDLE -> {
                        }
                    }
                }

                override fun onPlayerError(error: PlaybackException) {
                    error.printStackTrace()
                }
            },
        )
    }

    // Initial load
    @OptIn(UnstableApi::class)
    fun setVideoAndAudio(
        videoUrl: String,
        audioUrl: String,
    ) {
        currentAudioUrl = audioUrl

        val videoSource =
            ProgressiveMediaSource
                .Factory(dataSourceFactory)
                .createMediaSource(MediaItem.fromUri(videoUrl))

        audioSource =
            ProgressiveMediaSource
                .Factory(dataSourceFactory)
                .createMediaSource(MediaItem.fromUri(audioUrl))

        val mergedSource = MergingMediaSource(videoSource, audioSource!!)

        player.setMediaSource(mergedSource)
        player.prepare()
        player.play()
    }

    // Change ONLY video quality
    @OptIn(UnstableApi::class)
    fun changeVideo(videoUrl: String) {
        val audio = audioSource ?: return
        val position = player.currentPosition

        val videoSource =
            ProgressiveMediaSource
                .Factory(dataSourceFactory)
                .createMediaSource(MediaItem.fromUri(videoUrl))

        val mergedSource = MergingMediaSource(videoSource, audio)

        player.setMediaSource(mergedSource)
        player.prepare()
        player.seekTo(position)
        player.play()
    }

    fun play() {
        player.play()
    }

    fun pause() {
        player.pause()
    }

    fun togglePlayPause() {
        if (player.isPlaying) player.pause() else player.play()
    }

    fun seekTo(position: Long) {
        player.seekTo(position)
    }

    fun release() {
        handler.removeCallbacks(progressRunnable)
        player.release()
    }
}

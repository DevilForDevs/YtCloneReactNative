package com.myapp

import android.content.Intent
import android.os.Environment
import androidx.core.net.toUri
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.module.annotations.ReactModule
import org.ytmuxer.mpfour.DashedParser
import org.ytmuxer.mpfour.DashedWriter
import org.ytmuxer.webm.WebMParser
import org.ytmuxer.webm.WebmMuxer
import java.io.File
import kotlin.math.roundToInt
import kotlin.text.startsWith
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import android.media.MediaScannerConnection
import android.net.Uri
import android.content.Context
import java.io.FileOutputStream
import java.io.FileInputStream
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import org.json.JSONObject
import android.util.Log



@ReactModule(name = MyNativeModule.NAME)
class MyNativeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "MyNativeModule"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun native_fileDownloader(
        videoInformation: String,
        audioInformation: String,
        videoId: String,
        fileName: String
    ) {
        val backThread = CoroutineScope(Dispatchers.IO)

        backThread.launch {
            val video = JSONObject(videoInformation)
            val audio = JSONObject(audioInformation)

            if (audioInformation == videoInformation) {
                val musicDir =
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC)
                val destinationFile = File(musicDir, "$fileName.mp3")
                val fos = FileOutputStream(destinationFile, destinationFile.exists())

                djDownloader(
                    audio.getString("url"),
                    fos,
                    if (destinationFile.exists()) destinationFile.length() else 0L,
                    audio.getInt("contentLength").toLong()
                ) { progress, percent, speed ->
                    backThread.launch(Dispatchers.Main) {
                        sendProgressUpdate(videoId, progress, percent, speed, "$percent%")
                    }
                }

                MediaScannerConnection.scanFile(
                    reactContext,
                    arrayOf(destinationFile.absolutePath),
                    null,
                    null
                )

            } else {
                val audioTempFile = File(reactContext.filesDir, "$videoId.mp3")
                val videoTempFile = File(reactContext.filesDir, "$videoId(${video.getString("info")}).mp4")

                val videoFos = FileOutputStream(videoTempFile, videoTempFile.exists())

                djDownloader(
                    video.getString("url"),
                    videoFos,
                    if (videoTempFile.exists()) videoTempFile.length() else 0L,
                    video.getInt("contentLength").toLong()
                ) { progress, percent, speed ->
                    backThread.launch(Dispatchers.Main) {
                        sendProgressUpdate(videoId, progress, percent, speed, "$percent%")
                    }
                }

                val audioFos = FileOutputStream(audioTempFile, audioTempFile.exists())

                djDownloader(
                    audio.getString("url"),
                    audioFos,
                    if (audioTempFile.exists()) audioTempFile.length() else 0L,
                    audio.getInt("contentLength").toLong()
                ) { progress, percent, speed ->
                    backThread.launch(Dispatchers.Main) {
                        sendProgressUpdate(videoId, progress, percent, speed, "$percent% Audio")
                    }
                }

                

                FileOutputStream(videoTempFile, true).use { output ->
                      FileInputStream(audioTempFile).use { input ->
                      input.copyTo(output)
                    }
                }

                val videoLength = videoTempFile.length() - audioTempFile.length() // original video size

                val movieDir =
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
                val outputFile = File(movieDir, "$fileName(${video.getString("info")}).mp4")

                val raf= RandomAccessFile(videoTempFile,"r")

                if (videoInformation.contains("webm")) {

                      val videoParser = WebMParser(raf, false, 0, videoLength)
                      videoParser.parse()

                       val audioParser = WebMParser(raf, false, videoLength, videoTempFile.length())
                      audioParser.parse()

                       val finalVideoFile =
                        File(movieDir, "$fileName(${video.getString("info")}).mp4")

                        backThread.launch(Dispatchers.Main) {
                          sendProgressUpdate(videoId, "Copying Samples", 50, "500KB/s", "Merging")
                       } 

                       val writter = WebmMuxer(
                        finalVideoFile,
                        listOf(videoParser, audioParser),
                        progress = {samples,percent->

                            backThread.launch(Dispatchers.Main) {
                                sendProgressUpdate(videoId,samples, percent, "500KB/s", "Merging")
                            }

                            if (samples == "Finished") {

                                backThread.launch(Dispatchers.Main) {
                                  sendProgressUpdate(videoId,"${convertBytes2(outputFile.length())}", 100, "500KB/s", "Video")
                                }

                                audioTempFile.delete()
                                videoTempFile.delete()
                                MediaScannerConnection.scanFile(
                                    reactContext,
                                    arrayOf(finalVideoFile.absolutePath),
                                    null,
                                    null
                                )
                            }
                        }
                    )
                    writter.writeSegment()

                } else {
                    
                      val videoParser = DashedParser(raf, false, 0, videoLength)
                      videoParser.parse()

                      val audioParser = DashedParser(raf, false, videoLength, videoTempFile.length())
                      audioParser.parse()

                    val finalVideoFile =
                        File(movieDir, "$fileName(${video.getString("info")}).mp4")

                    backThread.launch(Dispatchers.Main) {
                        sendProgressUpdate(videoId, "Copying Samples", 50, "500KB/s", "Merging")
                    }    

                    val writter = DashedWriter(
                        finalVideoFile,
                        listOf(videoParser, audioParser),
                        progress = {samples,percent->

                            backThread.launch(Dispatchers.Main) {
                                sendProgressUpdate(videoId,samples, percent, "500KB/s", "Merging")
                            }

                            if (samples == "Finished") {

                                backThread.launch(Dispatchers.Main) {
                                  sendProgressUpdate(videoId,"${convertBytes2(outputFile.length())}", 100, "500KB/s", "Video")
                                }

                                audioTempFile.delete()
                                videoTempFile.delete()
                                MediaScannerConnection.scanFile(
                                    reactContext,
                                    arrayOf(finalVideoFile.absolutePath),
                                    null,
                                    null
                                )
                            }
                        }
                    )
                    writter.buildNonFMp4()
                }
            }
        }
    }

    private fun sendProgressUpdate(
        videoId: String,
        progress: String,
        percent: Int,
        speed: String,
        message: String
    ) {
        val params = Arguments.createMap().apply {
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

    @ReactMethod
    fun addListener(eventName: String?) {
        // Required for RN >= 0.65
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN >= 0.65
    }
}

fun djDownloader( url: String,
                  fos: FileOutputStream,
                  onDisk: Long,
                  totalBytes: Long,
                  progress: (dbyt: String, percent: Int, speed: String) -> Unit){
    val dclient= OkHttpClient()
    val chunkSize = 9437184L  // 9MB
    val start = onDisk
    val end = minOf(start + chunkSize - 1, totalBytes - 1)

    val request = Request.Builder()
        .url(url)
        .addHeader("Range", "bytes=$start-$end")
        .build()

    val response = dclient.newCall(request).execute()

    if (response.code == 206) {
        response.body!!.byteStream().use { inputStream ->
            val buffer = ByteArray(1024)
            var bytesRead: Int

            var downloadedInChunk = 0L
            var speedBytes = 0L
            var lastTime = System.currentTimeMillis()

            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                fos.write(buffer, 0, bytesRead)
                downloadedInChunk += bytesRead
                speedBytes += bytesRead

                val currentDownloaded = onDisk + downloadedInChunk
                val percent = ((currentDownloaded * 100) / totalBytes).toInt()
                val now = System.currentTimeMillis()

                if (now - lastTime >= 1000) {
                    val speedText = convertSpeed(speedBytes)
                    val pg = "${convertBytes2(currentDownloaded)}/${convertBytes2(totalBytes)}"
                    progress(pg, percent, speedText)
                    speedBytes = 0
                    lastTime = now
                }
            }

            // Final update after chunk
            val finalDownloaded = onDisk + downloadedInChunk
            val pg = "${convertBytes2(finalDownloaded)}/${convertBytes2(totalBytes)}"
            val percent = ((finalDownloaded * 100) / totalBytes).toInt()
            progress(pg, percent, convertSpeed(speedBytes))

            if (finalDownloaded < totalBytes) {
                djDownloader(url, fos, finalDownloaded, totalBytes, progress)
            }
        }
    } else {
        println("HTTP error: Expected 206 Partial Content, got ${response.code}")
    }

}
fun convertBytes2(sizeInBytes: Long): String {
    val kilobyte = 1024
    val megabyte = kilobyte * 1024
    val gigabyte = megabyte * 1024

    return when {
        sizeInBytes >= gigabyte -> "${(sizeInBytes.toDouble() / gigabyte).roundToInt()} GB"
        sizeInBytes >= megabyte -> "${(sizeInBytes.toDouble() / megabyte).roundToInt()} MB"
        sizeInBytes >= kilobyte -> "${(sizeInBytes.toDouble() / kilobyte).roundToInt()} KB"
        else -> "$sizeInBytes Bytes"
    }
}
fun convertSpeed(bytesPerSec: Long): String {
    val kilobyte = 1024.0
    val megabyte = kilobyte * 1024
    val gigabyte = megabyte * 1024

    return when {
        bytesPerSec >= gigabyte -> "${(bytesPerSec / gigabyte).roundToInt()} GB/s"
        bytesPerSec >= megabyte -> "${(bytesPerSec / megabyte).roundToInt()} MB/s"
        bytesPerSec >= kilobyte -> "${(bytesPerSec / kilobyte).roundToInt()} KB/s"
        else -> "$bytesPerSec B/s"
    }
}




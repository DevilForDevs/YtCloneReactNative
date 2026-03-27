package com.jsranjan.ivideodownloader.extractors.youtube

import android.content.Context
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object WatchNextBrowse {
    private const val PREF_NAME = "yt_config"
    private const val KEY_CLIENT_VERSION = "client_version"
    private const val KEY_LAST_UPDATE = "last_update"

    private const val DEFAULT_VERSION = "2.20260324.05.00"

    private const val USER_AGENT =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/143.0.0.0"

    private val httpClient =
        OkHttpClient
            .Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

    // -------------------- PUBLIC --------------------

    fun fetch(
        context: Context,
        videoId: String,
        continuation: String?,
        visitorData: String,
    ): JSONObject {
        var clientVersion = getStoredVersion(context)
        println("client_verison")
        println(clientVersion)

        try {
            return makeRequest(videoId, continuation, visitorData, clientVersion)
        } catch (e: Exception) {
            // 🔁 Retry on failure (429 / 400)
            if (e.message?.contains("429") == true || e.message?.contains("400") == true) {
                val newVersion = fetchLatestClientVersion() ?: DEFAULT_VERSION
                saveVersion(context, newVersion)

                // small delay (rate-limit protection)
                Thread.sleep(500)

                return makeRequest(videoId, continuation, visitorData, newVersion)
            }

            throw e
        }
    }

    // -------------------- CORE REQUEST --------------------

    private fun makeRequest(
        videoId: String,
        continuation: String?,
        visitorData: String,
        clientVersion: String,
    ): JSONObject {
        val body =
            mutableMapOf<String, Any>(
                "context" to
                    mapOf(
                        "client" to
                            mapOf(
                                "hl" to "en",
                                "gl" to "IN",
                                "clientName" to "WEB",
                                "clientVersion" to clientVersion,
                                "platform" to "DESKTOP",
                                "osName" to "Windows",
                                "osVersion" to "10.0",
                                "timeZone" to "Asia/Calcutta",
                                "userAgent" to USER_AGENT,
                                "visitorData" to visitorData,
                            ),
                    ),
                "videoId" to videoId,
            )

        if (continuation != null) {
            body["continuation"] = continuation
        }

        val json = JSONObject(body).toString()

        val request =
            Request
                .Builder()
                .url("https://www.youtube.com/youtubei/v1/next?prettyPrint=false")
                .post(json.toRequestBody("application/json; charset=utf-8".toMediaType()))
                .addHeader("content-type", "application/json")
                .addHeader("origin", "https://www.youtube.com")
                .addHeader("referer", "https://www.youtube.com/watch?v=$videoId")
                .addHeader("user-agent", USER_AGENT)
                .addHeader("x-youtube-client-name", "1")
                .addHeader("x-youtube-client-version", clientVersion)
                .addHeader("x-youtube-bootstrap-logged-in", "false")
                .addHeader("x-goog-visitor-id", visitorData)
                .build()

        httpClient.newCall(request).execute().use { response ->

            val bodyStr = response.body?.string() ?: "{}"

            if (!response.isSuccessful) {
                throw Exception("HTTP ${response.code}")
            }

            val jsonObj = JSONObject(bodyStr)

            // ⚠️ Detect silent failure (invalid client version)
            if (!jsonObj.has("contents") && continuation == null) {
                throw Exception("Invalid response (possible outdated client)")
            }

            return jsonObj
        }
    }

    // -------------------- VERSION MANAGEMENT --------------------

    private fun getStoredVersion(context: Context): String {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_CLIENT_VERSION, DEFAULT_VERSION) ?: DEFAULT_VERSION
    }

    private fun saveVersion(
        context: Context,
        version: String,
    ) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs
            .edit()
            .putString(KEY_CLIENT_VERSION, version)
            .putLong(KEY_LAST_UPDATE, System.currentTimeMillis())
            .apply()
    }

    // -------------------- FETCH LATEST VERSION --------------------

    private fun fetchLatestClientVersion(): String? {
        return try {
            val request =
                Request
                    .Builder()
                    .url("https://www.youtube.com/sw.js")
                    .addHeader("user-agent", USER_AGENT)
                    .build()

            httpClient.newCall(request).execute().use { response ->
                val js = response.body?.string() ?: return null

                val regex = """"clientVersion":"(.*?)"""".toRegex()
                regex.find(js)?.groupValues?.get(1)
            }
        } catch (e: Exception) {
            null
        }
    }
}

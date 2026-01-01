package com.myapp.extractors.youtube

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

object ShortMetaFetcher {

    private val client by lazy { OkHttpClient() }

    @Throws(Exception::class)
    fun fetch(videoId: String): JSONObject {
        val url = "https://www.youtube.com/shorts/$videoId"

        val request =
            Request.Builder()
                .url(url)
                .get()
                .header("User-Agent", "Mozilla/5.0")
                .header("Accept", "text/html")
                .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) {
            throw Exception("HTTP ${response.code}")
        }

        val html = response.body?.string() ?: throw Exception("Empty response")

        val initialData = extractInitialData(html)
        return parseShortMeta(videoId, initialData)
    }

    // -------------------- helpers --------------------

    private fun extractInitialData(html: String): JSONObject {
        val regex =
            Regex(
                """ytInitialData\s*=\s*(\{.*?\});""",
                setOf(RegexOption.DOT_MATCHES_ALL),
            )

        val match =
            regex.find(html)
                ?: throw Exception("ytInitialData not found")

        return JSONObject(match.groupValues[1])
    }

    private fun parseShortMeta(
        videoId: String,
        json: JSONObject,
    ): JSONObject {
        val panels = json.getJSONArray("engagementPanels")

        val commentsCount =
            panels
                .getJSONObject(0)
                .getJSONObject("engagementPanelSectionListRenderer")
                .getJSONObject("header")
                .getJSONObject("engagementPanelTitleHeaderRenderer")
                .getJSONObject("contextualInfo")
                .getJSONArray("runs")
                .getJSONObject(0)
                .getString("text")

        val header =
            panels
                .getJSONObject(1)
                .getJSONObject("engagementPanelSectionListRenderer")
                .getJSONObject("content")
                .getJSONObject("structuredDescriptionContentRenderer")
                .getJSONArray("items")
                .getJSONObject(0)
                .getJSONObject("videoDescriptionHeaderRenderer")

        val title =
            header
                .getJSONObject("title")
                .getJSONArray("runs")
                .getJSONObject(0)
                .getString("text")

        val likes =
            header
                .getJSONArray("factoid")
                .getJSONObject(0)
                .getJSONObject("factoidRenderer")
                .getJSONObject("value")
                .getString("simpleText")

        val channelName =
            header
                .getJSONObject("channel")
                .getString("simpleText")

        val channelThumbnail =
            header
                .getJSONObject("channelThumbnail")
                .getJSONArray("thumbnails")
                .getJSONObject(0)
                .getString("url")

        val canonicalUrl =
            header
                .getJSONObject("channelNavigationEndpoint")
                .getJSONObject("commandMetadata")
                .getJSONObject("webCommandMetadata")
                .getString("url")

        return JSONObject().apply {
            put("videoId", videoId)
            put("title", title)
            put("likes", likes)
            put("comments", commentsCount)
            put("channelName", channelName)
            put("channelThumbnail", channelThumbnail)
            put("canonicalUrl", canonicalUrl)
        }
    }
}

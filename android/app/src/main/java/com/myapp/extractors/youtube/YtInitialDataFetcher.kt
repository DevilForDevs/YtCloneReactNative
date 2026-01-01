package com.myapp.extractors.youtube

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject

object YtInitialDataFetcher {

    private val client by lazy { OkHttpClient() }

    private val regex1 =
        Regex("""ytInitialData"\]\s*=\s*(\{.*?\});""", RegexOption.DOT_MATCHES_ALL)
    private val regex2 =
        Regex("""ytInitialData\s*=\s*(\{.*?\});""", RegexOption.DOT_MATCHES_ALL)

    @Throws(Exception::class)
    fun fetch(watchUrl: String): JSONObject {
        val html = fetchHtml(watchUrl)
        val root = extractInitialData(html)

        return buildFinalPayload(root)
    }

    // -------------------- network --------------------

    private fun fetchHtml(url: String): String {
        val request =
            Request.Builder()
                .url(url)
                .get()
                .header("Accept", "text/html")
                .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) {
            throw Exception("HTTP ${response.code}")
        }

        return response.body?.string() ?: throw Exception("Empty response")
    }

    // -------------------- parsing --------------------

    private fun extractInitialData(html: String): JSONObject {
        val match = regex1.find(html) ?: regex2.find(html)
        return JSONObject(match?.groupValues?.get(1)
            ?: throw Exception("ytInitialData not found"))
    }

    private fun buildFinalPayload(root: JSONObject): JSONObject {
        val secondaryResults = extractSecondaryResults(root)
        val videoDetails = extractVideoDetails(root)

        return JSONObject().apply {
            put("videoDetails", videoDetails)
            put("results", secondaryResults)
        }
    }

    // -------------------- sections --------------------

    private fun extractSecondaryResults(root: JSONObject): JSONArray {
        return root
            .getJSONObject("contents")
            .getJSONObject("twoColumnWatchNextResults")
            .getJSONObject("secondaryResults")
            .getJSONObject("secondaryResults")
            .getJSONArray("results")
    }

    private fun extractVideoDetails(root: JSONObject): JSONObject {
        val contents =
            root
                .getJSONObject("contents")
                .getJSONObject("twoColumnWatchNextResults")
                .getJSONObject("results")
                .getJSONObject("results")
                .getJSONArray("contents")

        val videoPrimaryInfo =
            contents.getJSONObject(0).getJSONObject("videoPrimaryInfoRenderer")

        val videoSecondaryInfo =
            contents.getJSONObject(1).getJSONObject("videoSecondaryInfoRenderer")

        val owner =
            videoSecondaryInfo
                .getJSONObject("owner")
                .getJSONObject("videoOwnerRenderer")

        val subscriberCount =
            owner
                .getJSONObject("subscriberCountText")
                .optString("simpleText", "")

        val titleRun =
            owner
                .getJSONObject("title")
                .getJSONArray("runs")
                .getJSONObject(0)

        val channelName = titleRun.optString("text", "")
        val channelUrl =
            titleRun
                .getJSONObject("navigationEndpoint")
                .getJSONObject("browseEndpoint")
                .optString("canonicalBaseUrl", "")

        val topButtons =
            videoPrimaryInfo
                .getJSONObject("videoActions")
                .getJSONObject("menuRenderer")
                .getJSONArray("topLevelButtons")

        val likeTitle =
            topButtons
                .getJSONObject(0)
                .getJSONObject("segmentedLikeDislikeButtonViewModel")
                .getJSONObject("likeButtonViewModel")
                .getJSONObject("likeButtonViewModel")
                .getJSONObject("toggleButtonViewModel")
                .getJSONObject("toggleButtonViewModel")
                .getJSONObject("defaultButtonViewModel")
                .getJSONObject("buttonViewModel")
                .optString("title", "")

        val dislikeTitle =
            topButtons
                .getJSONObject(0)
                .getJSONObject("segmentedLikeDislikeButtonViewModel")
                .getJSONObject("dislikeButtonViewModel")
                .getJSONObject("dislikeButtonViewModel")
                .getJSONObject("toggleButtonViewModel")
                .getJSONObject("toggleButtonViewModel")
                .getJSONObject("defaultButtonViewModel")
                .getJSONObject("buttonViewModel")
                .optString("title", "")

        val commentsCount = extractCommentsCount(root)

        return JSONObject().apply {
            put("subscriberCount", subscriberCount)
            put("channelName", channelName)
            put("channelUrl", channelUrl)
            put("likes", likeTitle)
            put("dislikes", dislikeTitle)
            put("commentsCount", commentsCount)
        }
    }

    // -------------------- helpers --------------------

    fun extractCommentsCount(root: JSONObject): String {
        val panels = root.optJSONArray("engagementPanels") ?: return ""

        for (i in 0 until panels.length()) {
            val panel = panels.optJSONObject(i) ?: continue
            val renderer = panel.optJSONObject("engagementPanelSectionListRenderer") ?: continue
            val header = renderer.optJSONObject("header") ?: continue
            val titleHeader =
                header.optJSONObject("engagementPanelTitleHeaderRenderer") ?: continue

            val contextualInfo =
                titleHeader.optJSONArray("contextualInfo")
                    ?: titleHeader.optJSONObject("contextualInfo")?.optJSONArray("runs")

            if (contextualInfo != null && contextualInfo.length() > 0) {
                return contextualInfo
                    .optJSONObject(0)
                    ?.optString("text", "") ?: ""
            }
        }
        return ""
    }
}

package com.myapp.extractors.metaporn

import android.net.Uri
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import org.jsoup.Jsoup
import java.net.URI
import java.util.Base64
import java.util.regex.Pattern

object JsonHtmlBridge {
    private val client by lazy { OkHttpClient() }

    fun fetch(
        pageUrl: String,
        schema: JSONObject,
    ): String =
        try {
            val html = fetchHtml(pageUrl)
            if (html.startsWith("http error")) {
                html
            } else {
                val result = extractGeneric(html, pageUrl, schema)
                result.toString()
            }
        } catch (e: Exception) {
            "error: ${e.message ?: "unknown error"}"
        }

    private fun fetchHtml(url: String): String {
        val request =
            Request
                .Builder()
                .url(url)
                .get()
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .header("Accept", "text/html")
                .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                return "http error: ${response.code}"
            }
            return response.body?.string() ?: "empty response body"
        }
    }

    // -------------------- extraction --------------------

    private fun extractGeneric(
        html: String,
        baseUrl: String,
        schema: JSONObject,
    ): JSONObject {
        val doc = Jsoup.parse(html, baseUrl)
        val items = JSONArray()

        val containerSelector = schema.optString("container", "")
        val containers =
            if (containerSelector.isNotEmpty()) {
                doc.select(containerSelector)
            } else {
                listOf(doc)
            }

        for (el in containers) {
            val obj = JSONObject()

            for (key in schema.keys()) {
                if (key == "container" || key == "videoUrl") continue

                val conf = schema.optJSONObject(key) ?: continue

                val tag = conf.optString("tag", "")
                val selector = conf.optString("selector", "")
                val attr = conf.optString("attr", "text")

                val cssSelector =
                    when {
                        tag.isNotEmpty() && selector.isNotEmpty() -> "$tag$selector"
                        tag.isNotEmpty() -> tag
                        selector.isNotEmpty() -> selector
                        else -> ""
                    }

                var value: String? = null
                if (cssSelector.isNotEmpty()) {
                    try {
                        val node = el.selectFirst(cssSelector)
                        if (node != null) {
                            value =
                                if (attr == "text") {
                                    node.text().trim()
                                } else {
                                    node.attr(attr)
                                }
                        }
                    } catch (_: Exception) {
                    }
                }

                // resolve URLs
                if (key == "outUrl" && value != null) {
                    value = URI(baseUrl).resolve(value).toString()
                }

                obj.put(key, value)
            }

            items.put(obj)
        }

        // -------- video urls --------
        val videoUrls =
            if (schema.has("videoUrl")) {
                findVideoUrls(html, schema.getJSONObject("videoUrl"))
            } else {
                JSONArray()
            }

        return JSONObject()
            .put("items", items)
            .put("videoUrls", videoUrls)
    }

    // -------------------- video finder --------------------

    private fun findVideoUrls(
        html: String,
        conf: JSONObject,
    ): JSONArray {
        val results = JSONArray()
        val patternStr = conf.optString("pattern", "")
        if (patternStr.isEmpty()) return results

        val pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE)
        val matcher = pattern.matcher(html)

        val seen = HashSet<String>()
        while (matcher.find()) {
            val url = matcher.group()
            if (seen.add(url)) {
                results.put(url)
            }
        }
        return results
    }
}

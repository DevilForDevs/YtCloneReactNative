package com.myapp.extractors.metaporn

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import java.net.URI
import java.util.regex.Pattern

object JsonHtmlBridge {
    private val client = OkHttpClient()

    // ================= PUBLIC API =================

    fun fetch(
        pageUrl: String,
        schema: JSONObject,
    ): String =
        try {
            val html = fetchHtml(pageUrl)
            if (html.startsWith("http error")) {
                html
            } else {
                extract(html, pageUrl, schema).toString()
            }
        } catch (e: Exception) {
            "error: ${e.message ?: "unknown error"}"
        }

    // ================= NETWORK =================

    private fun fetchHtml(url: String): String {
        val request =
            Request
                .Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0")
                .header("Accept", "text/html")
                .build()

        client.newCall(request).execute().use { res ->
            if (!res.isSuccessful) return "http error: ${res.code}"
            return res.body?.string() ?: "empty response body"
        }
    }

    // ================= CORE =================

    private fun extract(
        html: String,
        baseUrl: String,
        schema: JSONObject,
    ): JSONObject {
        val doc = Jsoup.parse(html, baseUrl)
        val items = JSONArray()
        val globals = JSONObject()

        val containers =
            schema
                .optString("container", "")
                .takeIf { it.isNotBlank() }
                ?.let { doc.select(it) }
                ?: listOf(doc)

        // -------- container scoped --------
        for (el in containers) {
            val item = JSONObject()

            schema.keys().forEach { key ->
                val conf = schema.optJSONObject(key) ?: return@forEach
                if (key == "container" || conf.optString("scope") == "global") return@forEach

                val node = selectNode(el, conf)
                val value = node?.let { extractValue(it, conf) }

                item.put(key, resolveUrl(key, value, baseUrl))
            }

            items.put(item)
        }

        // -------- globals --------
        schema.keys().forEach { key ->
            val conf = schema.optJSONObject(key) ?: return@forEach
            if (conf.optString("scope") != "global") return@forEach

            val selector = conf.optString("selector")
            if (selector.isBlank()) return@forEach

            if (conf.optBoolean("multiple")) {
                val arr = JSONArray()
                for (el in doc.select(selector)) {
                    arr.put(extractValue(el, conf))
                }
                globals.put(key, arr)
            } else {
                doc
                    .selectFirst(selector)
                    ?.let { globals.put(key, extractValue(it, conf)) }
            }
        }

        // -------- regex video urls --------
        val videoUrls =
            schema
                .optJSONObject("videoUrl")
                ?.let { findVideoUrls(html, it) }
                ?: JSONArray()

        return JSONObject()
            .put("items", items)
            .put("videoUrls", videoUrls)
            .apply {
                if (globals.length() > 0) put("globals", globals)
            }
    }

    // ================= HELPERS =================

    private fun selectNode(
        container: Element,
        conf: JSONObject,
    ): Element? {
        val selector = conf.optString("selector")
        return if (selector.isBlank()) container else container.selectFirst(selector)
    }

    private fun extractValue(
        node: Element,
        conf: JSONObject,
    ): Any? {
        val attr = conf.opt("attr")

        if (attr == "text") return node.text().trim()

        if (attr is JSONArray) {
            for (i in 0 until attr.length()) {
                val v = node.attr(attr.optString(i))
                if (v.isNotBlank()) return v
            }
            return null
        }

        val a = conf.optString("attr")
        return if (a.isNotBlank()) node.attr(a) else null
    }

    private fun resolveUrl(
        key: String,
        value: Any?,
        baseUrl: String,
    ): Any? {
        if (value !is String) return value
        if ((key == "url" || key.endsWith("Url")) && value.startsWith("/")) {
            return URI(baseUrl).resolve(value).toString()
        }
        return value
    }

    // ================= REGEX =================

    private fun findVideoUrls(
        html: String,
        conf: JSONObject,
    ): JSONArray {
        val arr = JSONArray()
        val patternStr = conf.optString("pattern")
        if (patternStr.isBlank()) return arr

        val seen = HashSet<String>()
        val matcher = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE).matcher(html)

        while (matcher.find()) {
            val url = matcher.group()
            if (seen.add(url)) arr.put(url)
        }
        return arr
    }
}

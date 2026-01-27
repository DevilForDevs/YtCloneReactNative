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
            return res.body?.string() ?: ""
        }
    }

    // ================= CORE =================

    private fun extract(
        html: String,
        baseUrl: String,
        schema: JSONObject,
    ): JSONObject {
        val doc = Jsoup.parse(html, baseUrl)

        val result = JSONObject()
        val items = JSONArray()
        val globals = JSONObject()

        // ---------- GLOBAL FIELDS ----------
        schema.keys().forEach { key ->
            val conf = schema.optJSONObject(key) ?: return@forEach
            if (conf.optString("scope") != "global") return@forEach

            val selector = conf.optString("selector")
            if (selector.isBlank()) return@forEach

            if (conf.optBoolean("multiple")) {
                val arr = JSONArray()
                for (el in doc.select(selector)) {
                    extractValue(el, conf)?.let { arr.put(it) }
                }
                globals.put(key, arr)
            } else {
                doc
                    .selectFirst(selector)
                    ?.let { extractValue(it, conf) }
                    ?.let { globals.put(key, it) }
            }
        }

        // ---------- MULTIPLE CONTAINERS ($containers) ----------
        schema.optJSONObject("\$containers")?.let { containersObj ->
            val names = containersObj.keys()
            while (names.hasNext()) {
                val name = names.next()
                val cfg = containersObj.optJSONObject(name) ?: continue

                val selector = cfg.optString("selector")
                if (selector.isBlank()) continue

                val subSchema = cfg.optJSONObject("schema") ?: JSONObject()
                val arr = JSONArray()

                for (el in doc.select(selector)) {
                    arr.put(extractFromElement(el, subSchema, baseUrl))
                }

                globals.put(name, arr)
            }
        }

        // ---------- LEGACY SINGLE CONTAINER (container → items) ----------
        val legacySelector = schema.optString("container")
        if (legacySelector.isNotBlank()) {
            for (el in doc.select(legacySelector)) {
                items.put(extractFromElement(el, schema, baseUrl))
            }
        }

        // ---------- REGEX VIDEO URLS ----------
        val videoUrls =
            schema
                .optJSONObject("videoUrl")
                ?.let { findVideoUrls(html, it) }
                ?: JSONArray()

        // ---------- FINAL OBJECT ----------
        result.put("items", items)
        result.put("videoUrls", videoUrls)
        if (globals.length() > 0) result.put("globals", globals)

        return result
    }

    // ================= ELEMENT EXTRACTION =================

    private fun extractFromElement(
        root: Element,
        schema: JSONObject,
        baseUrl: String,
    ): JSONObject {
        val obj = JSONObject()

        schema.keys().forEach { key ->
            if (key.startsWith("$") || key == "container") return@forEach

            val conf = schema.optJSONObject(key) ?: return@forEach
            if (conf.optString("scope") == "global") return@forEach

            val selector = conf.optString("selector")
            val node = if (selector.isBlank()) root else root.selectFirst(selector)

            val value = node?.let { extractValue(it, conf) }
            if (value != null) {
                obj.put(key, resolveUrl(key, value, baseUrl))
            }
        }

        return obj
    }

    // ================= HELPERS =================

    private fun extractValue(
        node: Element,
        conf: JSONObject,
    ): Any? {
        val attr = conf.opt("attr")

        return when (attr) {
            "text" -> {
                node.text().trim()
            }

            "html" -> {
                node.html()
            }

            is JSONArray -> {
                for (i in 0 until attr.length()) {
                    val a = attr.optString(i)
                    val v = node.attr(a)
                    if (v.isNotBlank()) return v
                }
                null
            }

            is String -> {
                val v = node.attr(attr)
                if (v.isBlank()) null else v
            }

            else -> {
                null
            }
        }
    }

    private fun resolveUrl(
        key: String,
        value: Any,
        baseUrl: String,
    ): Any {
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
        val matcher =
            Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE).matcher(html)

        while (matcher.find()) {
            val url = matcher.group()
            if (seen.add(url)) arr.put(url)
        }
        return arr
    }
}

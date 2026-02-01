package com.jsranjan.ivideodownloader.extractors

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import org.jsoup.Jsoup
import org.jsoup.nodes.Element

class HtmlExtractor(
    private val client: OkHttpClient = OkHttpClient(),
) {
    // -------- Utilities --------
    private fun select(
        root: Element,
        selector: Any?,
    ): List<Element> {
        if (selector == null) return emptyList()
        return when (selector) {
            is String -> {
                root.select(selector)
            }

            is List<*> -> {
                val results = mutableListOf<Element>()
                val seen = mutableSetOf<Int>()
                selector.forEach { s ->
                    if (s is String) {
                        root.select(s).forEach { el ->
                            if (!seen.contains(el.hashCode())) {
                                seen.add(el.hashCode())
                                results.add(el)
                            }
                        }
                    }
                }
                results
            }

            else -> {
                emptyList()
            }
        }
    }

    private fun getAttr(
        el: Element?,
        attr: Any?,
    ): String? {
        if (el == null) return null
        return when (attr) {
            "text" -> {
                el.text().trim()
            }

            "html" -> {
                el.html()
            }

            is String -> {
                el.attr(attr)
            }

            is List<*> -> {
                attr
                    .mapNotNull { a ->
                        if (a is String) el.attr(a).takeIf { it.isNotEmpty() } else null
                    }.firstOrNull()
            }

            else -> {
                null
            }
        }
    }

    private fun extractObject(
        root: Element,
        schema: Map<String, Any?>, // nullable-safe
    ): JSONObject {
        val data = JSONObject()

        schema.forEach { (key, ruleAny) ->
            if (key.startsWith("$")) return@forEach
            val rule = ruleAny as? Map<*, *> ?: mapOf("selector" to ruleAny)

            if (rule.containsKey("\$container")) {
                val selector = rule["\$container"]
                val elements = select(root, selector)
                val arr = JSONArray()
                val subSchema = rule.mapKeys { it.key.toString() } as Map<String, Any?> // nullable-safe
                elements.forEach { el -> arr.put(extractObject(el, subSchema)) }
                data.put(key, arr)
            } else {
                val selector = rule["selector"]
                val attr = rule["attr"] ?: "text"
                val multiple = rule["multiple"] as? Boolean ?: false
                val elements = if (selector != null) select(root, selector) else listOf(root)
                if (multiple) {
                    val arr = JSONArray()
                    elements.forEach { el -> getAttr(el, attr)?.let { arr.put(it) } }
                    data.put(key, arr)
                } else {
                    getAttr(elements.firstOrNull(), attr)?.let { data.put(key, it) }
                }
            }
        }

        return data
    }

    private fun fetchHtml(
        url: String,
        headers: Map<String, String>? = null,
    ): String {
        val builder = Request.Builder().url(url)
        headers?.forEach { (k, v) -> builder.addHeader(k, v) }
        val request = builder.build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw Exception("HTTP error: ${response.code}")
            return response.body?.string() ?: ""
        }
    }

    // -------- Public API --------
    fun extract(
        url: String,
        schema: Map<String, Any?>,
        headers: Map<String, String>? = null,
    ): JSONObject {
        val html = fetchHtml(url, headers)
        val doc = Jsoup.parse(html)
        val result = JSONObject()

        // ---------------- globals ----------------
        (schema["\$globals"] as? Map<*, *>)?.let { globalsSchema ->
            val globalsMap =
                globalsSchema.mapKeys { it.key.toString() } as Map<String, Any?>
            result.put("globals", extractObject(doc, globalsMap))
        }

        // ---------------- multiple containers ----------------
        (schema["\$containers"] as? Map<*, *>)?.forEach { (nameAny, cfgAny) ->
            val name = nameAny.toString()
            val cfg = cfgAny as? Map<*, *> ?: return@forEach

            val selector = cfg["selector"]
            val subSchema =
                (cfg["schema"] as? Map<*, *>)?.mapKeys { it.key.toString() }
                    as Map<String, Any?>? ?: emptyMap()

            result.put(name, extractContainer(doc, selector, subSchema))
        }

        // ---------------- legacy single container ----------------
        schema["\$container"]?.let { container ->
            // IMPORTANT: only run legacy if "items" not already produced
            if (!result.has("items")) {
                val cleanSchema =
                    schema.filterKeys { !it.startsWith("$") } // avoid recursion
                result.put("items", extractContainer(doc, container, cleanSchema))
            }
        }

        return result
    }

    private fun extractContainer(
        root: Element,
        selector: Any?,
        schema: Map<String, Any?>,
    ): JSONArray {
        val arr = JSONArray()
        val elements = select(root, selector)
        elements.forEach { el ->
            arr.put(extractObject(el, schema))
        }
        return arr
    }
}

package com.myapp.extractors.youtube

import org.json.JSONObject

object FeedRouter {

    fun fetch(
        videoId: String?,
        continuation: String?,
        visitorData: String,
    ): JSONObject {

        // Case 3️⃣ : homepage / shorts browse
        if (videoId == null && continuation != null) {
            return Endpoint.fetchBrowse(
                continuation = continuation,
                visitorData = visitorData,
            )
        }

        // Case 1️⃣ + 2️⃣ : watch next (with or without continuation)
        if (videoId != null) {
            return Endpoint.fetchNext(
                videoId = videoId,
                continuation = continuation,
                visitorData = visitorData,
            )
        }

        throw IllegalArgumentException("Invalid parameters")
    }
}

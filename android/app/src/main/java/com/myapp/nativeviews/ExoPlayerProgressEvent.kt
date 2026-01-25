package com.myapp.nativeviews

import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class ExoPlayerProgressEvent(
    surfaceId: Int,
    viewTag: Int,
    private val data: WritableMap,
) : Event<ExoPlayerProgressEvent>(surfaceId, viewTag) {
    override fun getEventName(): String = "onProgress"

    override fun getEventData(): WritableMap = data
}

package com.myapp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.myapp.MyNativeModule
import com.myapp.nativeviews.RNExoPlayerManager

class MyAppPackage : ReactPackage {
    // Register native modules (like your MyNativeModule)
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = listOf(MyNativeModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = listOf(RNExoPlayerManager())
}

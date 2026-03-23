package com.jsranjan.ivideodownloader

import android.content.Intent
import android.os.Bundle // ✅ ADD THIS
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
    override fun getMainComponentName(): String = "MyApp"

    override fun createReactActivityDelegate(): ReactActivityDelegate = DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null) // 🔥 prevents fragment restore crash
    }
}

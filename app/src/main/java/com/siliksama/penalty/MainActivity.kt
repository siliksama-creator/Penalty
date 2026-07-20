package com.siliksama.penalty

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private var webView: WebView? = null
    private var soundPool: SoundPool? = null
    private val soundIds = HashMap<String, Int>()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            initNativeSounds()

            // Create and attach WebView safely
            val wv = WebView(this)
            webView = wv
            setContentView(wv)

            setupWebView(wv)
            wv.loadUrl("file:///android_asset/www/index.html")

            wv.post {
                try {
                    hideSystemUI()
                } catch (e: Throwable) {
                    e.printStackTrace()
                }
            }
        } catch (e: Throwable) {
            e.printStackTrace()
            Toast.makeText(this, "خطا در بارگذاری موتور بازی: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
        }
    }

    private fun initNativeSounds() {
        try {
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            soundPool = SoundPool.Builder()
                .setMaxStreams(8)
                .setAudioAttributes(audioAttributes)
                .build()

            soundIds["click"] = soundPool?.load(assets.openFd("www/assets/sounds/click.wav"), 1) ?: 0
            soundIds["whistle"] = soundPool?.load(assets.openFd("www/assets/sounds/whistle.wav"), 1) ?: 0
            soundIds["kick"] = soundPool?.load(assets.openFd("www/assets/sounds/kick.wav"), 1) ?: 0
            soundIds["goal"] = soundPool?.load(assets.openFd("www/assets/sounds/goal.wav"), 1) ?: 0
            soundIds["save"] = soundPool?.load(assets.openFd("www/assets/sounds/save.wav"), 1) ?: 0
            soundIds["miss"] = soundIds["save"] ?: 0
        } catch (e: Throwable) {
            e.printStackTrace()
        }
    }

    inner class AndroidBridge(private val context: Context) {
        @JavascriptInterface
        fun playSound(type: String) {
            try {
                val id = soundIds[type] ?: return
                if (id > 0) {
                    soundPool?.play(id, 1f, 1f, 1, 0, 1f)
                }
            } catch (e: Throwable) {
                e.printStackTrace()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView(wv: WebView) {
        try {
            wv.addJavascriptInterface(AndroidBridge(this), "AndroidBridge")

            wv.webViewClient = object : WebViewClient() {
                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                }
            }

            wv.webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    return true
                }
            }

            wv.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                mediaPlaybackRequiresUserGesture = false // Immediate touch sound playback
                useWideViewPort = true
                loadWithOverviewMode = true
                cacheMode = WebSettings.LOAD_DEFAULT
            }

            wv.isVerticalScrollBarEnabled = false
            wv.isHorizontalScrollBarEnabled = false
            wv.overScrollMode = View.OVER_SCROLL_NEVER
        } catch (e: Throwable) {
            e.printStackTrace()
        }
    }

    private fun hideSystemUI() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.setDecorFitsSystemWindows(false)
                window.insetsController?.let { controller ->
                    controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                    controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                }
            } else {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                )
                @Suppress("DEPRECATION")
                window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
            }
        } catch (e: Throwable) {
            e.printStackTrace()
        }
    }

    override fun onResume() {
        super.onResume()
        try {
            webView?.onResume()
            webView?.post { hideSystemUI() }
        } catch (e: Throwable) {
            e.printStackTrace()
        }
    }

    override fun onPause() {
        super.onPause()
        try {
            webView?.onPause()
        } catch (e: Throwable) {
            e.printStackTrace()
        }
    }

    override fun onBackPressed() {
        try {
            if (webView != null && webView!!.canGoBack()) {
                webView!!.goBack()
            } else {
                super.onBackPressed()
            }
        } catch (e: Throwable) {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        try {
            soundPool?.release()
            soundPool = null
            webView?.destroy()
            webView = null
        } catch (e: Throwable) {
            e.printStackTrace()
        }
        super.onDestroy()
    }
}

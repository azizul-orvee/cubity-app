package com.cubity.receivables

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.os.Message
import android.view.View
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.URLUtil
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.LinearLayout
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var loading: View
    private lateinit var offline: View
    private var firstPaintDone = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setContentView(R.layout.activity_main)

        val root = findViewById<View>(R.id.root)
        val statusInset = findViewById<View>(R.id.status_inset)
        val navInset = findViewById<View>(R.id.nav_inset)
        webView = findViewById(R.id.webview)
        loading = findViewById(R.id.loading)
        offline = findViewById(R.id.offline)

        WindowInsetsControllerCompat(window, root).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = true
        }

        ViewCompat.setOnApplyWindowInsetsListener(root) { _, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
            )
            statusInset.layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                bars.top,
            )
            navInset.layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                bars.bottom,
            )
            WindowInsetsCompat.CONSUMED
        }

        findViewById<View>(R.id.retry).setOnClickListener { loadApp() }

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadWithOverviewMode = false
            useWideViewPort = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            javaScriptCanOpenWindowsAutomatically = true
            setSupportMultipleWindows(true)
            userAgentString = "$userAgentString CubityApp/1.0"
        }
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false
        webView.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
            startDownload(url, userAgent, contentDisposition, mimeType)
            if (webView.canGoBack()) webView.goBack()
        })
        webView.webViewClient = CubityClient()
        webView.webChromeClient = CubityChromeClient()

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            },
        )

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
            hideLoading()
        } else {
            loadApp()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onPause() {
        CookieManager.getInstance().flush()
        super.onPause()
    }

    private fun loadApp() {
        offline.visibility = View.GONE
        loading.visibility = View.VISIBLE
        firstPaintDone = false
        webView.loadUrl(BuildConfig.APP_URL)
    }

    private fun hideLoading() {
        firstPaintDone = true
        loading.animate()
            .alpha(0f)
            .setDuration(220)
            .withEndAction {
                loading.visibility = View.GONE
                loading.alpha = 1f
            }
            .start()
    }

    private fun showOffline() {
        firstPaintDone = true
        loading.visibility = View.GONE
        offline.visibility = View.VISIBLE
    }

    private fun lockPageToApp() {
        webView.evaluateJavascript(APP_CHROME_JS, null)
    }

    private inner class CubityClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            return handleUri(request.url)
        }

        override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
            offline.visibility = View.GONE
        }

        override fun onPageFinished(view: WebView, url: String) {
            lockPageToApp()
            if (!firstPaintDone) hideLoading()
        }

        override fun onReceivedError(
            view: WebView,
            request: WebResourceRequest,
            error: WebResourceError,
        ) {
            if (request.isForMainFrame) showOffline()
        }
    }

    private inner class CubityChromeClient : WebChromeClient() {
        override fun onProgressChanged(view: WebView, newProgress: Int) {
            if (newProgress > 40) lockPageToApp()
        }

        override fun onCreateWindow(
            view: WebView,
            isDialog: Boolean,
            isUserGesture: Boolean,
            resultMsg: Message,
        ): Boolean {
            val extra = WebView(this@MainActivity)
            extra.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    handleUri(request.url)
                    return true
                }
            }
            (resultMsg.obj as WebView.WebViewTransport).webView = extra
            resultMsg.sendToTarget()
            return true
        }
    }

    private fun handleUri(uri: Uri): Boolean {
        val scheme = uri.scheme?.lowercase().orEmpty()
        val host = uri.host?.lowercase().orEmpty()
        if (scheme == "tel" || scheme == "mailto" || scheme == "sms" || scheme == "whatsapp" || scheme == "intent") {
            openExternal(uri)
            return true
        }
        if (host == "wa.me" || host.endsWith(".whatsapp.com") || host == "whatsapp.com") {
            openExternal(uri)
            return true
        }
        if (host == BuildConfig.APP_HOST || host.endsWith(".vercel.app")) {
            return false
        }
        openExternal(uri)
        return true
    }

    private fun openExternal(uri: Uri) {
        val intent = if (uri.scheme.equals("tel", ignoreCase = true)) {
            Intent(Intent.ACTION_DIAL, uri)
        } else {
            Intent(Intent.ACTION_VIEW, uri)
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            startActivity(intent)
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(this, R.string.no_app, Toast.LENGTH_SHORT).show()
        }
    }

    private fun startDownload(
        url: String,
        userAgent: String,
        contentDisposition: String?,
        mimeType: String?,
    ) {
        val filename = URLUtil.guessFileName(url, contentDisposition, mimeType)
        val request = DownloadManager.Request(Uri.parse(url)).apply {
            setMimeType(mimeType)
            addRequestHeader("User-Agent", userAgent)
            CookieManager.getInstance().getCookie(url)?.let { addRequestHeader("Cookie", it) }
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
            setTitle(filename)
        }
        val manager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        manager.enqueue(request)
        Toast.makeText(this, getString(R.string.download_started, filename), Toast.LENGTH_SHORT).show()
    }

    companion object {
        private const val APP_CHROME_JS = """
            (function () {
              var root = document.documentElement;
              if (!root) return;
              root.classList.add('cubity-app');
              if (document.getElementById('cubity-app-chrome')) return;
              var style = document.createElement('style');
              style.id = 'cubity-app-chrome';
              style.textContent = [
                'html.cubity-app, html.cubity-app body {',
                '  overflow-x: clip !important;',
                '  max-width: 100% !important;',
                '  overscroll-behavior-x: none;',
                '  touch-action: pan-y;',
                '}',
                'html.cubity-app .app-header-inner { padding-top: 0 !important; }',
                'html.cubity-app .app-bottom-nav { padding-bottom: 0 !important; }'
              ].join('');
              (document.head || root).appendChild(style);
            })();
        """
    }
}

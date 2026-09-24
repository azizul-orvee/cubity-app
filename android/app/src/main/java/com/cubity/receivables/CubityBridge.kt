package com.cubity.receivables

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.util.Base64
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File

class CubityBridge(private val activity: Activity) {
    @JavascriptInterface
    fun sharePdf(base64: String, filename: String, phone: String) {
        activity.runOnUiThread {
            try {
                val bytes = Base64.decode(base64, Base64.DEFAULT)
                val dir = File(activity.cacheDir, "statements").apply { mkdirs() }
                val safe = filename.replace(Regex("[^A-Za-z0-9._-]"), "-").ifBlank { "Client-due-statement.pdf" }
                val file = File(dir, safe)
                file.writeBytes(bytes)
                val uri = FileProvider.getUriForFile(activity, "${activity.packageName}.fileprovider", file)
                val send = Intent(Intent.ACTION_SEND).apply {
                    type = "application/pdf"
                    putExtra(Intent.EXTRA_STREAM, uri)
                    clipData = ClipData.newRawUri("", uri)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    if (phone.isNotBlank()) putExtra("jid", "$phone@s.whatsapp.net")
                }
                val opened = listOf("com.whatsapp", "com.whatsapp.w4b").any { pkg ->
                    try {
                        activity.startActivity(Intent(send).setPackage(pkg))
                        true
                    } catch (_: ActivityNotFoundException) {
                        false
                    }
                }
                if (!opened) {
                    activity.startActivity(Intent.createChooser(send, "Send statement"))
                }
            } catch (_: Exception) {
                Toast.makeText(activity, R.string.no_app, Toast.LENGTH_SHORT).show()
            }
        }
    }
}

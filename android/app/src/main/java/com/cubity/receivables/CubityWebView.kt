package com.cubity.receivables

import android.content.Context
import android.util.AttributeSet
import android.webkit.WebView

class CubityWebView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : WebView(context, attrs) {
    override fun overScrollBy(
        deltaX: Int,
        deltaY: Int,
        scrollX: Int,
        scrollY: Int,
        scrollRangeX: Int,
        scrollRangeY: Int,
        maxOverScrollX: Int,
        maxOverScrollY: Int,
        isTouchEvent: Boolean,
    ): Boolean {
        return super.overScrollBy(
            0,
            deltaY,
            0,
            scrollY,
            0,
            scrollRangeY,
            0,
            maxOverScrollY,
            isTouchEvent,
        )
    }

    override fun scrollTo(x: Int, y: Int) {
        super.scrollTo(0, y)
    }

    override fun onOverScrolled(scrollX: Int, scrollY: Int, clampedX: Boolean, clampedY: Boolean) {
        super.onOverScrolled(0, scrollY, true, clampedY)
    }
}

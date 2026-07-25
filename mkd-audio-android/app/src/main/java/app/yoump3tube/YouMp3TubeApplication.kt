package app.yoump3tube

import android.app.Application
import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL

class YouMp3TubeApplication : Application() {
    @Volatile
    private var initialized = false

    @Synchronized
    fun ensureConverterInitialized() {
        if (initialized) return

        YoutubeDL.getInstance().init(this)
        FFmpeg.getInstance().init(this)
        initialized = true
    }
}

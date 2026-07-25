package app.yoump3tube

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import java.io.File
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private val executor = Executors.newSingleThreadExecutor()

    private lateinit var urlInput: EditText
    private lateinit var convertButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var statusText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(createContentView())
        applyIncomingUrl(intent?.data)
    }

    override fun onNewIntent(intent: android.content.Intent?) {
        super.onNewIntent(intent)
        applyIncomingUrl(intent?.data)
    }

    override fun onDestroy() {
        executor.shutdownNow()
        super.onDestroy()
    }

    private fun createContentView(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(42), dp(24), dp(24))
            setBackgroundColor(getColor(R.color.navy_950))
        }

        root.addView(text(getString(R.string.app_subtitle), 11f, R.color.gold_500, true))
        root.addView(text(getString(R.string.app_name), 30f, R.color.slate_100, true).apply {
            setPadding(0, dp(4), 0, dp(30))
        })

        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(22), dp(24), dp(22), dp(24))
            setBackgroundColor(getColor(R.color.navy_900))
        }

        card.addView(text("●  Ferramenta ativa neste dispositivo", 12f, R.color.green_300, true))
        card.addView(text(getString(R.string.converter_title), 24f, R.color.slate_100, true).apply {
            setPadding(0, dp(24), 0, dp(8))
        })
        card.addView(text(getString(R.string.converter_description), 14f, R.color.slate_400))
        card.addView(text(getString(R.string.link_label), 13f, R.color.slate_100, true).apply {
            setPadding(0, dp(24), 0, dp(8))
        })

        urlInput = EditText(this).apply {
            hint = getString(R.string.link_hint)
            setTextColor(getColor(R.color.slate_100))
            setHintTextColor(getColor(R.color.slate_400))
            setSingleLine(true)
            inputType = android.text.InputType.TYPE_CLASS_TEXT or
                android.text.InputType.TYPE_TEXT_VARIATION_URI
            setPadding(dp(14), dp(14), dp(14), dp(14))
            setBackgroundColor(Color.rgb(11, 19, 36))
        }
        card.addView(urlInput, matchWidth())

        convertButton = Button(this).apply {
            text = getString(R.string.convert_action)
            isAllCaps = false
            setTextColor(getColor(R.color.navy_950))
            setBackgroundColor(getColor(R.color.gold_500))
            setOnClickListener { startConversion() }
        }
        card.addView(convertButton, matchWidth(topMargin = dp(14)))

        progressBar = ProgressBar(this).apply {
            visibility = View.GONE
            isIndeterminate = true
        }
        card.addView(progressBar, wrapContent(topMargin = dp(18), gravity = Gravity.CENTER))

        statusText = text("", 13f, R.color.slate_400).apply {
            visibility = View.GONE
            gravity = Gravity.CENTER
            setPadding(0, dp(14), 0, 0)
        }
        card.addView(statusText, matchWidth())
        root.addView(card, matchWidth())
        root.addView(text(getString(R.string.legal_notice), 12f, R.color.slate_400).apply {
            gravity = Gravity.CENTER
            setPadding(dp(12), dp(22), dp(12), 0)
        })

        return root
    }

    private fun startConversion() {
        val url = urlInput.text.toString().trim()
        if (!isSupportedYoutubeUrl(url)) {
            showStatus(getString(R.string.invalid_link), isError = true)
            return
        }

        setConverting(true)
        executor.execute {
            try {
                (application as YouMp3TubeApplication).ensureConverterInitialized()
                val outputPath = convertToMp3(url)
                runOnUiThread {
                    setConverting(false)
                    showStatus(getString(R.string.ready, outputPath), isError = false)
                }
            } catch (error: Throwable) {
                android.util.Log.e("YouMp3Tube", "Conversion failed", error)
                runOnUiThread {
                    setConverting(false)
                    showStatus(getString(R.string.conversion_error), isError = true)
                }
            }
        }
    }

    private fun convertToMp3(url: String): String {
        val outputDirectory = File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            "YouMp3Tube",
        ).apply { mkdirs() }

        val request = YoutubeDLRequest(url).apply {
            addOption("--no-playlist")
            addOption("--extract-audio")
            addOption("--audio-format", "mp3")
            addOption("--audio-quality", "128K")
            addOption("--extractor-args", "youtube:player_client=android_vr")
            addOption("--print", "after_move:filepath")
            addOption("--output", "${outputDirectory.absolutePath}/%(title).100s.%(ext)s")
        }

        val response = YoutubeDL.getInstance().execute(request)
        return response.out
            .lineSequence()
            .map(String::trim)
            .lastOrNull(String::isNotEmpty)
            ?: outputDirectory.absolutePath
    }

    private fun applyIncomingUrl(uri: Uri?) {
        val mediaUrl = uri?.getQueryParameter("url") ?: return
        urlInput.setText(mediaUrl)
    }

    private fun setConverting(converting: Boolean) {
        convertButton.isEnabled = !converting
        convertButton.text =
            getString(if (converting) R.string.converting else R.string.convert_action)
        progressBar.visibility = if (converting) View.VISIBLE else View.GONE
        if (converting) statusText.visibility = View.GONE
    }

    private fun showStatus(message: String, isError: Boolean) {
        statusText.text = message
        statusText.setTextColor(
            getColor(if (isError) R.color.red_200 else R.color.green_300),
        )
        statusText.visibility = View.VISIBLE
    }

    private fun text(
        value: String,
        size: Float,
        color: Int,
        bold: Boolean = false,
    ) = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(getColor(color))
        if (bold) setTypeface(typeface, Typeface.BOLD)
    }

    private fun matchWidth(topMargin: Int = 0) =
        LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply { this.topMargin = topMargin }

    private fun wrapContent(topMargin: Int = 0, gravity: Int = Gravity.NO_GRAVITY) =
        LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply {
            this.topMargin = topMargin
            this.gravity = gravity
        }

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density).toInt()

    private fun isSupportedYoutubeUrl(value: String): Boolean = try {
        val host = Uri.parse(value).host?.removePrefix("www.")?.lowercase()
        host in setOf("youtube.com", "m.youtube.com", "youtu.be")
    } catch (_: Throwable) {
        false
    }
}

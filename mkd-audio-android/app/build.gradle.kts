plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "app.yoump3tube"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.yoump3tube"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64")
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        jniLibs {
            useLegacyPackaging = true
        }
    }
}

dependencies {
    val youtubeDlAndroidVersion = "0.18.1"

    implementation("androidx.core:core-ktx:1.15.0")
    implementation(
        "io.github.junkfood02.youtubedl-android:library:$youtubeDlAndroidVersion",
    )
    implementation(
        "io.github.junkfood02.youtubedl-android:ffmpeg:$youtubeDlAndroidVersion",
    )
}

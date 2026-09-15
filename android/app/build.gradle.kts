plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.cubity.receivables"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.cubity.receivables"
        minSdk = 24
        targetSdk = 35
        versionCode = 2
        versionName = "1.0.1"
        buildConfigField("String", "APP_URL", "\"https://cubity-app.vercel.app/\"")
        buildConfigField("String", "APP_HOST", "\"cubity-app.vercel.app\"")
    }

    signingConfigs {
        create("release") {
            storeFile = file("cubity-release.jks")
            storePassword = "cubityapp"
            keyAlias = "cubity"
            keyPassword = "cubityapp"
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.webkit:webkit:1.12.1")
}

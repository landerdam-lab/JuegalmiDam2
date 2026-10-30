import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
}

// Firma de la APK de entrega (release). Las claves están en android/keystore.properties, que NO se sube a Git
// (igual que el .jks). Si el fichero no existe, la release se genera sin firmar y la debug sigue igual.
// Cómo crearlo: android/README.md
val firma = Properties().apply {
    val fichero = rootProject.file("keystore.properties")
    if (fichero.exists()) fichero.inputStream().use { load(it) }
}

android {
    namespace = "com.juegalmi.app"
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "com.juegalmi.app"
        // API 26 (Android 8): la necesitan los iconos adaptativos del diseño (mipmap-anydpi-v26)
        minSdk = 26
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        if (!firma.isEmpty) {
            create("release") {
                storeFile = rootProject.file(firma.getProperty("storeFile"))
                storePassword = firma.getProperty("storePassword")
                keyAlias = firma.getProperty("keyAlias")
                keyPassword = firma.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            if (!firma.isEmpty) {
                signingConfig = signingConfigs.getByName("release")
            }
            optimization {
                enable = false
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.activity)
    implementation(libs.constraintlayout)
    implementation(libs.core.splashscreen)
    implementation(libs.recyclerview)
    implementation(libs.viewpager2)
    implementation(libs.volley)
    implementation(libs.retrofit)
    implementation(libs.retrofit.gson)
    implementation(libs.glide)
    implementation(libs.play.services.location)
    implementation(libs.osmdroid)
    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)
}

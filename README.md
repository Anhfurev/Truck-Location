# Truck Location Android App

Truck Location is an Expo-based React Native application focused on Android driver tracking. It includes background GPS tracking, Android foreground service support, and boot restore support through the custom `tracking-native` module.

## Requirements

- Node.js 20+
- Android Studio with an emulator, or a physical Android device
- JDK 17
- Android SDK configured in your shell environment

## Install

```bash
npm install
```

## Run On Android

Start a development build on an emulator or connected device:

```bash
npm run android
```

This uses `expo run:android` and installs the native Android app.

## Build A Debug APK Locally

To generate a local debug APK:

```bash
cd android
./gradlew assembleDebug
```

The generated APK will be available at:

```bash
android/app/build/outputs/apk/debug/app-debug.apk
```

## Build With EAS

Preview APK:

```bash
npm run build:apk
```

Production AAB:

```bash
npm run build:aab
```

## Android-Specific Behavior

- Background location is enabled in Expo config.
- Foreground service permissions are declared for Android.
- The custom boot receiver restores app launch after device reboot when tracking was previously enabled.
- Native boot restore requires a development build or release build, not Expo Go.

## Notes

- The native Android project already exists in the `android` directory.
- A local `./gradlew assembleDebug` build completes successfully.
- During Gradle build, Expo warns if `NODE_ENV` is unset; this does not block the Android build.

package com.knect

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Ticket 4.5: makes fontFamily 'Manrope' resolve to res/font/manrope.xml, weight by weight.
    ReactFontManager.getInstance().addCustomFont(this, "Manrope", R.font.manrope)
    loadReactNative(this)
  }
}

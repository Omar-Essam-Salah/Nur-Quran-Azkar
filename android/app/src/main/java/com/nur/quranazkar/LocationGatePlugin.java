package com.nur.quranazkar;

import android.content.Context;
import android.content.Intent;
import android.location.LocationManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Tiny bridge so the web layer can tell whether the device's LOCATION SERVICE
 * (GPS) is actually switched on — which is separate from the runtime permission
 * — and open the exact system toggle so the user enables it in one tap instead
 * of hunting through settings.
 */
@CapacitorPlugin(name = "LocationGate")
public class LocationGatePlugin extends Plugin {

  @PluginMethod
  public void isEnabled(PluginCall call) {
    boolean enabled = false;
    try {
      LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
      enabled = lm != null && (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)
          || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER));
    } catch (Exception e) {
      // ignore — fall through as "not enabled"
    }
    JSObject ret = new JSObject();
    ret.put("enabled", enabled);
    call.resolve(ret);
  }

  @PluginMethod
  public void openSettings(PluginCall call) {
    try {
      Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(intent);
      call.resolve();
    } catch (Exception e) {
      call.reject("cannot open location settings");
    }
  }
}

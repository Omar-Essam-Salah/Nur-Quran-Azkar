package com.nur.quranazkar;

import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Must be registered before super.onCreate so the bridge knows the plugin.
    registerPlugin(LocationGatePlugin.class);
    super.onCreate(savedInstanceState);
  }

  // A physical volume press should silence a sounding adhan (like dismissing an
  // alarm). We notify the WebView but DON'T consume the event, so the volume
  // still changes normally and the reciter audio is unaffected (JS only stops
  // playback when the adhan is the thing currently sounding).
  @Override
  public boolean dispatchKeyEvent(KeyEvent event) {
    int code = event.getKeyCode();
    if (event.getAction() == KeyEvent.ACTION_DOWN
        && (code == KeyEvent.KEYCODE_VOLUME_UP || code == KeyEvent.KEYCODE_VOLUME_DOWN)) {
      final WebView wv = (this.bridge != null) ? this.bridge.getWebView() : null;
      if (wv != null) {
        wv.post(() -> wv.evaluateJavascript(
            "window.dispatchEvent(new Event('nur-volume-key'));", null));
      }
    }
    return super.dispatchKeyEvent(event);
  }
}

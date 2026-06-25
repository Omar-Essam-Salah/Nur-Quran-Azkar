package com.nur.quranazkar;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Must be registered before super.onCreate so the bridge knows the plugin.
    registerPlugin(LocationGatePlugin.class);
    super.onCreate(savedInstanceState);
  }
}

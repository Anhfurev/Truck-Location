import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

interface MapViewProps {
  center: [number, number] | null;
  zoom?: number;
  isLocating?: boolean;
}

const FALLBACK_CENTER: [number, number] = [47.9188, 106.9176];

type MapLoadState = "loading" | "ready" | "error";

function buildMapHtml(lat: number, lng: number, zoom: number): string {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
html,body{margin:0;padding:0;height:100%;overflow:hidden}
#map{width:100%;height:100%}
.pulse-marker{width:20px;height:20px;border-radius:50%;background:rgba(37,99,235,0.22);border:2px solid rgba(37,99,235,0.45);display:flex;align-items:center;justify-content:center}
.pulse-marker .dot{width:10px;height:10px;border-radius:50%;background:#2563eb}
</style>
</head><body>
<div id="map"></div>
<script>
function sendStatus(type, message) {
  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, message: message }));
  }
}

var map = null;
var marker = null;
var circle = null;
var icon = null;

function updatePos(lat,lng){
  if(!map){
    return;
  }

  if(marker){
    marker.setLatLng([lat,lng]);
    if(circle){
      circle.setLatLng([lat,lng]);
    }
  } else {
    circle=L.circle([lat,lng],{radius:36,color:'rgba(37,99,235,0.45)',fillColor:'rgba(37,99,235,0.14)',fillOpacity:0.5,weight:2}).addTo(map);
    marker=L.marker([lat,lng],{icon:icon}).addTo(map);
  }

  map.panTo([lat,lng],{animate:true,duration:0.5});
}

function handleMessage(rawData) {
  try {
    var data = JSON.parse(rawData);
    if(data.type==='move') {
      updatePos(data.lat, data.lng);
    }
  } catch (error) {}
}

function bootstrapMap() {
  try {
    if (typeof L === 'undefined') {
      sendStatus('error', 'Leaflet failed to load');
      return;
    }

    map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat},${lng}],${zoom});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    icon=L.divIcon({className:'',html:'<div class="pulse-marker"><div class="dot"></div></div>',iconSize:[20,20],iconAnchor:[10,10]});
    updatePos(${lat},${lng});
    sendStatus('ready', 'Map ready');
  } catch (error) {
    sendStatus('error', String(error && error.message ? error.message : error));
  }
}

document.addEventListener('message',function(e){handleMessage(e.data);});
window.addEventListener('message',function(e){handleMessage(e.data);});
window.addEventListener('load', function(){
  setTimeout(bootstrapMap, 0);
  setTimeout(function(){
    if(!map){
      sendStatus('error', 'Map bootstrap timed out');
    }
  }, 3500);
});
<\/script>
</body></html>`;
}

export function LiveMap({
  center,
  zoom = 15,
  isTracking = false,
  isLocating = false,
}: MapViewProps & { isTracking?: boolean }) {
  const webViewRef = useRef<WebView>(null);
  const [lastKnownCenter, setLastKnownCenter] = useState<
    [number, number] | null
  >(center);
  const [mapLoadState, setMapLoadState] = useState<MapLoadState>("loading");
  const [webViewKey, setWebViewKey] = useState(0);

  useEffect(() => {
    if (center) {
      setLastKnownCenter(center);
    }
  }, [center]);

  const activeCenter = lastKnownCenter ?? center ?? FALLBACK_CENTER;
  const [lat, lng] = activeCenter;
  const htmlRef = useRef(buildMapHtml(lat, lng, zoom));
  const hasSentInitial = useRef(false);
  const hasRealLocation = lastKnownCenter !== null || center !== null;

  const sendMapMove = (nextCenter: [number, number]) => {
    webViewRef.current?.postMessage(
      JSON.stringify({ type: "move", lat: nextCenter[0], lng: nextCenter[1] }),
    );
  };

  useEffect(() => {
    if (!center || !hasSentInitial.current) {
      return;
    }
    sendMapMove(center);
  }, [center]);

  const handleReload = () => {
    hasSentInitial.current = false;
    setMapLoadState("loading");
    setWebViewKey((current) => current + 1);
  };

  return (
    <View style={styles.container}>
      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ html: htmlRef.current }}
        style={styles.map}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as {
              type?: string;
            };

            if (payload.type === "ready") {
              setMapLoadState("ready");
              return;
            }

            if (payload.type === "error") {
              setMapLoadState("error");
            }
          } catch {
            setMapLoadState("error");
          }
        }}
        onError={() => setMapLoadState("error")}
        onLoadEnd={() => {
          hasSentInitial.current = true;
          setMapLoadState((current) =>
            current === "ready" ? current : "loading",
          );

          if (center) {
            sendMapMove(center);
            return;
          }

          if (lastKnownCenter) {
            sendMapMove(lastKnownCenter);
          }
        }}
      />
      {mapLoadState === "error" && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Газрын зураг ачаалсангүй.</Text>
          <Text style={styles.errorText}>
            Интернетээ шалгаад дахин оролдоно уу.
          </Text>
          <Pressable onPress={handleReload} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Дахин ачаалах</Text>
          </Pressable>
        </View>
      )}
      {!hasRealLocation && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadingText}>
            {isLocating
              ? "Байршил олж байна..."
              : "Байршлын мэдээлэл хүлээж байна..."}
          </Text>
        </View>
      )}
      <View style={[styles.badge, isTracking && styles.badgeActive]}>
        <Text style={styles.badgeText}>
          {isTracking ? "ОНЛАЙН" : "ОФФЛАЙН"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f4f8",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
  },
  loadingText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2563eb",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  badge: {
    position: "absolute",
    top: 21,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(15, 23, 42, 0.74)",
  },
  badgeActive: {
    backgroundColor: "rgba(22, 163, 74, 0.84)",
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});

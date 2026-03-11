import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface MapViewProps {
  center: [number, number] | null;
  zoom?: number;
  isLocating?: boolean;
}

const FALLBACK_CENTER: [number, number] = [47.9188, 106.9176];

function buildMapHtml(lat: number, lng: number, zoom: number): string {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#f0f4f8}
#map{width:100%;height:100%}
.pulse-marker{width:20px;height:20px;border-radius:50%;background:rgba(37,99,235,0.22);border:2px solid rgba(37,99,235,0.45);display:flex;align-items:center;justify-content:center}
.pulse-marker .dot{width:10px;height:10px;border-radius:50%;background:#2563eb}
</style>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat},${lng}],${zoom});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
var icon=L.divIcon({className:'',html:'<div class="pulse-marker"><div class="dot"></div></div>',iconSize:[20,20],iconAnchor:[10,10]});
L.circle([${lat},${lng}],{radius:36,color:'rgba(37,99,235,0.45)',fillColor:'rgba(37,99,235,0.14)',fillOpacity:0.5,weight:2}).addTo(map);
L.marker([${lat},${lng}],{icon:icon}).addTo(map);
<\/script>
</body></html>`;
}

export function LiveMap({
  center,
  zoom = 15,
  isTracking = false,
  isLocating = false,
}: MapViewProps & { isTracking?: boolean }) {
  const activeCenter = center ?? FALLBACK_CENTER;
  const html = useMemo(
    () => buildMapHtml(activeCenter[0], activeCenter[1], zoom),
    [activeCenter, zoom],
  );

  return (
    <View style={styles.container}>
      <iframe
        srcDoc={html}
        style={styles.frame as never}
        title="Truck Location Map"
      />
      {!center && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadingText}>
            {isLocating
              ? "Байршил олж байна..."
              : "Web preview дээр газрын зураг бэлэн байна..."}
          </Text>
        </View>
      )}
      <View style={[styles.badge, isTracking && styles.badgeActive]}>
        <Text style={styles.badgeText}>
          {isTracking ? "ОНЛАЙН" : "DEV PREVIEW"}
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
    position: "relative",
  },
  frame: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
    backgroundColor: "#f0f4f8",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  loadingText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
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

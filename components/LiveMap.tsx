import React, { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";

interface MapViewProps {
  center: [number, number] | null;
  zoom?: number;
  isLocating?: boolean;
}

const FALLBACK_CENTER: [number, number] = [47.9188, 106.9176];

const getRegion = (lat: number, lng: number, zoom: number) => {
  const delta = Math.max(0.0025, 0.08 / Math.max(zoom, 1));

  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
};

export function LiveMap({
  center,
  zoom = 15,
  isTracking = false,
  isLocating = false,
}: MapViewProps & { isTracking?: boolean }) {
  const mapRef = useRef<MapView>(null);
  const hasMapReadyRef = useRef(false);
  const activeCenter = center ?? FALLBACK_CENTER;
  const [lat, lng] = activeCenter;
  const region = useMemo(() => getRegion(lat, lng, zoom), [lat, lng, zoom]);

  useEffect(() => {
    if (!center || !hasMapReadyRef.current) {
      return;
    }

    mapRef.current?.animateToRegion(region, 500);
  }, [center, region]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        mapType="standard"
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
        showsIndoorLevelPicker={false}
        onMapReady={() => {
          hasMapReadyRef.current = true;
          if (center) {
            mapRef.current?.animateToRegion(region, 0);
          }
        }}
      >
        {center && (
          <>
            <Circle
              center={{ latitude: lat, longitude: lng }}
              radius={36}
              strokeColor="rgba(37,99,235,0.45)"
              fillColor="rgba(37,99,235,0.14)"
              strokeWidth={2}
            />
            <Marker
              coordinate={{ latitude: lat, longitude: lng }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.markerOuter}>
                <View style={styles.markerInner} />
              </View>
            </Marker>
          </>
        )}
      </MapView>
      {!center && (
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
  },
  markerOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37, 99, 235, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.45)",
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
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

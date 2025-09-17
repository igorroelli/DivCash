import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import polyline from '@mapbox/polyline';

export default function RouteMapScreen({ route }) {
  const { routeCoordinates, startAddress, endAddress } = route.params;

  if (!routeCoordinates) {
    return (
      <View style={styles.centered}>
        <Text>Não foi possível carregar a rota.</Text>
      </View>
    );
  }

  try {
    const points = polyline.decode(routeCoordinates).map(point => ({
      latitude: point[0],
      longitude: point[1],
    }));

    if (points.length === 0) {
      return (
        <View style={styles.centered}><Text>Rota inválida.</Text></View>
      );
    }

    const initialRegion = {
      latitude: points[Math.floor(points.length / 2)].latitude,
      longitude: points[Math.floor(points.length / 2)].longitude,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };

    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          onMapReady={() => this.map.fitToCoordinates(points, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          })}
          ref={ref => { this.map = ref; }}
        >
          <Polyline coordinates={points} strokeColor="#2196F3" strokeWidth={5} />
          <Marker coordinate={points[0]} title="Partida" description={startAddress} />
          <Marker coordinate={points[points.length - 1]} title="Destino" description={endAddress} />
        </MapView>
      </View>
    );
  } catch (error) {
    console.error("Erro ao decodificar a polilinha:", error);
    return (
      <View style={styles.centered}><Text>Erro ao processar a rota.</Text></View>
    );
  }
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center' },
  map: { ...StyleSheet.absoluteFillObject },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
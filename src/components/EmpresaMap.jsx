import React, { useCallback } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

function EmpresaMap({ lat, lng, onLocationChange }) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: "TU_GOOGLE_MAPS_API_KEY" });
  const center = { lat: lat || -33.45694, lng: lng || -70.64827 };

  const handleMapClick = useCallback((e) => {
    if (onLocationChange) {
      onLocationChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  }, [onLocationChange]);

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "200px" }}
      center={center}
      zoom={16}
      onClick={handleMapClick}
    >
      {lat && lng && <Marker position={{ lat, lng }} />}
    </GoogleMap>
  );
}

export default EmpresaMap;
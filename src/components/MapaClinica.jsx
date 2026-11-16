import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
// Importo el CSS de Leaflet: sin él el mapa se ve descuadrado.
import "leaflet/dist/leaflet.css";
import iconoUrl from "leaflet/dist/images/marker-icon.png";
import iconoRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import sombraUrl from "leaflet/dist/images/marker-shadow.png";

// Leaflet busca sus imágenes por una ruta fija que Vite no resuelve, así que le
// indico los archivos empaquetados para que el marcador se vea.
const icono = L.icon({
  iconUrl: iconoUrl,
  iconRetinaUrl: iconoRetinaUrl,
  shadowUrl: sombraUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Ubicación de la clínica en Temuco, Región de La Araucanía.
const UBICACION = [-38.7359, -72.5904];

export default function MapaClinica() {
  return (
    <div className="nv-mapa">
      <MapContainer
        center={UBICACION}
        zoom={15}
        scrollWheelZoom={false}
        className="nv-mapa__lienzo"
        aria-label="Mapa con la ubicación de la clínica en Temuco"
      >
        {/* Uso la cartografía abierta de OpenStreetMap y conservo su atribución. */}
        <TileLayer
          attribution='&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={UBICACION} icon={icono}>
          <Popup>
            Clínica NutriVida
            <br />
            Temuco, Región de La Araucanía
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

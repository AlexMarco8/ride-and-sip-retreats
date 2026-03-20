import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, Trash2, GripVertical } from "lucide-react";

export interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
}

interface RouteEditorProps {
  points: RoutePoint[];
  onChange: (points: RoutePoint[]) => void;
}

const RouteEditor = ({ points, onChange }: RouteEditorProps) => {
  const [newPoint, setNewPoint] = useState({ name: "", lat: "", lng: "" });

  const addPoint = () => {
    const lat = parseFloat(newPoint.lat);
    const lng = parseFloat(newPoint.lng);
    if (!newPoint.name.trim() || isNaN(lat) || isNaN(lng)) return;
    onChange([...points, { lat, lng, name: newPoint.name.trim() }]);
    setNewPoint({ name: "", lat: "", lng: "" });
  };

  const removePoint = (index: number) => {
    onChange(points.filter((_, i) => i !== index));
  };

  const movePoint = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= points.length) return;
    const updated = [...points];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        Ruttpunkter ({points.length})
      </div>

      {points.length > 0 && (
        <div className="space-y-2">
          {points.map((point, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded p-2 text-sm">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => movePoint(i, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => movePoint(i, 1)}
                  disabled={i === points.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <span className="text-foreground font-medium flex-1">{point.name}</span>
              <span className="text-muted-foreground text-xs">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
              <button
                type="button"
                onClick={() => removePoint(i)}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
        <Input
          placeholder="Platsnamn (t.ex. Stockholm)"
          value={newPoint.name}
          onChange={(e) => setNewPoint(p => ({ ...p, name: e.target.value }))}
          className="bg-secondary border-border"
        />
        <Input
          type="number"
          step="any"
          placeholder="Lat"
          value={newPoint.lat}
          onChange={(e) => setNewPoint(p => ({ ...p, lat: e.target.value }))}
          className="bg-secondary border-border w-28"
        />
        <Input
          type="number"
          step="any"
          placeholder="Lng"
          value={newPoint.lng}
          onChange={(e) => setNewPoint(p => ({ ...p, lng: e.target.value }))}
          className="bg-secondary border-border w-28"
        />
        <Button type="button" variant="hero" size="icon" onClick={addPoint}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Tips: Sök efter koordinater på Google Maps — högerklicka på en plats för att kopiera lat/lng.
      </p>
    </div>
  );
};

export default RouteEditor;

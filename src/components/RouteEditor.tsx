import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, Trash2, Search, Loader2 } from "lucide-react";

export interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
}

interface RouteEditorProps {
  points: RoutePoint[];
  onChange: (points: RoutePoint[]) => void;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

const RouteEditor = ({ points, onChange }: RouteEditorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPlaces = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=0`,
        { headers: { "Accept-Language": "sv" } }
      );
      const data: SearchResult[] = await res.json();
      setSearchResults(data);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPlaces(value), 400);
  };

  const addFromSearch = (result: SearchResult) => {
    const shortName = result.display_name.split(",")[0].trim();
    onChange([...points, { lat: parseFloat(result.lat), lng: parseFloat(result.lon), name: shortName }]);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
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
                <button type="button" onClick={() => movePoint(i, -1)} disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none text-[10px]">▲</button>
                <button type="button" onClick={() => movePoint(i, 1)} disabled={i === points.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none text-[10px]">▼</button>
              </div>
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <span className="text-foreground font-medium flex-1">{point.name}</span>
              <span className="text-muted-foreground text-xs">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
              <button type="button" onClick={() => removePoint(i)} className="text-destructive hover:text-destructive/80">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök plats (t.ex. Göteborg, Nürburgring, München)"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="bg-secondary border-border pl-9 pr-9"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {searchResults.map((result, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addFromSearch(result)}
                className="w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors border-b border-border last:border-0 flex items-start gap-3"
              >
                <Plus className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">
                    {result.display_name.split(",")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.display_name.split(",").slice(1).join(",").trim()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
          <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
            Inga resultat hittades
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteEditor;

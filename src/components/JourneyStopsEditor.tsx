import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, Trash2, Search, Loader2, ChevronDown, ChevronUp, Eye, EyeOff, Hotel, Utensils, Beer, Fuel, Camera, Flag, Ship, Calculator } from "lucide-react";

export interface JourneyStop {
  id?: string;
  name: string;
  type: string;
  description?: string;
  lat?: number;
  lng?: number;
  order_index: number;
  is_public: boolean;
  price_per_person?: number;
  quantity?: number;
  unit_cost?: number;
  booking_reference?: string;
  contact_info?: string;
  internal_notes?: string;
}

interface JourneyStopsEditorProps {
  stops: JourneyStop[];
  onChange: (stops: JourneyStop[]) => void;
  participants?: number;
  marginPercent?: number;
  onMarginChange?: (v: number) => void;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

const STOP_TYPES = [
  { value: "hotel", label: "Hotell", icon: Hotel },
  { value: "restaurant", label: "Restaurang", icon: Utensils },
  { value: "brewery", label: "Bryggeri", icon: Beer },
  { value: "activity", label: "Aktivitet", icon: Camera },
  { value: "transport", label: "Transport", icon: Ship },
  { value: "fuel", label: "Tankning", icon: Fuel },
  { value: "stop", label: "Övrigt", icon: Flag },
];

const getTypeIcon = (type: string) => {
  return STOP_TYPES.find(t => t.value === type)?.icon || Flag;
};

const getTypeLabel = (type: string) => {
  return STOP_TYPES.find(t => t.value === type)?.label || "Övrigt";
};

const stopLineCost = (s: JourneyStop): number => {
  const qty = s.quantity || 1;
  const unit = s.unit_cost ?? 0;
  return qty * unit;
};

const JourneyStopsEditor = ({ stops, onChange, participants = 1, marginPercent = 0, onMarginChange }: JourneyStopsEditorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [expandedStop, setExpandedStop] = useState<number | null>(null);
  const [addType, setAddType] = useState("stop");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPlaces = async (query: string) => {
    if (query.trim().length < 2) { setSearchResults([]); setShowResults(false); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=0`, { headers: { "Accept-Language": "sv" } });
      const data: SearchResult[] = await res.json();
      setSearchResults(data);
      setShowResults(true);
    } catch { setSearchResults([]); } finally { setIsSearching(false); }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPlaces(value), 400);
  };

  const addFromSearch = (result: SearchResult) => {
    const shortName = result.display_name.split(",")[0].trim();
    const newStop: JourneyStop = {
      name: shortName, type: addType, lat: parseFloat(result.lat), lng: parseFloat(result.lon),
      order_index: stops.length, is_public: true, quantity: 1,
    };
    onChange([...stops, newStop]);
    setSearchQuery(""); setSearchResults([]); setShowResults(false);
  };

  const removeStop = (index: number) => {
    const updated = stops.filter((_, i) => i !== index).map((s, i) => ({ ...s, order_index: i }));
    onChange(updated);
    if (expandedStop === index) setExpandedStop(null);
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stops.length) return;
    const updated = [...stops];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated.map((s, i) => ({ ...s, order_index: i })));
    if (expandedStop === index) setExpandedStop(newIndex);
    else if (expandedStop === newIndex) setExpandedStop(index);
  };

  const updateStop = (index: number, partial: Partial<JourneyStop>) => {
    const updated = [...stops];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  // Calculations
  const totalCost = stops.reduce((sum, s) => sum + stopLineCost(s), 0);
  const safeParticipants = Math.max(participants, 1);
  const costPerPerson = totalCost / safeParticipants;
  const marginAmount = costPerPerson * (marginPercent / 100);
  const pricePerPerson = costPerPerson + marginAmount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        Resplan & kostnader ({stops.length} stopp)
      </div>

      {stops.length > 0 && (
        <div className="space-y-2">
          {stops.map((stop, i) => {
            const Icon = getTypeIcon(stop.type);
            const isOpen = expandedStop === i;
            const lineCost = stopLineCost(stop);

            return (
              <div key={i} className="bg-secondary/50 rounded-lg border border-border overflow-hidden">
                <div className="flex items-center gap-2 p-3 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => moveStop(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none text-[10px]">▲</button>
                    <button type="button" onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none text-[10px]">▼</button>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium flex-1 truncate">{stop.name}</span>
                  {lineCost > 0 && (
                    <span className="text-xs text-muted-foreground font-mono shrink-0">{lineCost.toLocaleString("sv-SE")} kr</span>
                  )}
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">{getTypeLabel(stop.type)}</span>
                  {stop.is_public ? <Eye className="h-3.5 w-3.5 text-green-500 shrink-0" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  <button type="button" onClick={() => setExpandedStop(isOpen ? null : i)} className="text-muted-foreground hover:text-foreground">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => removeStop(i)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-border p-4 space-y-3 bg-secondary/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Namn</label>
                        <Input value={stop.name} onChange={(e) => updateStop(i, { name: e.target.value })} className="bg-card border-border h-9 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Typ</label>
                        <select value={stop.type} onChange={(e) => updateStop(i, { type: e.target.value })} className="w-full h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground">
                          {STOP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>

                      {/* Cost fields */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Antal (rum/platser/biljetter)</label>
                        <Input type="number" min={1} value={stop.quantity ?? 1} onChange={(e) => updateStop(i, { quantity: parseInt(e.target.value) || 1 })} className="bg-card border-border h-9 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Styckpris (SEK)</label>
                        <Input type="number" value={stop.unit_cost ?? ""} onChange={(e) => updateStop(i, { unit_cost: e.target.value ? parseFloat(e.target.value) : undefined })} className="bg-card border-border h-9 text-sm" placeholder="0" />
                      </div>

                      {lineCost > 0 && (
                        <div className="sm:col-span-2 bg-card rounded-md p-2 border border-border flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Radkostnad ({stop.quantity || 1} × {(stop.unit_cost ?? 0).toLocaleString("sv-SE")})</span>
                          <span className="text-sm font-semibold text-foreground">{lineCost.toLocaleString("sv-SE")} SEK</span>
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Pris per person (publik, valfritt)</label>
                        <Input type="number" value={stop.price_per_person ?? ""} onChange={(e) => updateStop(i, { price_per_person: e.target.value ? parseFloat(e.target.value) : undefined })} className="bg-card border-border h-9 text-sm" placeholder="Visas för kund om satt" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Bokningsreferens</label>
                        <Input value={stop.booking_reference || ""} onChange={(e) => updateStop(i, { booking_reference: e.target.value || undefined })} className="bg-card border-border h-9 text-sm" placeholder="Intern ref" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Kontaktinfo</label>
                        <Input value={stop.contact_info || ""} onChange={(e) => updateStop(i, { contact_info: e.target.value || undefined })} className="bg-card border-border h-9 text-sm" placeholder="Tel, email, kontaktperson" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Beskrivning (publik)</label>
                        <Textarea value={stop.description || ""} onChange={(e) => updateStop(i, { description: e.target.value || undefined })} className="bg-card border-border text-sm" rows={2} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Interna anteckningar</label>
                        <Textarea value={stop.internal_notes || ""} onChange={(e) => updateStop(i, { internal_notes: e.target.value || undefined })} className="bg-card border-border text-sm" rows={2} placeholder="Intern info, ej synlig för kunder" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input type="checkbox" checked={stop.is_public} onChange={(e) => updateStop(i, { is_public: e.target.checked })} className="accent-primary" />
                          Synlig för kunder
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add new stop */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Lägg till som:</label>
          <div className="flex gap-1 flex-wrap">
            {STOP_TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => setAddType(t.value)}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${addType === t.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Sök plats (t.ex. Hotell, stad, bryggeri...)" value={searchQuery} onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)} onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="bg-secondary border-border pl-9 pr-9" />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />}
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              {searchResults.map((result, i) => (
                <button key={i} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addFromSearch(result)}
                  className="w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors border-b border-border last:border-0 flex items-start gap-3">
                  <Plus className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">{result.display_name.split(",")[0]}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.display_name.split(",").slice(1).join(",").trim()}</p>
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

      {/* Cost summary panel */}
      {stops.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calculator className="h-4 w-4 text-primary" />
            Kostnadskalkyl
          </div>

          {/* Line items */}
          <div className="space-y-1.5">
            {stops.filter(s => stopLineCost(s) > 0).map((s, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground/70 truncate pr-4">{s.name} <span className="text-muted-foreground">({s.quantity || 1} × {(s.unit_cost ?? 0).toLocaleString("sv-SE")})</span></span>
                <span className="text-foreground font-mono shrink-0">{stopLineCost(s).toLocaleString("sv-SE")} kr</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total kostnad (hela resan)</span>
              <span className="font-mono">{totalCost.toLocaleString("sv-SE")} SEK</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kostnad per person ({safeParticipants} pers)</span>
              <span className="font-mono">{costPerPerson.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} SEK</span>
            </div>

            {/* Margin control */}
            {onMarginChange && (
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Vinstmarginal %</label>
                <Input type="number" min={0} max={200} value={marginPercent} onChange={(e) => onMarginChange(parseFloat(e.target.value) || 0)}
                  className="bg-secondary border-border h-8 text-sm w-24" />
                <span className="text-xs text-muted-foreground">+{marginAmount.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} SEK/pers</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span>Föreslaget pris per person</span>
              <span className="text-primary font-mono">{pricePerPerson.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} SEK</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyStopsEditor;

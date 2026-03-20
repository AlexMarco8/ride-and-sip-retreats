import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, ChevronRight, X } from "lucide-react";
import { format } from "date-fns";
import RouteMap from "@/components/RouteMap";
import { sv } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const UpcomingEvents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  const { data: events, isLoading } = useQuery({
    queryKey: ["published-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ eventId, ...data }: { eventId: string; name: string; email: string; phone: string; message: string }) => {
      const { error } = await supabase
        .from("event_registrations")
        .insert({ event_id: eventId, name: data.name, email: data.email, phone: data.phone || null, message: data.message || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Anmälan mottagen!", description: "Vi återkommer med mer information." });
      setShowRegister(null);
      setFormData({ name: "", email: "", phone: "", message: "" });
    },
    onError: () => {
      toast({ title: "Något gick fel", description: "Försök igen senare.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;
    registerMutation.mutate({ eventId, ...formData });
  };

  if (isLoading) return null;
  if (!events || events.length === 0) return null;

  return (
    <section id="events" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Kommande <span className="text-gradient">Turer</span>
          </h2>
          <p className="text-cream-muted font-body max-w-xl mx-auto">
            Boka din plats på nästa äventyr
          </p>
        </div>

        <div className="grid gap-6 max-w-4xl mx-auto">
          {events.map((event) => {
            const isExpanded = expandedEvent === event.id;
            const hasRoute = event.route_points && Array.isArray(event.route_points) && (event.route_points as any[]).length > 0;

            return (
              <div
                key={event.id}
                className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-500"
              >
                {/* Compact card — always visible */}
                <button
                  type="button"
                  onClick={() => {
                    setExpandedEvent(isExpanded ? null : event.id);
                    setShowRegister(null);
                  }}
                  className="w-full text-left p-8 flex items-center justify-between gap-6 group hover:bg-secondary/20 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium tracking-widest uppercase text-primary mb-2">
                      {format(new Date(event.event_date), "d MMMM yyyy", { locale: sv })}
                    </p>
                    <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground truncate">
                      {event.title}
                    </h3>
                    {event.location && (
                      <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-90" : "group-hover:translate-x-1"}`}
                  />
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-8 space-y-6">
                      {/* Details row */}
                      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-primary" />
                          {format(new Date(event.event_date), "EEEE d MMMM yyyy, HH:mm", { locale: sv })}
                        </span>
                        {event.max_participants && (
                          <span className="text-muted-foreground">
                            Max {event.max_participants} deltagare
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-foreground/80 font-body leading-relaxed max-w-2xl">
                          {event.description}
                        </p>
                      )}

                      {/* Route Map */}
                      {hasRoute && (
                        <div>
                          <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Rutt</h4>
                          <RouteMap points={event.route_points as any} />
                        </div>
                      )}

                      {/* Register section */}
                      {showRegister === event.id ? (
                        <div className="bg-secondary/30 rounded-lg p-6 border border-border">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-display text-lg text-foreground">Anmälan</h4>
                            <button type="button" onClick={() => setShowRegister(null)} className="text-muted-foreground hover:text-foreground">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <form onSubmit={(e) => handleSubmit(e, event.id)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input placeholder="Namn *" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required className="bg-card border-border" />
                            <Input type="email" placeholder="E-post *" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required className="bg-card border-border" />
                            <Input placeholder="Telefon" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="bg-card border-border" />
                            <Textarea placeholder="Meddelande" value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} className="bg-card border-border sm:col-span-2" />
                            <div className="sm:col-span-2">
                              <Button type="submit" variant="hero" className="w-full sm:w-auto" disabled={registerMutation.isPending}>
                                {registerMutation.isPending ? "Skickar..." : "Skicka anmälan"}
                              </Button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <Button variant="hero" size="lg" onClick={() => setShowRegister(event.id)}>
                          Anmäl dig
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;

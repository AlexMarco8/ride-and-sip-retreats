import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import RouteMap from "@/components/RouteMap";
import { sv } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const UpcomingEvents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
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
      setSelectedEvent(null);
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

        <div className="grid gap-8 max-w-4xl mx-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-card border border-border rounded-lg p-8 hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-3">
                  <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-cream-muted font-body max-w-lg">{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      {format(new Date(event.event_date), "d MMMM yyyy", { locale: sv })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      {format(new Date(event.event_date), "HH:mm")}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {event.location}
                      </span>
                    )}
                    {event.max_participants && (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-primary" />
                        Max {event.max_participants} deltagare
                      </span>
                    )}
                  </div>

                  {/* Route Map */}
                  {event.route_points && Array.isArray(event.route_points) && (event.route_points as any[]).length > 0 && (
                    <RouteMap points={event.route_points as any} className="mt-4" />
                  )}
                </div>

                <Dialog open={selectedEvent === event.id} onOpenChange={(open) => setSelectedEvent(open ? event.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="hero" size="lg" className="shrink-0">
                      Anmäl dig
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl text-foreground">
                        Anmälan: {event.title}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => handleSubmit(e, event.id)} className="space-y-4 mt-4">
                      <Input
                        placeholder="Namn *"
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        required
                        className="bg-secondary border-border"
                      />
                      <Input
                        type="email"
                        placeholder="E-post *"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        required
                        className="bg-secondary border-border"
                      />
                      <Input
                        placeholder="Telefon"
                        value={formData.phone}
                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                        className="bg-secondary border-border"
                      />
                      <Textarea
                        placeholder="Meddelande"
                        value={formData.message}
                        onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                        className="bg-secondary border-border"
                      />
                      <Button type="submit" variant="hero" className="w-full" disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? "Skickar..." : "Skicka anmälan"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;

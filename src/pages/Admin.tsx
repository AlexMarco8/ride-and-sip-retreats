import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { LogOut, Plus, Trash2, Eye, EyeOff, Users, ArrowLeft, Mail, UserCheck, ChevronDown, ChevronUp, Pencil, Save, X, MapPin, ImagePlus, Loader2, DollarSign, Monitor } from "lucide-react";
import RouteEditor, { type RoutePoint } from "@/components/RouteEditor";
import RouteMap from "@/components/RouteMap";
import JourneyStopsEditor, { type JourneyStop } from "@/components/JourneyStopsEditor";
import { Link } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editRoutePoints, setEditRoutePoints] = useState<RoutePoint[]>([]);
  const [editJourneyStops, setEditJourneyStops] = useState<JourneyStop[]>([]);
  const [activeTab, setActiveTab] = useState<"events" | "newsletter" | "interest">("events");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [newEventImageUrl, setNewEventImageUrl] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
  const createImageRef = useRef<HTMLInputElement>(null);
  const editImageRef = useRef<HTMLInputElement>(null);

  const [newEvent, setNewEvent] = useState({
    title: "", description: "", location: "", event_date: "", max_participants: "",
    is_published: false, public_price: "", internal_price_estimate: "", internal_notes: "",
  });
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [journeyStops, setJourneyStops] = useState<JourneyStop[]>([]);
  const [marginPercent, setMarginPercent] = useState(20);
  const [editMarginPercent, setEditMarginPercent] = useState(20);

  const uploadImage = async (file: File, setLoading: (v: boolean) => void): Promise<string | null> => {
    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("event-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(path);
      return publicUrl;
    } catch (err: any) {
      toast({ title: "Bilduppladdning misslyckades", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, setUploadingImage);
    if (url) setNewEventImageUrl(url);
  };

  const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, setEditUploadingImage);
    if (url) setEditImageUrl(url);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkAdmin(session.user.id);
      else { setIsAdmin(false); setLoading(false); }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAdmin(session.user.id);
      else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    setIsAdmin(!!data);
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email: loginEmail, password: loginPassword });
      if (error) toast({ title: "Registrering misslyckades", description: error.message, variant: "destructive" });
      else toast({ title: "Konto skapat!", description: "Kontakta en admin för att få behörighet." });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) toast({ title: "Inloggning misslyckades", description: error.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  };

  // Queries
  const { data: events } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: registrations } = useQuery({
    queryKey: ["admin-registrations", expandedEventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_registrations").select("*").eq("event_id", expandedEventId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!expandedEventId,
  });

  const { data: eventStops } = useQuery({
    queryKey: ["admin-journey-stops", expandedEventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("journey_stops").select("*").eq("event_id", expandedEventId!).order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!expandedEventId,
  });

  const { data: newsletterSubs } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: interestLeads } = useQuery({
    queryKey: ["admin-interest"],
    queryFn: async () => {
      const { data, error } = await supabase.from("interest_leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Save journey stops helper
  const saveJourneyStops = async (eventId: string, stops: JourneyStop[]) => {
    await supabase.from("journey_stops").delete().eq("event_id", eventId);
    if (stops.length > 0) {
      const rows = stops.map((s, i) => ({
        event_id: eventId,
        name: s.name,
        type: s.type,
        description: s.description || null,
        lat: s.lat || null,
        lng: s.lng || null,
        order_index: i,
        is_public: s.is_public,
        price_per_person: s.price_per_person || null,
        quantity: s.quantity || 1,
        unit_cost: s.unit_cost ?? null,
        booking_reference: s.booking_reference || null,
        contact_info: s.contact_info || null,
        internal_notes: s.internal_notes || null,
      }));
      const { error } = await supabase.from("journey_stops").insert(rows);
      if (error) throw error;
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("events").insert({
        title: newEvent.title,
        description: newEvent.description || null,
        location: newEvent.location || null,
        event_date: new Date(newEvent.event_date).toISOString(),
        max_participants: newEvent.max_participants ? parseInt(newEvent.max_participants) : null,
        is_published: newEvent.is_published,
        route_points: routePoints && routePoints.length > 0 ? routePoints : [],
        image_url: newEventImageUrl,
        public_price: newEvent.public_price ? parseFloat(newEvent.public_price) : null,
        internal_price_estimate: newEvent.internal_price_estimate ? parseFloat(newEvent.internal_price_estimate) : null,
        internal_notes: newEvent.internal_notes || null,
      } as any).select().single();
      if (error) throw error;
      // Save journey stops
      if (journeyStops.length > 0) {
        await saveJourneyStops(data.id, journeyStops);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Event skapat!" });
      setShowCreate(false);
      setNewEvent({ title: "", description: "", location: "", event_date: "", max_participants: "", is_published: false, public_price: "", internal_price_estimate: "", internal_notes: "" });
      setRoutePoints([]);
      setJourneyStops([]);
      setNewEventImageUrl(null);
    },
    onError: (err: any) => toast({ title: "Fel", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingEventId || !editForm) return;
      const { error } = await supabase.from("events").update({
        title: editForm.title,
        description: editForm.description || null,
        location: editForm.location || null,
        event_date: new Date(editForm.event_date).toISOString(),
        max_participants: editForm.max_participants ? parseInt(editForm.max_participants) : null,
        is_published: editForm.is_published,
        route_points: editRoutePoints.length > 0 ? JSON.parse(JSON.stringify(editRoutePoints)) : [],
        image_url: editImageUrl,
        public_price: editForm.public_price ? parseFloat(editForm.public_price) : null,
        internal_price_estimate: editForm.internal_price_estimate ? parseFloat(editForm.internal_price_estimate) : null,
        internal_notes: editForm.internal_notes || null,
      }).eq("id", editingEventId);
      if (error) throw error;
      await saveJourneyStops(editingEventId, editJourneyStops);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-journey-stops"] });
      toast({ title: "Event uppdaterat!" });
      setEditingEventId(null);
      setEditForm(null);
      setEditImageUrl(null);
    },
    onError: (err: any) => toast({ title: "Fel", description: err.message, variant: "destructive" }),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("events").update({ is_published: !published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-events"] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Event borttaget" });
    },
  });

  const startEditing = (event: any) => {
    const dateStr = new Date(event.event_date).toISOString().slice(0, 16);
    setEditingEventId(event.id);
    setEditForm({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      event_date: dateStr,
      max_participants: event.max_participants?.toString() || "",
      is_published: event.is_published,
      public_price: event.public_price?.toString() || "",
      internal_price_estimate: event.internal_price_estimate?.toString() || "",
      internal_notes: event.internal_notes || "",
    });
    const pts = Array.isArray(event.route_points) ? event.route_points as RoutePoint[] : [];
    setEditRoutePoints(pts);
    setEditImageUrl(event.image_url || null);
    // Load stops
    setEditJourneyStops(eventStops?.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      description: s.description || undefined,
      lat: s.lat || undefined,
      lng: s.lng || undefined,
      order_index: s.order_index,
      is_public: s.is_public,
      price_per_person: s.price_per_person || undefined,
      booking_reference: s.booking_reference || undefined,
      contact_info: s.contact_info || undefined,
      internal_notes: s.internal_notes || undefined,
    })) || []);
  };

  const cancelEditing = () => {
    setEditingEventId(null);
    setEditForm(null);
    setEditImageUrl(null);
  };

  const toggleExpand = (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
      cancelEditing();
      setPreviewEventId(null);
    } else {
      setExpandedEventId(eventId);
      cancelEditing();
      setPreviewEventId(null);
    }
  };

  // Loading / Login / Access denied
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Laddar...</p></div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="font-display text-3xl font-semibold text-foreground mb-2">Admin</h1>
            <p className="text-muted-foreground text-sm">{isSignUp ? "Skapa konto" : "Logga in för att hantera events"}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="email" placeholder="E-post" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="bg-secondary border-border" required />
            <Input type="password" placeholder="Lösenord" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="bg-secondary border-border" required />
            <Button type="submit" variant="hero" className="w-full">{isSignUp ? "Skapa konto" : "Logga in"}</Button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-primary hover:underline w-full text-center">
            {isSignUp ? "Har redan konto? Logga in" : "Inget konto? Skapa ett"}
          </button>
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground justify-center"><ArrowLeft className="h-4 w-4" /> Tillbaka till startsidan</Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <h1 className="font-display text-3xl font-semibold text-foreground">Åtkomst nekad</h1>
          <p className="text-muted-foreground">Du har inte administratörsbehörighet.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/"><Button variant="heroOutline">Startsidan</Button></Link>
            <Button variant="hero" onClick={handleLogout}>Logga ut</Button>
          </div>
        </div>
      </div>
    );
  }

  // Public preview component for an event
  const PublicPreview = ({ event }: { event: any }) => {
    const stops = eventStops?.filter(s => s.is_public) || [];
    const hasRoute = event.route_points && Array.isArray(event.route_points) && (event.route_points as any[]).length > 0;

    return (
      <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 bg-background">
        <div className="flex items-center gap-2 mb-4 text-xs text-primary font-medium tracking-widest uppercase">
          <Monitor className="h-4 w-4" /> Publik förhandsgranskning
        </div>
        <div className="space-y-4">
          <p className="text-xs font-medium tracking-widest uppercase text-primary">
            {format(new Date(event.event_date), "d MMMM yyyy", { locale: sv })}
          </p>
          <h3 className="font-display text-2xl font-semibold text-foreground">{event.title}</h3>
          {event.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{event.location}</p>
          )}
          {event.image_url && <img src={event.image_url} alt={event.title} className="w-full max-h-48 object-cover rounded-lg" />}
          {event.description && <p className="text-foreground/80 text-sm leading-relaxed">{event.description}</p>}
          {event.public_price && (
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              {parseFloat(event.public_price).toLocaleString("sv-SE")} SEK / person
            </div>
          )}
          {stops.length > 0 && (
            <div>
              <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">Resplan</h4>
              <div className="space-y-2">
                {stops.map((stop, i) => (
                  <div key={stop.id} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-foreground font-medium">{stop.name}</p>
                      {stop.description && <p className="text-muted-foreground text-xs">{stop.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasRoute && <RouteMap points={event.route_points as any} />}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="font-display text-2xl font-semibold text-foreground">Backoffice</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground"><LogOut className="h-4 w-4 mr-2" /> Logga ut</Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {[
            { key: "events" as const, label: "Events", icon: <Users className="h-4 w-4" /> },
            { key: "newsletter" as const, label: "Nyhetsbrev", icon: <Mail className="h-4 w-4" /> },
            { key: "interest" as const, label: "Intresseanmälningar", icon: <UserCheck className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "events" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-xl text-foreground">Events & Journeys</h2>
              <Button variant="hero" onClick={() => setShowCreate(!showCreate)}><Plus className="h-4 w-4 mr-2" /> Ny journey</Button>
            </div>

            {showCreate && (
              <div className="bg-card border border-border rounded-lg p-6 mb-8">
                <h3 className="font-display text-lg text-foreground mb-4">Skapa ny journey</h3>
                <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-6">
                  {/* Basic info */}
                  <div>
                    <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Grundläggande info</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Titel *" value={newEvent.title} onChange={(e) => setNewEvent(p => ({ ...p, title: e.target.value }))} className="bg-secondary border-border" required />
                      <Input placeholder="Plats" value={newEvent.location} onChange={(e) => setNewEvent(p => ({ ...p, location: e.target.value }))} className="bg-secondary border-border" />
                      <Input type="datetime-local" value={newEvent.event_date} onChange={(e) => setNewEvent(p => ({ ...p, event_date: e.target.value }))} className="bg-secondary border-border" required />
                      <Input type="number" placeholder="Max deltagare" value={newEvent.max_participants} onChange={(e) => setNewEvent(p => ({ ...p, max_participants: e.target.value }))} className="bg-secondary border-border" />
                      <Textarea placeholder="Beskrivning (publik)" value={newEvent.description} onChange={(e) => setNewEvent(p => ({ ...p, description: e.target.value }))} className="bg-secondary border-border md:col-span-2" />
                    </div>
                  </div>

                  {/* Image */}
                  <div>
                    <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Eventbild</h4>
                    <input ref={createImageRef} type="file" accept="image/*" onChange={handleCreateImageChange} className="hidden" />
                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" size="sm" onClick={() => createImageRef.current?.click()} disabled={uploadingImage}>
                        {uploadingImage ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Laddar upp...</> : <><ImagePlus className="h-4 w-4 mr-1" /> Välj bild</>}
                      </Button>
                      {newEventImageUrl && (
                        <div className="relative">
                          <img src={newEventImageUrl} alt="Preview" className="h-16 w-24 object-cover rounded border border-border" />
                          <button type="button" onClick={() => setNewEventImageUrl(null)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" /> Prissättning
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Pris per person (publik) SEK</label>
                        <Input type="number" placeholder="Visas för kunden" value={newEvent.public_price} onChange={(e) => setNewEvent(p => ({ ...p, public_price: e.target.value }))} className="bg-secondary border-border" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                          Intern kostnadskalkyl SEK <EyeOff className="h-3 w-3 text-muted-foreground" />
                        </label>
                        <Input type="number" placeholder="Ej synlig för kund" value={newEvent.internal_price_estimate} onChange={(e) => setNewEvent(p => ({ ...p, internal_price_estimate: e.target.value }))} className="bg-secondary border-border" />
                      </div>
                    </div>
                  </div>

                  {/* Internal notes */}
                  <div>
                    <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
                      <EyeOff className="h-3.5 w-3.5" /> Interna anteckningar
                    </h4>
                    <Textarea placeholder="Intern planering, ej synlig för kunder..." value={newEvent.internal_notes} onChange={(e) => setNewEvent(p => ({ ...p, internal_notes: e.target.value }))} className="bg-secondary border-border" />
                  </div>

                  {/* Journey Stops */}
                  <div>
                    <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Resplan & stopp</h4>
                    <JourneyStopsEditor stops={journeyStops} onChange={setJourneyStops} />
                  </div>

                  {/* Route */}
                  <div>
                    <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Ruttpunkter (karta)</h4>
                    <RouteEditor points={routePoints} onChange={setRoutePoints} />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input type="checkbox" checked={newEvent.is_published} onChange={(e) => setNewEvent(p => ({ ...p, is_published: e.target.checked }))} className="accent-primary" />
                      Publicera direkt
                    </label>
                    <Button type="submit" variant="hero" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Skapar..." : "Skapa journey"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Events list */}
            <div className="space-y-4">
              {events?.map((event) => {
                const isExpanded = expandedEventId === event.id;
                const isEditing = editingEventId === event.id;
                const isPreview = previewEventId === event.id;
                const eventRoutePoints = Array.isArray(event.route_points) ? event.route_points as unknown as RoutePoint[] : [];

                return (
                  <div key={event.id} className="bg-card border border-border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleExpand(event.id)}
                      className="w-full text-left p-6 flex items-center justify-between gap-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-display text-xl text-foreground truncate">{event.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${event.is_published ? "bg-green-900/50 text-green-400" : "bg-muted text-muted-foreground"}`}>
                            {event.is_published ? "Publicerad" : "Utkast"}
                          </span>
                          {(event as any).public_price && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                              {parseFloat((event as any).public_price).toLocaleString("sv-SE")} SEK
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.event_date), "d MMMM yyyy HH:mm", { locale: sv })}
                          {event.location && ` · ${event.location}`}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border">
                        {/* Action bar */}
                        <div className="flex gap-2 px-6 py-3 bg-secondary/20 border-b border-border flex-wrap">
                          {!isEditing ? (
                            <Button variant="ghost" size="sm" onClick={() => startEditing(event)}><Pencil className="h-4 w-4 mr-1" /> Redigera</Button>
                          ) : (
                            <>
                              <Button variant="hero" size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                                <Save className="h-4 w-4 mr-1" /> {updateMutation.isPending ? "Sparar..." : "Spara"}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={cancelEditing}><X className="h-4 w-4 mr-1" /> Avbryt</Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setPreviewEventId(isPreview ? null : event.id)}>
                            <Monitor className="h-4 w-4 mr-1" /> {isPreview ? "Dölj förhandsgranskning" : "Publik vy"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => togglePublish.mutate({ id: event.id, published: event.is_published })}>
                            {event.is_published ? <><EyeOff className="h-4 w-4 mr-1" /> Avpublicera</> : <><Eye className="h-4 w-4 mr-1" /> Publicera</>}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Vill du verkligen ta bort detta event?")) deleteEvent.mutate(event.id); }} className="text-destructive hover:text-destructive ml-auto">
                            <Trash2 className="h-4 w-4 mr-1" /> Ta bort
                          </Button>
                        </div>

                        <div className="p-6 space-y-6">
                          {/* Public preview */}
                          {isPreview && <PublicPreview event={event} />}

                          {/* Edit form */}
                          {isEditing && editForm ? (
                            <div className="space-y-6">
                              {/* Basic info */}
                              <div>
                                <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Grundläggande info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div><label className="text-xs text-muted-foreground mb-1 block">Titel</label><Input value={editForm.title} onChange={(e) => setEditForm((p: any) => ({ ...p, title: e.target.value }))} className="bg-secondary border-border" /></div>
                                  <div><label className="text-xs text-muted-foreground mb-1 block">Plats</label><Input value={editForm.location} onChange={(e) => setEditForm((p: any) => ({ ...p, location: e.target.value }))} className="bg-secondary border-border" /></div>
                                  <div><label className="text-xs text-muted-foreground mb-1 block">Datum & tid</label><Input type="datetime-local" value={editForm.event_date} onChange={(e) => setEditForm((p: any) => ({ ...p, event_date: e.target.value }))} className="bg-secondary border-border" /></div>
                                  <div><label className="text-xs text-muted-foreground mb-1 block">Max deltagare</label><Input type="number" value={editForm.max_participants} onChange={(e) => setEditForm((p: any) => ({ ...p, max_participants: e.target.value }))} className="bg-secondary border-border" /></div>
                                  <div className="md:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Beskrivning (publik)</label><Textarea value={editForm.description} onChange={(e) => setEditForm((p: any) => ({ ...p, description: e.target.value }))} className="bg-secondary border-border" /></div>
                                </div>
                              </div>

                              {/* Image */}
                              <div>
                                <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Eventbild</h4>
                                <input ref={editImageRef} type="file" accept="image/*" onChange={handleEditImageChange} className="hidden" />
                                <div className="flex items-center gap-4">
                                  <Button type="button" variant="outline" size="sm" onClick={() => editImageRef.current?.click()} disabled={editUploadingImage}>
                                    {editUploadingImage ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Laddar upp...</> : <><ImagePlus className="h-4 w-4 mr-1" /> Byt bild</>}
                                  </Button>
                                  {editImageUrl && (
                                    <div className="relative">
                                      <img src={editImageUrl} alt="Preview" className="h-16 w-24 object-cover rounded border border-border" />
                                      <button type="button" onClick={() => setEditImageUrl(null)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Pricing */}
                              <div>
                                <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Prissättning</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div><label className="text-xs text-muted-foreground mb-1 block">Pris per person (publik) SEK</label><Input type="number" value={editForm.public_price} onChange={(e) => setEditForm((p: any) => ({ ...p, public_price: e.target.value }))} className="bg-secondary border-border" /></div>
                                  <div><label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">Intern kostnadskalkyl SEK <EyeOff className="h-3 w-3" /></label><Input type="number" value={editForm.internal_price_estimate} onChange={(e) => setEditForm((p: any) => ({ ...p, internal_price_estimate: e.target.value }))} className="bg-secondary border-border" /></div>
                                </div>
                                {/* Margin calc */}
                                {editForm.public_price && editForm.internal_price_estimate && (
                                  <div className="mt-2 text-xs text-muted-foreground bg-secondary/30 rounded p-2">
                                    Marginal: {(parseFloat(editForm.public_price) - parseFloat(editForm.internal_price_estimate)).toLocaleString("sv-SE")} SEK / person
                                    ({((1 - parseFloat(editForm.internal_price_estimate) / parseFloat(editForm.public_price)) * 100).toFixed(1)}%)
                                  </div>
                                )}
                              </div>

                              {/* Internal notes */}
                              <div>
                                <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5" /> Interna anteckningar</h4>
                                <Textarea value={editForm.internal_notes} onChange={(e) => setEditForm((p: any) => ({ ...p, internal_notes: e.target.value }))} className="bg-secondary border-border" placeholder="Intern planering..." />
                              </div>

                              {/* Journey Stops */}
                              <div>
                                <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Resplan & stopp</h4>
                                <JourneyStopsEditor stops={editJourneyStops} onChange={setEditJourneyStops} />
                              </div>

                              {/* Route */}
                              <div>
                                <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Ruttpunkter (karta)</h4>
                                <RouteEditor points={editRoutePoints} onChange={setEditRoutePoints} />
                                {editRoutePoints.length > 0 && <div className="mt-3"><RouteMap points={editRoutePoints} /></div>}
                              </div>

                              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                                <input type="checkbox" checked={editForm.is_published} onChange={(e) => setEditForm((p: any) => ({ ...p, is_published: e.target.checked }))} className="accent-primary" />
                                Publicerad
                              </label>
                            </div>
                          ) : !isPreview && (
                            /* Detail view (non-editing) */
                            <div className="space-y-4">
                              {event.image_url && <img src={event.image_url} alt={event.title} className="w-full max-h-64 object-cover rounded-lg border border-border" />}
                              {event.description && (
                                <div><h4 className="text-xs font-medium text-muted-foreground mb-1">Beskrivning</h4><p className="text-sm text-foreground">{event.description}</p></div>
                              )}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><h4 className="text-xs font-medium text-muted-foreground mb-1">Datum</h4><p className="text-sm text-foreground">{format(new Date(event.event_date), "d MMMM yyyy HH:mm", { locale: sv })}</p></div>
                                {event.location && <div><h4 className="text-xs font-medium text-muted-foreground mb-1">Plats</h4><p className="text-sm text-foreground">{event.location}</p></div>}
                                {event.max_participants && <div><h4 className="text-xs font-medium text-muted-foreground mb-1">Max deltagare</h4><p className="text-sm text-foreground">{event.max_participants}</p></div>}
                                {(event as any).public_price && <div><h4 className="text-xs font-medium text-muted-foreground mb-1">Pris (publik)</h4><p className="text-sm text-foreground">{parseFloat((event as any).public_price).toLocaleString("sv-SE")} SEK</p></div>}
                              </div>

                              {/* Internal info */}
                              {((event as any).internal_price_estimate || (event as any).internal_notes) && (
                                <div className="bg-secondary/30 rounded-lg p-4 border border-dashed border-border space-y-2">
                                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1"><EyeOff className="h-3 w-3" /> Intern information</h4>
                                  {(event as any).internal_price_estimate && (
                                    <p className="text-sm text-foreground">Kostnadskalkyl: {parseFloat((event as any).internal_price_estimate).toLocaleString("sv-SE")} SEK / person</p>
                                  )}
                                  {(event as any).public_price && (event as any).internal_price_estimate && (
                                    <p className="text-xs text-muted-foreground">
                                      Marginal: {(parseFloat((event as any).public_price) - parseFloat((event as any).internal_price_estimate)).toLocaleString("sv-SE")} SEK
                                      ({((1 - parseFloat((event as any).internal_price_estimate) / parseFloat((event as any).public_price)) * 100).toFixed(1)}%)
                                    </p>
                                  )}
                                  {(event as any).internal_notes && <p className="text-sm text-foreground/70">{(event as any).internal_notes}</p>}
                                </div>
                              )}

                              {/* Journey Stops */}
                              {eventStops && eventStops.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> Resplan ({eventStops.length} stopp)</h4>
                                  <div className="space-y-2">
                                    {eventStops.map((stop, i) => (
                                      <div key={stop.id} className="bg-secondary/50 rounded p-3 text-sm flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">{stop.name}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{stop.type}</span>
                                            {stop.is_public ? <Eye className="h-3 w-3 text-green-500" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                                          </div>
                                          {stop.price_per_person && <p className="text-xs text-muted-foreground">{stop.price_per_person.toLocaleString("sv-SE")} SEK / person</p>}
                                          {stop.booking_reference && <p className="text-xs text-muted-foreground">Ref: {stop.booking_reference}</p>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {eventRoutePoints.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> Rutt ({eventRoutePoints.length} punkter)</h4>
                                  <RouteMap points={eventRoutePoints} />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Registrations */}
                          <div className="border-t border-border pt-4">
                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Anmälningar ({registrations?.length || 0})</h4>
                            {!registrations || registrations.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Inga anmälningar ännu.</p>
                            ) : (
                              <div className="space-y-2">
                                {registrations.map((reg) => (
                                  <div key={reg.id} className="bg-secondary/50 rounded p-3 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-foreground font-medium">{reg.name}</span>
                                      <span className="text-muted-foreground">{format(new Date(reg.created_at), "d MMM yyyy", { locale: sv })}</span>
                                    </div>
                                    <p className="text-muted-foreground">{reg.email}{reg.phone && ` · ${reg.phone}`}</p>
                                    {reg.message && <p className="text-foreground/70 mt-1">{reg.message}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {(!events || events.length === 0) && (
                <p className="text-center text-muted-foreground py-12">Inga events ännu. Skapa din första journey!</p>
              )}
            </div>
          </>
        )}

        {activeTab === "newsletter" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl text-foreground mb-4">Nyhetsbrevsprenumeranter ({newsletterSubs?.length || 0})</h2>
            {newsletterSubs && newsletterSubs.length > 0 ? (
              newsletterSubs.map((sub) => (
                <div key={sub.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-foreground">{sub.email}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(sub.created_at), "d MMMM yyyy HH:mm", { locale: sv })}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-12">Inga prenumeranter ännu.</p>
            )}
          </div>
        )}

        {activeTab === "interest" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl text-foreground mb-4">Intresseanmälningar ({interestLeads?.length || 0})</h2>
            {interestLeads && interestLeads.length > 0 ? (
              interestLeads.map((lead) => (
                <div key={lead.id} className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-foreground font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.email}{lead.phone && ` · ${lead.phone}`}</p>
                      {lead.message && <p className="text-foreground/70 text-sm mt-2">{lead.message}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{format(new Date(lead.created_at), "d MMM yyyy", { locale: sv })}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-12">Inga intresseanmälningar ännu.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { LogOut, Plus, Trash2, Eye, EyeOff, Users, ArrowLeft, Mail, UserCheck } from "lucide-react";
import RouteEditor, { type RoutePoint } from "@/components/RouteEditor";
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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"events" | "newsletter" | "interest">("events");

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    max_participants: "",
    is_published: false,
  });
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAdmin(session.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAdmin(session.user.id);
      } else {
        setLoading(false);
      }
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
    queryKey: ["admin-registrations", selectedEventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_registrations").select("*").eq("event_id", selectedEventId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEventId,
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").insert({
        title: newEvent.title,
        description: newEvent.description || null,
        location: newEvent.location || null,
        event_date: new Date(newEvent.event_date).toISOString(),
        max_participants: newEvent.max_participants ? parseInt(newEvent.max_participants) : null,
        is_published: newEvent.is_published,
        route_points: routePoints.length > 0 ? routePoints : [],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Event skapat!" });
      setShowCreate(false);
      setNewEvent({ title: "", description: "", location: "", event_date: "", max_participants: "", is_published: false });
      setRoutePoints([]);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="font-display text-3xl font-semibold text-foreground mb-2">Admin</h1>
            <p className="text-muted-foreground text-sm">
              {isSignUp ? "Skapa konto" : "Logga in för att hantera events"}
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="E-post"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="bg-secondary border-border"
              required
            />
            <Input
              type="password"
              placeholder="Lösenord"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="bg-secondary border-border"
              required
            />
            <Button type="submit" variant="hero" className="w-full">
              {isSignUp ? "Skapa konto" : "Logga in"}
            </Button>
          </form>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:underline w-full text-center"
          >
            {isSignUp ? "Har redan konto? Logga in" : "Inget konto? Skapa ett"}
          </button>
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground justify-center">
            <ArrowLeft className="h-4 w-4" /> Tillbaka till startsidan
          </Link>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-2xl font-semibold text-foreground">Backoffice</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Logga ut
          </Button>
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
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "events" && (
        <>
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-xl text-foreground">Events</h2>
          <Button variant="hero" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="h-4 w-4 mr-2" /> Nytt event
          </Button>
        </div>

        {showCreate && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h3 className="font-display text-lg text-foreground mb-4">Skapa nytt event</h3>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Input
                placeholder="Titel *"
                value={newEvent.title}
                onChange={(e) => setNewEvent(p => ({ ...p, title: e.target.value }))}
                className="bg-secondary border-border"
                required
              />
              <Input
                placeholder="Plats"
                value={newEvent.location}
                onChange={(e) => setNewEvent(p => ({ ...p, location: e.target.value }))}
                className="bg-secondary border-border"
              />
              <Input
                type="datetime-local"
                value={newEvent.event_date}
                onChange={(e) => setNewEvent(p => ({ ...p, event_date: e.target.value }))}
                className="bg-secondary border-border"
                required
              />
              <Input
                type="number"
                placeholder="Max deltagare"
                value={newEvent.max_participants}
                onChange={(e) => setNewEvent(p => ({ ...p, max_participants: e.target.value }))}
                className="bg-secondary border-border"
              />
              <Textarea
                placeholder="Beskrivning"
                value={newEvent.description}
                onChange={(e) => setNewEvent(p => ({ ...p, description: e.target.value }))}
                className="bg-secondary border-border md:col-span-2"
              />
              <div className="md:col-span-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEvent.is_published}
                    onChange={(e) => setNewEvent(p => ({ ...p, is_published: e.target.checked }))}
                    className="accent-primary"
                  />
                  Publicera direkt
                </label>
                <Button type="submit" variant="hero" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Skapar..." : "Skapa event"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Events list */}
        <div className="space-y-4">
          {events?.map((event) => (
            <div key={event.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-xl text-foreground">{event.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${event.is_published ? "bg-green-900/50 text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {event.is_published ? "Publicerad" : "Utkast"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.event_date), "d MMMM yyyy HH:mm", { locale: sv })}
                    {event.location && ` · ${event.location}`}
                  </p>
                  {event.description && <p className="text-sm text-cream-muted mt-2">{event.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEventId(selectedEventId === event.id ? null : event.id)}
                    title="Visa anmälningar"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePublish.mutate({ id: event.id, published: event.is_published })}
                    title={event.is_published ? "Avpublicera" : "Publicera"}
                  >
                    {event.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteEvent.mutate(event.id)}
                    className="text-destructive hover:text-destructive"
                    title="Ta bort"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Registrations */}
              {selectedEventId === event.id && registrations && (
                <div className="mt-6 border-t border-border pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Anmälningar ({registrations.length})
                  </h4>
                  {registrations.length === 0 ? (
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
                          {reg.message && <p className="text-cream-muted mt-1">{reg.message}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {(!events || events.length === 0) && (
            <p className="text-center text-muted-foreground py-12">Inga events ännu. Skapa ditt första event!</p>
          )}
        </div>
        </>
        )}

        {activeTab === "newsletter" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl text-foreground mb-4">
              Nyhetsbrevsprenumeranter ({newsletterSubs?.length || 0})
            </h2>
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
            <h2 className="font-display text-xl text-foreground mb-4">
              Intresseanmälningar ({interestLeads?.length || 0})
            </h2>
            {interestLeads && interestLeads.length > 0 ? (
              interestLeads.map((lead) => (
                <div key={lead.id} className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-foreground font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.email}{lead.phone && ` · ${lead.phone}`}</p>
                      {lead.message && <p className="text-cream-muted text-sm mt-2">{lead.message}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(lead.created_at), "d MMM yyyy", { locale: sv })}
                    </span>
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

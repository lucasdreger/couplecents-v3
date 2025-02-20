import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainNavigation } from "components/MainNavigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, PiggyBank, LineChart, Clock, Users2 } from "lucide-react";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../utils/store";
import { toast } from "sonner";

export default function App() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { setSession, setUser } = useAuthStore();

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session:', session);
        
        if (!session?.user) {
          console.log('No session, setting null');
          setSession(null);
          setUser(null);
          return;
        }

        console.log('Loading profile for user:', session.user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          toast.error('Error loading profile');
          setSession(null);
          setUser(null);
          return;
        }

        console.log('Profile loaded:', profile);
        setSession(session);
        setUser(profile);
      } catch (error) {
        console.error('Error checking session:', error);
        toast.error('Error loading profile');
        setSession(null);
        setUser(null);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      if (session?.user) {
        try {
          console.log('Loading profile for user:', session.user.id);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error loading profile:', error);
            toast.error('Error loading profile');
            setSession(null);
            setUser(null);
          } else {
            console.log('Profile loaded:', profile);
            setSession(session);
            setUser(profile);
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          toast.error('Error loading profile');
          setSession(null);
          setUser(null);
        }
      } else {
        console.log('No session, setting null');
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setUser]);

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CoupleCents
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Smart Finance Management
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              for Modern Couples
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track expenses, manage investments, and achieve your financial goals together.
            Real-time updates keep you both in sync.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/Login")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Get Started
          </Button>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <PiggyBank className="h-12 w-12 mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Budget Together</h3>
              <p className="text-muted-foreground">
                Set and track shared budgets, manage fixed expenses, and monitor variable spending in real-time.
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <LineChart className="h-12 w-12 mb-4 text-purple-600" />
              <h3 className="text-xl font-semibold mb-2">Investment Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your investments and reserves with automatic updates and manual override capabilities.
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Clock className="h-12 w-12 mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Real-Time Updates</h3>
              <p className="text-muted-foreground">
                See changes instantly as you and your partner update expenses, complete tasks, or modify budgets.
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Users2 className="h-12 w-12 mb-4 text-purple-600" />
              <h3 className="text-xl font-semibold mb-2">Couple-Focused</h3>
              <p className="text-muted-foreground">
                Designed specifically for couples with separate incomes who want to manage finances together.
              </p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Take Control of Your
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Financial Future?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join other professional couples who are already managing their finances smarter with CoupleCents.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/Login")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Start Your Journey
          </Button>
        </section>
      </main>
    </div>
  );
}

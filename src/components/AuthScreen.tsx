import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthScreen() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, continueAsGuest, supabaseAvailable } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const err = mode === "signin"
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password);
    setBusy(false);
    if (err) toast.error(err);
    else if (mode === "signup") toast.success("Account created. Please check your email to confirm. Hare Krishna 🙏");
  };

  return (
    <main className="soft-gradient-bg mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-xl border border-primary/30 bg-primary text-primary-foreground shadow-soft">
          <span className="font-display text-3xl leading-none">S</span>
        </div>
        <h1 className="font-display text-[2.75rem] font-semibold leading-none">Sadhana Card</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A gentle companion for your daily practice
        </p>
      </div>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {supabaseAvailable ? (
            <>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input id="password" type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button size="lg" className="w-full" onClick={submit} disabled={busy || !email || !password}>
                {mode === "signin" ? "Sign in" : "Sign up"}
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={signInWithGoogle}>
                Continue with Google
              </Button>
              <button
                className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
                {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
              </button>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Cloud sync is not configured on this build, so your practice will be kept on this device.
            </p>
          )}
          <div className="border-t border-white/35 pt-4">
            <Button variant="secondary" size="lg" className="w-full" onClick={continueAsGuest}>
              Continue as guest
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Use the full app on this device without an account. You can create a backup from Settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

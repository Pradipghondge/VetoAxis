'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Mail,
  Lock,
  AlertCircle,
  ChevronRight,
  Info,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login, loading, error, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') || '/dashboard';

  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      await login(email, password);
      window.location.href = redirectTo;
    } catch (err: any) {
      setLoginError(err.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] bg-[#8b5cf6]/10 blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <div className="absolute top-8 left-8">
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] z-10"
      >
        {/* Centered Logo Section */}
        <div className="flex flex-col items-center mb-8">
            <img src="/logo.png" alt="Logo" className="h-50 w-50 object-contain" />
        </div>

        {/* Updated Card Styling */}
        <Card className="border-white/10 bg-[#111114]/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-6 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Welcome back</CardTitle>
            <CardDescription className="text-neutral-400">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>

          {searchParams.get('from') && (
            <div className="px-6 pb-4">
              <Alert className="bg-[#8b5cf6]/10 text-violet-300 border-[#8b5cf6]/20 py-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs font-medium">
                  Authentication required for this section.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {(loginError || error) && (
                <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {loginError || error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-600" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@velocity.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-neutral-600 focus:ring-violet-500 focus:border-violet-500 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-600" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white focus:ring-violet-500 focus:border-violet-500 rounded-xl"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col mt-4 space-y-4 pb-8">
              <Button
                type="submit"
                className="w-full h-12 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] rounded-xl border-t border-white/20 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <Separator className="bg-white/5" />
            </CardFooter>
          </form>
        </Card>
      </motion.div>

      <div className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">
        <p>© {new Date().getFullYear()} Velocity Systems — High Performance CRM</p>
      </div>
    </div>
  );
}
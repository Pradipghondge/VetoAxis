'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  Zap,
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
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      {/* Top Navigation */}
      <div className="absolute top-8 left-8">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-sky-600 transition-colors"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[400px]"
      >
        {/* Centered Large Icon/Logo */}
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="h-50 w-50 rounded-2xl flex items-center justify-center mb-4"
          >
            <img src="/logo.png" alt="Velocity Logo"className="h-50 w-50 text-white fill-white" />
          </motion.div>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-6 text-center">
            <CardTitle className="text-xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>

          {searchParams.get('from') && (
            <div className="px-6 pb-4">
              <Alert className="bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/50 py-2">
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
                <Alert variant="destructive" className="bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {loginError || error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@velocity.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pb-8">
              <Button
                type="submit"
                className="w-full h-11 bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-lg shadow-sky-500/25 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <Separator className="bg-slate-100 dark:bg-slate-800" />

            </CardFooter>
          </form>
        </Card>
      </motion.div>

      <div className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        <p>© {new Date().getFullYear()} Velocity Systems — High Performance CRM</p>
      </div>
    </div>
  );
}
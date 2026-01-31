'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, loading, error, user } = useAuth();
  const router = useRouter();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      router.push('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow Effect Removed */}
      <Card className="w-full max-w-md border-stone-200 bg-white shadow-sm">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 text-center">Create an account</CardTitle>
          <CardDescription className="text-gray-600 text-center">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-gray-700">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-3 h-12 bg-white border-gray-300 text-gray-900 focus:ring-gray-500 focus:border-gray-500 rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-3 h-12 bg-white border-gray-300 text-gray-900 focus:ring-gray-500 focus:border-gray-500 rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-3 h-12 bg-white border-gray-300 text-gray-900 focus:ring-gray-500 focus:border-gray-500 rounded-lg"
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-bold transition-all rounded-lg mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-normal tracking-normal ml-1 text-gray-900 hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

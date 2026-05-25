import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/src/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/src/services/api';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Email or Phone is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { setAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', data);
      const { user, token } = response.data;
      setAuth(user, token);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] overflow-y-auto flex items-center justify-center p-6 bg-gray-50/50 relative font-sans">
      {/* Dynamic Background Accents */}
      <div className="absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff5200]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <Card className="rounded-2xl border border-gray-100 shadow-xl bg-white p-6 sm:p-8 relative overflow-hidden">
          {/* Top Brand Accent strip */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff5200] to-orange-400" />
          
          <CardHeader className="space-y-1.5 text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-[#ff5200] mb-4 border border-orange-100/50">
              <KeyRound className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome to <span className="text-[#ff5200]">Geekhoot</span>
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-xs font-semibold text-gray-700">Email Address or Phone</Label>
                <div className="relative group">
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="name@example.com / 9876543210"
                    className="pl-10 h-11 rounded-lg border-gray-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-[#ff5200] transition-colors"
                    {...form.register('identifier')}
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-[#ff5200] transition-colors" />
                </div>
                {form.formState.errors.identifier && (
                  <p className="text-xs font-medium text-red-500">{form.formState.errors.identifier.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-gray-700">Password</Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 rounded-lg border-gray-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-[#ff5200] transition-colors"
                    {...form.register('password')}
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-[#ff5200] transition-colors" />
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs font-medium text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-[#ff5200] hover:bg-[#e04800] text-white font-bold rounded-lg text-sm shadow-md shadow-orange-500/10 transition-all active:scale-[0.98] border-none flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-gray-50 pb-0">
            <div className="text-xs text-center text-gray-500">
              New to Geekhoot?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-[#ff5200] hover:text-[#e04800] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Create an account
              </button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

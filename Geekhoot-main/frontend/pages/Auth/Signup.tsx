import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, Phone, User, Home, MapPin, MapPinned, Eye, EyeOff, CheckCircle2, ChevronRight, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/src/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/src/services/api';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  address: z.string().min(5, 'Full address is required'),
  district: z.string().min(2, 'District is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, '6-digit pincode is required'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const { setAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [coords, setCoords] = useState<{lat?: number, lng?: number}>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      address: '',
      district: '',
      state: '',
      pincode: '',
    }
  });

  const getGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast.success("GPS Location captured successfully!");
      }, () => {
        toast.error("Could not get location. Please allow browser location permission.");
      });
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    try {
      const finalData = { ...data, latitude: coords.lat, longitude: coords.lng };
      const response = await api.post('/auth/register', finalData);
      const { user, token } = response.data;

      setAuth(user, token);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] overflow-y-auto py-12 flex items-center justify-center p-6 bg-gray-50/50 relative font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px]" />
      <div className="absolute top-1/6 right-1/6 w-96 h-96 bg-[#ff5200]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/6 left-1/6 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl z-10"
      >
        <Card className="rounded-2xl border border-gray-100 shadow-xl bg-white p-6 sm:p-10 relative overflow-hidden">
          {/* Top orange gradient bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-[#ff5200] to-orange-400" />
          
          <CardHeader className="text-center sm:text-left pb-8 pt-0 px-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-50 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-[#ff5200] border border-orange-100/50">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">Create Your Account</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Register as a new customer at Geekhoot Store
                </CardDescription>
              </div>
            </div>
            <div className="text-sm font-semibold text-[#ff5200] bg-orange-50/50 px-3.5 py-1.5 rounded-full border border-orange-100/50 self-center">
              Customer Registration
            </div>
          </CardHeader>
          
          <CardContent className="px-0 pb-0">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Personal Information Group */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100 mb-6">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-50 text-[#ff5200] text-xs">1</span>
                      Personal Details
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-700">Full Name</Label>
                        <div className="relative group">
                          <Input 
                            placeholder="John Doe" 
                            className="pl-10 h-11 rounded-lg border-gray-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-[#ff5200] transition-colors" 
                            {...form.register('name')} 
                          />
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-[#ff5200] transition-colors" />
                        </div>
                        {form.formState.errors.name && (
                          <p className="text-xs text-red-500 font-medium">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-700">Email Address</Label>
                        <div className="relative group">
                          <Input 
                            type="email" 
                            placeholder="john@example.com" 
                            className="pl-10 h-11 rounded-lg border-gray-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-[#ff5200] transition-colors" 
                            {...form.register('email')} 
                          />
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-[#ff5200] transition-colors" />
                        </div>
                        {form.formState.errors.email && (
                          <p className="text-xs text-red-500 font-medium">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-700">Phone Number</Label>
                        <div className="relative group">
                          <Input 
                            placeholder="9876543210" 
                            className="pl-10 h-11 rounded-lg border-gray-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-[#ff5200] transition-colors" 
                            {...form.register('phone')} 
                          />
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-[#ff5200] transition-colors" />
                        </div>
                        {form.formState.errors.phone && (
                          <p className="text-xs text-red-500 font-medium">{form.formState.errors.phone.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-700">Security Password</Label>
                        <div className="relative group">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="pl-10 pr-10 h-11 rounded-lg border-gray-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-[#ff5200] transition-colors" 
                            {...form.register('password')} 
                          />
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-[#ff5200] transition-colors" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff5200] transition-colors h-8 w-8 flex items-center justify-center p-0 rounded-full"
                          >
                            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                        {form.formState.errors.password && (
                          <p className="text-xs text-red-500 font-medium">{form.formState.errors.password.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Information Group */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100 mb-6">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-50 text-[#ff5200] text-xs">2</span>
                      Logistics & Address
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-700">Delivery Address (3-line scrollable)</Label>
                        <div className="relative group">
                          <Textarea 
                            placeholder="Flat/House No, Street, Landmark" 
                            rows={3}
                            className="pl-10 min-h-[5.5rem] max-h-32 resize-none overflow-y-auto rounded-lg border-gray-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-[#ff5200] transition-colors" 
                            {...form.register('address')} 
                          />
                          <Home className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400 group-focus-within:text-[#ff5200] transition-colors" />
                        </div>
                        {form.formState.errors.address && (
                          <p className="text-xs text-red-500 font-medium">{form.formState.errors.address.message}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-gray-700">District</Label>
                          <Input 
                            placeholder="District" 
                            className="h-11 rounded-lg border-gray-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-[#ff5200] transition-colors" 
                            {...form.register('district')} 
                          />
                          {form.formState.errors.district && (
                            <p className="text-xs text-red-500 font-medium">{form.formState.errors.district.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-gray-700">State</Label>
                          <Input 
                            placeholder="State" 
                            className="h-11 rounded-lg border-gray-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-[#ff5200] transition-colors" 
                            {...form.register('state')} 
                          />
                          {form.formState.errors.state && (
                            <p className="text-xs text-red-500 font-medium">{form.formState.errors.state.message}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-700">Pincode</Label>
                        <div className="relative group">
                          <Input 
                            placeholder="682001" 
                            className="pl-10 h-11 rounded-lg border-gray-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-[#ff5200] transition-colors" 
                            {...form.register('pincode')} 
                          />
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-[#ff5200] transition-colors" />
                        </div>
                        {form.formState.errors.pincode && (
                          <p className="text-xs text-red-500 font-medium">{form.formState.errors.pincode.message}</p>
                        )}
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full h-11 rounded-lg border-dashed border-2 border-orange-200/50 bg-orange-50/20 hover:bg-orange-50/50 text-[#ff5200] font-bold text-xs transition-all flex items-center justify-center gap-2"
                          onClick={getGeoLocation}
                        >
                          <MapPinned className="w-4 h-4 text-[#ff5200]" />
                          {coords.lat ? (
                            <span className="flex items-center gap-1.5 text-green-600">
                              <CheckCircle2 className="w-4 h-4 text-green-600" /> GPS Location Synced
                            </span>
                          ) : (
                            <span>Auto-Sync GPS Coordinates</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col items-center gap-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-white bg-[#ff5200] hover:bg-[#e04800] shadow-md shadow-orange-500/10 transition-all active:scale-[0.98] border-none font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer" 
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Registering Account...' : 'Complete Registration'}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <p className="text-xs font-semibold text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#ff5200] hover:text-[#e04800] font-bold transition-colors underline underline-offset-4">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, ArrowLeft, History, Clock, Edit, Mail, Phone, Calendar, 
  MapPin, FileText, BookOpen, User, CheckCircle, Activity, 
  ChevronRight, Layers, ShieldCheck, Zap, 
  XCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LeadStatus } from '@/types';
import { motion } from 'framer-motion';

// Premium Status Colors from Dashboard
const STATUS_CONFIG: Record<string, { color: string, icon: React.ReactNode }> = {
  PENDING: { color: '#f59e0b', icon: <Clock className="h-4 w-4" /> },
  REJECTED: { color: '#ef4444', icon: <XCircle className="h-4 w-4" /> },
  VERIFIED: { color: '#10b981', icon: <CheckCircle className="h-4 w-4" /> },
  PAID: { color: '#8b5cf6', icon: <Zap className="h-4 w-4" /> },
  WORKING: { color: '#3b82f6', icon: <Activity className="h-4 w-4" /> },
};

const statusUpdateSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
});

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const form = useForm<z.infer<typeof statusUpdateSchema>>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { status: '', notes: '' },
  });

  useEffect(() => { fetchLead(); }, [id]);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/leads/${id}`);
      setLead(data.lead);
      form.setValue('status', data.lead.status);
    } catch (error) {
      toast({ title: "Error", description: "Terminal failed to locate record.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onUpdateStatus = async (values: z.infer<typeof statusUpdateSchema>) => {
    try {
      const { data } = await axios.put(`/api/leads/${id}`, { status: values.status, statusNote: values.notes });
      setLead(data.lead);
      toast({ title: "Success", description: "Protocol updated successfully" });
      setStatusDialogOpen(false);
    } catch (err) {
      toast({ title: "Error", description: "Status override failed", variant: "destructive" });
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex h-[80vh] w-full flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Accessing Core Database...</p>
      </div>
    </DashboardLayout>
  );

  const currentStatus = STATUS_CONFIG[lead.status] || { color: '#737373', icon: <FileText /> };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
        
        {/* HEADER SECTION: TERMINAL IDENTITY */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.back()} className="h-8 w-8 p-0 rounded-lg hover:bg-white/5 text-neutral-500">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded-md">
                <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">Record: #{lead._id.slice(-6).toUpperCase()}</span>
              </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              {lead.firstName} <span className="text-neutral-500">{lead.lastName}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-white/5 border-white/10 text-white font-bold text-[10px] py-2 px-4 rounded-xl flex items-center gap-2">
              <span style={{ color: currentStatus.color }}>{currentStatus.icon}</span>
              {lead.status.replace(/_/g, ' ')}
            </Badge>
            <Button onClick={() => setStatusDialogOpen(true)} className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl px-6 h-12 font-bold shadow-lg shadow-violet-500/20">
              <Edit className="mr-2 h-4 w-4" /> Update Protocol
            </Button>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: DATA TERMINAL */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-[#111114] border border-white/5 h-14 p-1 rounded-2xl">
                <TabsTrigger value="overview" className="flex-1 rounded-xl data-[state=active]:bg-white/5 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest text-neutral-500">Overview</TabsTrigger>
                <TabsTrigger value="fields" className="flex-1 rounded-xl data-[state=active]:bg-white/5 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest text-neutral-500">System Fields</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card className="bg-[#111114] border-white/5 shadow-2xl overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {[
                      { label: "Email Address", val: lead.email, icon: <Mail /> },
                      { label: "Phone Protocol", val: lead.phone, icon: <Phone /> },
                      { label: "Application", val: lead.applicationType, icon: <Zap /> },
                      { label: "Lawsuit Details", val: lead.lawsuit, icon: <BookOpen /> },
                      { label: "Geo Location", val: lead.address, icon: <MapPin /> },
                      { label: "Birth Date", val: lead.dateOfBirth ? format(new Date(lead.dateOfBirth), 'MMM dd, yyyy') : 'N/A', icon: <Calendar /> },
                    ].map((item, i) => (
                      <div key={i} className="p-8 border-b border-white/[0.03] odd:border-r group hover:bg-white/[0.02] transition-colors">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 mb-2 flex items-center gap-2">
                          {React.cloneElement(item.icon as any, { className: "h-3 w-3" })}
                          {item.label}
                        </p>
                        <p className="text-sm font-bold text-white tracking-tight">{item.val || 'Not Encoded'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 mb-4">Operator Notes</p>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-neutral-400 leading-relaxed italic">
                      "{lead.notes || 'No encrypted notes available for this record.'}"
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="fields" className="mt-6">
                 <Card className="bg-[#111114] border-white/5 p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-2xl">
                    {lead.fields?.length > 0 ? lead.fields.map((f: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">{f.key}</p>
                        <p className="text-xs font-bold text-white mt-1">{f.value}</p>
                      </div>
                    )) : (
                      <div className="col-span-3 py-10 text-center text-neutral-600 font-bold uppercase text-[10px] tracking-widest">No Dynamic Attributes Found</div>
                    )}
                 </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: PROTOCOL HISTORY LOG */}
          <div className="space-y-8">
            <Card className="bg-[#111114] border-white/5 flex flex-col h-[600px] shadow-2xl">
              <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                  <History className="h-4 w-4 text-violet-400" />
                  Protocol Lifecycle
                </CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-8 space-y-8 relative">
                   <div className="absolute left-[39px] top-8 bottom-8 w-[1px] bg-white/5" />
                   {lead.statusHistory?.slice().reverse().map((log: any, i: number) => (
                     <div key={i} className="relative pl-10">
                        <div className="absolute left-0 top-0 h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_10px_#8b5cf6] border-4 border-[#111114] z-10" />
                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                              <Badge className="bg-white/5 text-[9px] font-black text-violet-400 border-none">{log.toStatus}</Badge>
                              <span className="text-[9px] font-bold text-neutral-600 uppercase tabular-nums">{format(new Date(log.timestamp), 'MMM dd HH:mm')}</span>
                           </div>
                           <p className="text-xs text-neutral-400 leading-snug">{log.notes || "System-generated transition log."}</p>
                           <p className="text-[9px] font-black text-neutral-700 uppercase tracking-tighter">Operator: {log.changedBy?.name || "System"}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      {/* UPDATE DIALOG [Matches Dashboard aesthetic] */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="bg-[#09090b] border-white/10 text-white rounded-2xl max-w-md shadow-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter">Update System Protocol</DialogTitle>
            <DialogDescription className="text-neutral-500">Manual override of Lead ID #{lead._id.slice(-6).toUpperCase()}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdateStatus)} className="space-y-6 mt-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Target Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12 text-white">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger></FormControl>
                    <SelectContent className="bg-[#09090b] border-white/10 text-white">
                      {['PENDING', 'WORKING', 'VERIFIED', 'PAID', 'REJECTED'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Audit Notes</FormLabel>
                  <FormControl><Textarea {...field} className="bg-white/5 border-white/10 rounded-xl min-h-[100px] focus:border-violet-500/50" /></FormControl>
                </FormItem>
              )} />
              <Button type="submit" className="w-full bg-[#8b5cf6] h-12 font-bold rounded-xl shadow-lg shadow-violet-500/20">Commit Changes</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
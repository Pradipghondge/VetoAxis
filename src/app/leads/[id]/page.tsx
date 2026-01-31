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
import { useForm, SubmitHandler } from 'react-hook-form';
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

type StatusFormValues = z.infer<typeof statusUpdateSchema>;

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const form = useForm<StatusFormValues>({
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

  const onUpdateStatus: SubmitHandler<StatusFormValues> = async (values) => {
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
      <div className="flex h-[80vh] w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Loading Lead Details...</p>
      </div>
    </DashboardLayout>
  );

  const currentStatus = STATUS_CONFIG[lead.status] || { color: '#737373', icon: <FileText /> };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.back()} className="h-8 w-8 p-0 rounded-lg hover:bg-accent text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 border border-primary/20 rounded-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">ID: {lead._id.slice(-6).toUpperCase()}</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {lead.firstName} <span className="text-muted-foreground">{lead.lastName}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-card border-border text-foreground font-bold text-[10px] py-2 px-4 rounded-xl flex items-center gap-2 shadow-sm">
              <span style={{ color: currentStatus.color }}>{currentStatus.icon}</span>
              {lead.status.replace(/_/g, ' ')}
            </Badge>
            <Button onClick={() => setStatusDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 h-12 font-bold shadow-sm">
              <Edit className="mr-2 h-4 w-4" /> Update Status
            </Button>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: DATA TERMINAL */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-muted/50 border border-border h-14 p-1 rounded-2xl w-full justify-start">
                <TabsTrigger value="overview" className="flex-1 rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest text-muted-foreground">Overview</TabsTrigger>
                <TabsTrigger value="fields" className="flex-1 rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest text-muted-foreground">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card className="bg-card border-border shadow-sm overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {[
                      { label: "Email", val: lead.email, icon: <Mail /> },
                      { label: "Phone", val: lead.phone, icon: <Phone /> },
                      { label: "Type", val: lead.applicationType, icon: <Zap /> },
                      { label: "Case Info", val: lead.lawsuit, icon: <BookOpen /> },
                      { label: "Address", val: lead.address, icon: <MapPin /> },
                      { label: "DOB", val: lead.dateOfBirth ? format(new Date(lead.dateOfBirth), 'MMM dd, yyyy') : 'N/A', icon: <Calendar /> },
                    ].map((item, i) => (
                      <div key={i} className="p-6 border-b border-border odd:border-r group hover:bg-muted/50 transition-colors">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                          {React.cloneElement(item.icon as any, { className: "h-3.5 w-3.5" })}
                          {item.label}
                        </p>
                        <p className="text-sm font-medium text-foreground tracking-tight">{item.val || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Notes</p>
                    <div className="p-4 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground leading-relaxed">
                      {lead.notes || 'No notes available.'}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="fields" className="mt-6">
                 <Card className="bg-card border-border p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
                    {lead.fields?.length > 0 ? lead.fields.map((f: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{f.key}</p>
                        <p className="text-xs font-medium text-foreground mt-1">{f.value}</p>
                      </div>
                    )) : (
                      <div className="col-span-3 py-10 text-center text-muted-foreground font-bold uppercase text-[10px] tracking-widest">No Additional Fields</div>
                    )}
                 </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: PROTOCOL HISTORY LOG */}
          <div className="space-y-8">
            <Card className="bg-card border-border flex flex-col h-[600px] shadow-sm">
              <CardHeader className="p-6 border-b border-border">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Activity History
                </CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-8 relative">
                   <div className="absolute left-[31px] top-8 bottom-8 w-[1px] bg-border" />
                   {lead.statusHistory?.slice().reverse().map((log: any, i: number) => (
                     <div key={i} className="relative pl-10">
                        <div className="absolute left-0 top-0 h-2 w-2 rounded-full bg-primary shadow-sm border-4 border-card z-10" />
                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                              <Badge variant="outline" className="bg-muted/50 text-[9px] font-bold text-foreground border-border">{log.toStatus}</Badge>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tabular-nums">{format(new Date(log.timestamp), 'MMM dd HH:mm')}</span>
                           </div>
                           <p className="text-xs text-muted-foreground leading-snug">{log.notes || "Status updated."}</p>
                           <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">By: {log.changedBy?.name || "System"}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      {/* UPDATE DIALOG */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground rounded-2xl max-w-md shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Update Status</DialogTitle>
            <DialogDescription className="text-muted-foreground">Change status for {lead.firstName} {lead.lastName}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdateStatus)} className="space-y-6 mt-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">New Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger></FormControl>
                    <SelectContent>
                      {['PENDING', 'WORKING', 'VERIFIED', 'PAID', 'REJECTED'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Notes</FormLabel>
                  <FormControl><Textarea {...field} className="bg-background border-input rounded-xl min-h-[100px] focus:border-primary/50" placeholder="Add a note..." /></FormControl>
                </FormItem>
              )} />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-bold rounded-xl shadow-sm">Save Changes</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2, Search, Plus, MoreHorizontal, Filter, Clock, Eye, History,
  ChevronRight, ChevronLeft, RefreshCw, Mail, PhoneCall, Zap, Activity,
  ShieldAlert, CheckCircle, XCircle, AlertTriangle, Layers
} from 'lucide-react';
import { format } from 'date-fns';
import { LeadStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- PREMIUM STATUS CONFIG (Synced with Dashboard) ---
const STATUS_CONFIG: Record<string, { color: string, icon: React.ReactNode }> = {
  PENDING: { color: '#f59e0b', icon: <Clock className="h-3.5 w-3.5" /> },
  REJECTED: { color: '#ef4444', icon: <XCircle className="h-3.5 w-3.5" /> },
  VERIFIED: { color: '#10b981', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  PAID: { color: '#8b5cf6', icon: <Zap className="h-3.5 w-3.5" /> },
  WORKING: { color: '#3b82f6', icon: <Activity className="h-3.5 w-3.5" /> },
  CHARGEBACK: { color: '#be123c', icon: <ShieldAlert className="h-3.5 w-3.5" /> },
  // ... rest use standard neutral
};

export default function ClientLeads() {
  const { user, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; lead: any | null }>({ open: false, lead: null });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/leads?page=${pagination.page}&limit=10&status=${statusFilter}&search=${searchInput}&t=${Date.now()}`);
      setLeads(data.leads);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked && !authLoading && user) fetchLeads();
  }, [user, authChecked, authLoading, pagination.page, statusFilter, searchInput]);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20 max-w-[1700px] mx-auto">
        {/* SECTION 2: THE COMMAND BAR (Search & Filters) */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search leads by name, email, or phone..." 
                className="w-full bg-background border border-input rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:border-primary/30 outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px] bg-background border-input text-muted-foreground rounded-xl h-12 focus:ring-primary/30">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5" />
                    <SelectValue placeholder="Filter by Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {Object.keys(STATUS_CONFIG).map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => { setSearchInput(''); setStatusFilter(''); }}
                className="border-input bg-background text-muted-foreground rounded-xl h-12 px-6 hover:text-foreground"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: THE TERMINAL TABLE */}
        <Card className="bg-card border-border overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground text-nowrap">Loading Leads...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest py-5 pl-8">Client Name</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest py-5">Contact Details</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest py-5">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest py-5">Created At</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase text-muted-foreground tracking-widest py-5 pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow 
                        key={lead._id}
                        className="border-border group hover:bg-muted/50 transition-all cursor-pointer"
                        onClick={() => router.push(`/leads/${lead._id}`)}
                      >
                        <TableCell className="py-5 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-xs font-bold text-primary group-hover:border-primary/30 transition-all">
                              {lead.firstName[0]}{lead.lastName[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground leading-none mb-1 group-hover:text-primary transition-colors">
                                {lead.firstName} {lead.lastName}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">ID: {lead._id.slice(-6).toUpperCase()}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center text-xs text-muted-foreground gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {lead.email}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground gap-2">
                              <PhoneCall className="h-3 w-3 text-muted-foreground" />
                              {lead.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className="bg-muted border-border text-foreground font-bold text-[10px] py-1 px-3 rounded-lg flex items-center gap-2 w-fit group-hover:border-primary/20 transition-all"
                            style={{ boxShadow: `0 0 10px ${(STATUS_CONFIG[lead.status] || {color: 'var(--muted-foreground)'}).color}22` }}
                          >
                            <span style={{ color: (STATUS_CONFIG[lead.status] || {color: 'var(--muted-foreground)'}).color }}>
                              {(STATUS_CONFIG[lead.status] || {icon: <Clock />}).icon}
                            </span>
                            {lead.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-muted-foreground tabular-nums">
                          {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary"
                              onClick={(e) => { e.stopPropagation(); setHistoryDialog({ open: true, lead }); }}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground"
                              onClick={(e) => { e.stopPropagation(); router.push(`/leads/${lead._id}`); }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 4: PAGINATION LOG */}
        <div className="flex items-center justify-between px-2">
           <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
             Showing {((pagination.page - 1) * 10) + 1} - {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} leads
           </p>
           <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="bg-card border-border text-foreground h-10 w-10 p-0 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="h-10 px-4 flex items-center bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black text-primary uppercase">
                Page {pagination.page}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="bg-card border-border text-foreground h-10 w-10 p-0 rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
           </div>
        </div>
      </div>

      {/* RE-STYLED HISTORY DIALOG */}
      <Dialog open={historyDialog.open} onOpenChange={(open) => !open && setHistoryDialog({ open: false, lead: null })}>
        <DialogContent className="bg-card border-border text-foreground max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
              <History className="h-5 w-5 text-primary" />
              Activity History
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">History for {historyDialog.lead?.firstName} {historyDialog.lead?.lastName}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] mt-4 pr-4">
             <div className="space-y-6 relative pl-4">
                <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-border" />
                {historyDialog.lead?.statusHistory?.map((log: any, i: number) => (
                  <div key={i} className="relative pl-8">
                     <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-card border-2 border-primary shadow-sm" />
                     <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-bold text-foreground uppercase">{log.toStatus}</span>
                           <span className="text-[9px] font-bold text-muted-foreground uppercase tabular-nums">{format(new Date(log.timestamp), 'MMM dd, HH:mm')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 p-2 rounded-lg border border-border">
                           {log.notes || "No notes provided."}
                        </p>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest pt-1">Updated by: {log.changedBy?.name || "System"}</span>
                     </div>
                  </div>
                ))}
             </div>
          </ScrollArea>
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setHistoryDialog({ open: false, lead: null })} className="text-muted-foreground font-bold uppercase text-[10px]">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
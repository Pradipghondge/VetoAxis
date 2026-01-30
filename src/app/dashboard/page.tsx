"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer, LineChart, Line,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import {
    AlertCircle, Clock, FileText, Plus, CheckCircle, XCircle, DollarSign,
    AlertTriangle, PhoneOff, PhoneCall, Copy, ShieldAlert, TimerOff,
    FastForward, Clock1, Clock2, Clock3, Clock4, CreditCard,
    FileQuestion, ArrowUpRight, Search, BadgeCheck, ChevronRight,
    TrendingUp, Activity, Bell, SearchIcon, Layers, Info, Loader2,
    Settings, Zap, BarChart3,
    Timer
} from 'lucide-react';
import { format } from 'date-fns';
import { LeadStatus } from '@/types';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from '@/lib/utils';
import React from 'react';

// --- 1. PREMIUM STATUS CONFIGURATION ---
const STATUS_CONFIG: Record<string, { icon: React.ReactNode, color: string, description: string }> = {
    PENDING: { icon: <Clock />, color: '#f59e0b', description: 'Awaiting initial system review' },
    REJECTED: { icon: <XCircle />, color: '#ef4444', description: 'Disqualified lead parameters' },
    VERIFIED: { icon: <CheckCircle />, color: '#10b981', description: 'Data points fully validated' },
    REJECTED_BY_CLIENT: { icon: <AlertTriangle />, color: '#f97316', description: 'External client rejection' },
    PAID: { icon: <DollarSign />, color: '#8b5cf6', description: 'Revenue transaction complete' },
    DUPLICATE: { icon: <Copy />, color: '#a855f7', description: 'Redundant entry detected' },
    NOT_RESPONDING: { icon: <PhoneOff />, color: '#737373', description: 'Communication attempts failed' },
    FELONY: { icon: <ShieldAlert />, color: '#dc2626', description: 'Legal eligibility restriction' },
    DEAD_LEAD: { icon: <TimerOff />, color: '#404040', description: 'Lead non-conversion state' },
    WORKING: { icon: <FastForward />, color: '#3b82f6', description: 'Active pipeline progression' },
    CALL_BACK: { icon: <PhoneCall />, color: '#06b6d4', description: 'Scheduled follow-up sequence' },
    ATTEMPT_1: { icon: <Clock1 />, color: '#6366f1', description: 'Initial outreach attempt' },
    ATTEMPT_2: { icon: <Clock2 />, color: '#4f46e5', description: 'Secondary contact phase' },
    ATTEMPT_3: { icon: <Clock3 />, color: '#4338ca', description: 'Tertiary contact phase' },
    ATTEMPT_4: { icon: <Clock4 />, color: '#3730a3', description: 'Final outreach protocol' },
    CHARGEBACK: { icon: <CreditCard />, color: '#be123c', description: 'Financial reversal alert' },
    WAITING_ID: { icon: <FileQuestion />, color: '#d97706', description: 'Pending identity documents' },
    SENT_CLIENT: { icon: <ArrowUpRight />, color: '#059669', description: 'Transferred to client portal' },
    QC: { icon: <Search />, color: '#7c3aed', description: 'Quality assurance evaluation' },
    ID_VERIFIED: { icon: <BadgeCheck />, color: '#16a34a', description: 'Confirmed identity status' },
    BILLABLE: { icon: <Zap />, color: '#10b981', description: 'Validated for invoicing' },
    CAMPAIGN_PAUSED: { icon: <Timer />, color: '#737373', description: 'Active campaign on hold' },
    SENT_TO_LAW_FIRM: { icon: <FileText />, color: '#8b5cf6', description: 'Transferred to legal council' }
};

// --- 2. SUB-COMPONENTS ---

const MiniSparkline = ({ data, color }: { data: any[], color: string }) => (
    <div className="h-10 w-28">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2.5} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

const MetricCard = ({ label, value, color, icon, percentage, loading }: any) => (
    <Card className="bg-[#111114] border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            {React.cloneElement(icon, { className: "h-24 w-24" })}
        </div>
        <CardContent className="p-8 space-y-4">
            <div className="flex justify-between items-start">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{label}</p>
                {!loading && <MiniSparkline data={[{ v: 10 }, { v: 25 }, { v: 15 }, { v: 45 }, { v: 30 }, { v: 60 }]} color={color} />}
            </div>
            <div className="space-y-1">
                <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
                    {loading ? <Skeleton className="h-10 w-24 bg-white/5" /> : value}
                </div>
                {percentage && (
                    <div className="flex items-center gap-2">
                        <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}66` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500">{percentage}%</span>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
);

// --- 3. MAIN DASHBOARD ---

export default function Dashboard() {
    const { user, loading: authLoading, authChecked } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeadStats = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/leads/stats?t=${Date.now()}`);
            setStats(data);
        } catch (err) {
            setError('System sync failed. Terminal disconnected.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authChecked && !authLoading && user) fetchLeadStats();
    }, [user, authChecked, authLoading]);

    // CATEGORIZATION ENGINE: Bucket 23+ statuses into readable insights
    const categorizedStats = useMemo(() => {
        if (!stats?.statusCounts) return { pipelines: 0, closures: 0, issues: 0, actions: 0 };

        const getSum = (statuses: string[]) =>
            stats.statusCounts
                .filter((s: any) => statuses.includes(s._id))
                .reduce((sum: number, s: any) => sum + s.count, 0);

        return {
            pipelines: getSum(["WORKING", "QC", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4", "CALL_BACK"]),
            closures: getSum(["VERIFIED", "ID_VERIFIED", "SENT_CLIENT", "PAID", "BILLABLE", "SENT_TO_LAW_FIRM"]),
            issues: getSum(["REJECTED", "REJECTED_BY_CLIENT", "DUPLICATE", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "CHARGEBACK"]),
            actions: getSum(["PENDING", "WAITING_ID", "QC"])
        };
    }, [stats]);

    return (
        <DashboardLayout>
            <div className="max-w-[1700px] mx-auto space-y-12 pb-24">

                {/* SECTION 1: SYSTEM COMMAND HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">System Encrypted & Active</span>
                            </div>
                            <div className="h-4 w-[1px] bg-white/10" />
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                ID: {user?.role?.toUpperCase() || 'AGENT'} // {user?.name?.split(' ')[0].toUpperCase()}
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-3">
                            Terminal <span className="text-neutral-700">/</span>
                            <span className="bg-gradient-to-r from-[#8b5cf6] to-violet-400 bg-clip-text text-transparent">
                                {user?.name?.split(' ')[0] || 'Admin'}
                            </span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 w-full xl:w-auto">
                        <div className="relative flex-1 xl:w-96 group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within:text-violet-400 transition-colors" />
                            <input
                                placeholder="Search leads, users, or system files..."
                                className="w-full bg-[#111114] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-violet-500/50 outline-none transition-all shadow-inner"
                            />
                        </div>
                        <Button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-2xl px-8 h-14 font-bold shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all">
                            <Plus className="mr-2 h-5 w-5" /> New Lead
                        </Button>
                    </div>
                </div>

                {/* SECTION 2: HIGH-FIDELITY METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        label="Total Data Volume" value={stats?.totalLeads || 0} color="#8b5cf6"
                        icon={<Layers />} loading={loading}
                    />
                    <MetricCard
                        label="Active Pipeline" value={categorizedStats.pipelines} color="#3b82f6"
                        icon={<TrendingUp />} percentage={((categorizedStats.pipelines / (stats?.totalLeads || 1)) * 100).toFixed(0)}
                        loading={loading}
                    />
                    <MetricCard
                        label="Verified Closures" value={categorizedStats.closures} color="#10b981"
                        icon={<BadgeCheck />} percentage={((categorizedStats.closures / (stats?.totalLeads || 1)) * 100).toFixed(0)}
                        loading={loading}
                    />
                    <MetricCard
                        label="Risk Anomalies" value={categorizedStats.issues} color="#ef4444"
                        icon={<ShieldAlert />} loading={loading}
                    />
                </div>

                {/* SECTION 3: CORE ANALYTICS ENGINE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Performance Matrix */}
                    <Card className="lg:col-span-2 bg-[#111114] border-white/5 pt-10 shadow-2xl relative overflow-hidden group">
                        {/* Header Section */}
                        <CardHeader className="px-8 flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">Status Distribution Matrix</CardTitle>
                                <CardDescription className="text-[10px] font-bold text-neutral-500 uppercase">
                                    Real-time volume analysis across {Object.keys(STATUS_CONFIG).length} system states
                                </CardDescription>
                            </div>
                            <div className="flex bg-white/5 p-1 rounded-xl">
                                <Badge variant="outline" className="bg-white/5 border-white/10 text-neutral-400 text-[9px] font-black uppercase">
                                    Total Volume: {stats?.totalLeads || 0}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="h-[450px] w-full p-8 pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                {/* Horizontal Bar Chart for high-density status data */}
                                <BarChart
                                    layout="vertical"
                                    data={Object.keys(STATUS_CONFIG).map(status => ({
                                        name: status.replace(/_/g, ' '),
                                        value: stats?.statusCounts.find((s: any) => s._id === status)?.count || 0,
                                        color: STATUS_CONFIG[status].color
                                    })).sort((a, b) => b.value - a.value)} // Automatically sorts most important statuses to the top
                                    margin={{ left: 40, right: 40 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="#525252"
                                        fontSize={9}
                                        width={130}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontWeight: 800, fill: '#737373' }}
                                    />
                                    <RechartTooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        radius={[0, 4, 4, 0]}
                                        barSize={10}
                                        animationDuration={1500}
                                    >
                                        {/* Dynamic coloring based on your STATUS_CONFIG */}
                                        {Object.keys(STATUS_CONFIG).map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={STATUS_CONFIG[entry]?.color || '#8b5cf6'}
                                                className="drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>

                        {/* Subtle texture background */}
                        <div className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
                    </Card>

                    {/* Categorized Insights & Live Feed */}
                    <div className="space-y-8">
                        {/* Global Insights Card Remains the same */}
                        <Card className="bg-[#111114] border-white/5 shadow-xl">
                            <CardHeader className="p-8">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Global Insights</CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-10 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold text-neutral-400"><span>OUTREACH</span><span>{categorizedStats.pipelines}</span></div>
                                    <div className="h-2 bg-white/5 rounded-full"><motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" /></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold text-neutral-400"><span>CONVERSIONS</span><span>{categorizedStats.closures}</span></div>
                                    <div className="h-2 bg-white/5 rounded-full"><motion.div initial={{ width: 0 }} animate={{ width: '82%' }} className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" /></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold text-neutral-400"><span>SYSTEM ACTIONS</span><span>{categorizedStats.actions}</span></div>
                                    <div className="h-2 bg-white/5 rounded-full"><motion.div initial={{ width: 0 }} animate={{ width: '30%' }} className="h-full bg-violet-500 rounded-full shadow-[0_0_10px_#8b5cf6]" /></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* FIXED: Live Pulse Feed with Proper Truncation and Scrolling */}
                        <Card className="bg-[#111114] border-white/5 flex flex-col h-[330px] shadow-xl overflow-hidden">
                            <CardHeader className="p-8 border-b border-white/5">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Live Pulse Feed</CardTitle>
                            </CardHeader>
                            {/* flex-1 and overflow-hidden here ensure the ScrollArea stays contained */}
                            <ScrollArea className="flex-1 w-full overflow-y-auto">
                                <div className="p-8 space-y-6">
                                    {stats?.recentActivity?.map((act: any, i: number) => (
                                        <div key={i} className="flex gap-4 items-center group w-full overflow-hidden">
                                            {/* shrink-0 prevents the avatar from getting squished by long names */}
                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-violet-400">
                                                {act.firstName[0]}
                                            </div>

                                            {/* min-w-0 is critical for Flexbox to allow children to truncate */}
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <p className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors truncate">
                                                    {act.firstName} {act.lastName}
                                                </p>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                                    <p className="text-[10px] text-neutral-500 font-medium truncate">
                                                        {act.statusHistory.toStatus}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* shrink-0 ensures the icon remains visible */}
                                            <ChevronRight className="shrink-0 h-4 w-4 text-neutral-800" />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </Card>
                    </div>
                </div>

                {/* SECTION 4: GRANULAR STATUS INVENTORY (The Full Grid) */}
                <div className="space-y-8">
                    <div className="flex items-center gap-6">
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Status Inventory</h2>
                        <div className="h-[1px] flex-1 bg-white/5" />
                        <div className="flex gap-3">
                            <Button variant="outline" className="border-white/5 bg-white/5 h-10 px-4 rounded-xl text-neutral-400 text-xs font-bold uppercase hover:text-white">Filter</Button>
                            <Button variant="outline" className="border-white/5 bg-white/5 h-10 px-4 rounded-xl text-neutral-400 text-xs font-bold uppercase hover:text-white">Export</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {Object.keys(STATUS_CONFIG).map((status, index) => {
                            const config = STATUS_CONFIG[status];
                            const count = stats?.statusCounts.find((s: any) => s._id === status)?.count || 0;
                            const perc = stats?.totalLeads > 0 ? ((count / stats.totalLeads) * 100).toFixed(1) : '0';

                            return (
                                <motion.div
                                    key={status}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                >
                                    <HoverCard openDelay={50}>
                                        <HoverCardTrigger asChild>
                                            <Card className="bg-[#111114] border-white/5 hover:border-violet-500/20 transition-all cursor-pointer group shadow-lg">
                                                <CardContent className="p-6 space-y-5">
                                                    <div className="flex justify-between items-center">
                                                        <div className="p-3 rounded-2xl bg-white/5 transition-all group-hover:bg-violet-500/10" style={{ color: count > 0 ? config.color : '#525252' }}>
                                                            {React.cloneElement(config.icon as any, { className: "h-5 w-5" })}
                                                        </div>
                                                        <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{count}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-neutral-300 transition-colors">{status.replace(/_/g, ' ')}</p>
                                                        <div className="flex items-center gap-3 mt-3">
                                                            <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${perc}%`, backgroundColor: config.color, boxShadow: `0 0 8px ${config.color}44` }} />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-neutral-600">{perc}%</span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="bg-[#09090b] border-white/10 w-72 shadow-3xl rounded-2xl backdrop-blur-xl">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-white/5" style={{ color: config.color }}>{config.icon}</div>
                                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{status.replace(/_/g, ' ')}</h4>
                                                </div>
                                                <p className="text-xs text-neutral-500 leading-relaxed font-medium">{config.description}</p>
                                                <div className="h-[1px] bg-white/5" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-neutral-500 uppercase">Live Count: {count}</span>
                                                    <Button
                                                        variant="link"
                                                        className="h-auto p-0 text-[10px] font-black uppercase text-violet-400 hover:text-violet-300"
                                                        onClick={() => router.push(`/leads?status=${status}`)}
                                                    >
                                                        Access Logs <ChevronRight className="ml-1 h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
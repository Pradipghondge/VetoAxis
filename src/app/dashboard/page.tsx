"use client"

import * as React from "react"
import { useEffect, useState, useRef, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import {
    Plus,
    LayoutDashboard,
    TrendingUp,
    CheckCircle,
    Activity,
} from 'lucide-react'
import { format } from 'date-fns'
import { motion } from "framer-motion"

// Import your configuration registry
import { STATUS_CONFIG, BUCKETS } from './status-registry'
import Link from "next/link"

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // DRAG-TO-SCROLL LOGIC
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return
        setIsDragging(true)
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
        setScrollLeft(scrollContainerRef.current.scrollLeft)
    }

    const handleMouseLeave = () => setIsDragging(false)
    const handleMouseUp = () => setIsDragging(false)

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return
        e.preventDefault()
        const x = e.pageX - scrollContainerRef.current.offsetLeft
        const walk = (x - startX) * 2 
        scrollContainerRef.current.scrollLeft = scrollLeft - walk
    }

    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`/api/leads/stats?t=${Date.now()}`)
            setStats(data)
        } finally { setLoading(false) }
    }

    useEffect(() => { if (!authLoading && user) fetchStats() }, [user, authLoading])

    const categorizedStats = useMemo(() => {
        if (!stats?.statusCounts) return { pipelines: 0, closures: 0, issues: 0 }
        
        const getBucketCount = (bucket: string[]) => 
            bucket.reduce((acc, status) => {
                const found = stats.statusCounts.find((s: any) => s._id === status)
                return acc + (found?.count || 0)
            }, 0)

        return {
            pipelines: getBucketCount(BUCKETS.PIPELINE),
            closures: getBucketCount(BUCKETS.CONVERSION),
            issues: getBucketCount(BUCKETS.RISK)
        }
    }, [stats])

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">Dashboard</h1>
                        <p className="text-sm text-muted-foreground font-medium">
                            Welcome back, {user?.name || '...'}
                        </p>
                    </div>
                    <Link href="/leads/create" className="w-full md:w-auto">
                        <Button size="sm" className="font-bold gap-2 rounded-lg w-full md:w-auto">
                            <Plus className="h-4 w-4" /> New Lead
                        </Button>
                    </Link>
                </div>

                {/* 4 Summary Cards */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    {[
                        { label: 'Total Leads', val: stats?.totalLeads, icon: LayoutDashboard },
                        { label: 'In Pipeline', val: categorizedStats.pipelines, icon: TrendingUp },
                        { label: 'Conversions', val: categorizedStats.closures, icon: CheckCircle },
                        { label: 'Risk Alerts', val: categorizedStats.issues, icon: Activity, color: 'text-red-500' },
                    ].map((m, i) => (
                        <Card key={i} className="bg-card/50 border shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase">{m.label}</CardTitle>
                                <m.icon className={`h-4 w-4 ${m.color || 'text-muted-foreground'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold italic">{m.val ?? 0}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* SECTION 2: Ingestion Matrix Interactive Chart & Pulse Feed */}
                <div className="grid gap-6 lg:grid-cols-7">
                    {/* Horizontal Bar Chart for high-density status data */}
                    <Card className="lg:col-span-4 rounded-2xl border shadow-sm overflow-hidden bg-card/40">
                        <CardHeader className="p-6 flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                                <CardTitle className="text-sm font-semibold tracking-tight uppercase tracking-widest text-muted-foreground">
                                    Success Rate
                                </CardTitle>
                                <CardDescription className="text-[10px] font-medium uppercase opacity-60">
                                    Real-time analysis across system states
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-background/50 border-border text-[9px] font-bold tabular-nums">
                                TOTAL: {stats?.totalLeads || 0}
                            </Badge>
                        </CardHeader>
                        <CardContent className="h-[250px] md:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={Object.keys(STATUS_CONFIG).map(status => ({
                                        name: status.replace(/_/g, ' '),
                                        value: stats?.statusCounts.find((s: any) => s._id === status)?.count || 0,
                                        color: STATUS_CONFIG[status].color
                                    })).sort((a, b) => b.value - a.value)}
                                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" fontSize={10} width={80} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={10}>
                                        {Object.keys(STATUS_CONFIG).map((entry, idx) => (
                                            <Cell key={idx} fill={STATUS_CONFIG[entry]?.color || 'var(--primary)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Pulse Feed */}
                    <Card className="shadow-none bg-card/40">
                        <CardHeader className="border-b">
                            <CardTitle className="text-sm font-bold uppercase">Recent Pulse</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 h-[250px] md:h-[300px] overflow-y-auto no-scrollbar">
                            <div className="divide-y">
                                {stats?.recentActivity?.length > 0 ? stats.recentActivity.map((act: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                            {act.firstName?.[0]}{act.lastName?.[0]}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold">{act.firstName} {act.lastName}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{act.statusHistory.toStatus.replace(/_/g, ' ')}</p>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-mono italic">
                                            {format(new Date(act.statusHistory.timestamp), 'HH:mm')}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-xs text-muted-foreground p-8">No recent activity.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- ADDED SECTION: STATUS INVENTORY CAROUSEL --- */}
                <div className="space-y-4 px-2 select-none">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground opacity-50">
                            Drag to Explore
                        </h2>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        className={`flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-4 cursor-${isDragging ? 'grabbing' : 'grab'} active:cursor-grabbing`}
                    >
                        {Object.keys(STATUS_CONFIG).map((status) => {
                            const config = STATUS_CONFIG[status];
                            const count = stats?.statusCounts?.find((s: any) => s._id === status)?.count || 0;
                            const percentage = stats?.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0;

                            return (
                                <Card
                                    key={status}
                                    className="min-w-[240px] rounded-xl border border-border snap-start bg-card flex-none transition-all hover:border-primary/20"
                                >
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                            {status.replace(/_/g, ' ')}
                                        </CardTitle>
                                        <div style={{ color: count > 0 ? config.color : 'var(--muted-foreground)' }} className="opacity-70">
                                            {React.isValidElement(config.icon) ? React.cloneElement(config.icon as any, { size: 14 }) : null}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="text-3xl font-bold tabular-nums italic text-foreground">
                                            {count}
                                        </div>
                                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1.2 }}
                                                className="h-full"
                                                style={{ backgroundColor: count > 0 ? config.color : 'transparent' }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>


                {/* --- STAGE 5: ADVANCED ANALYTICS MATRIX --- */}
                <div className="grid gap-8 lg:grid-cols-2 mt-8 px-2 pb-20">

                    {/* Conversion Efficiency Funnel */}
                    <Card className="rounded-[2.5rem] border shadow-sm bg-card/40 ring-1 ring-border/50 overflow-hidden">
                        <CardHeader className="p-8 border-b border-border/30">
                            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                            Lead Pipeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px] md:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { stage: 'Total', value: stats?.totalLeads || 0 },
                                    { stage: 'Active', value: categorizedStats.pipelines },
                                    { stage: 'Verified', value: stats?.statusCounts.find((s: any) => s._id === 'VERIFIED')?.count || 0 },
                                    { stage: 'Paid', value: stats?.statusCounts.find((s: any) => s._id === 'PAID')?.count || 0 },
                                ]}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis dataKey="stage" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="currentColor" radius={[4, 4, 0, 0]} barSize={30} className="text-primary">
                                        <Cell fillOpacity={0.9} />
                                        <Cell fillOpacity={0.7} />
                                        <Cell fillOpacity={0.5} />
                                        <Cell fillOpacity={0.3} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Categorical Proportion Gauge */}
                    <Card className="rounded-[2.5rem] border shadow-sm bg-card/40 ring-1 ring-border/50 overflow-hidden">
                        <CardHeader className="p-8 border-b border-border/30">
                            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                            Conversion Success
                            </CardTitle>
                          
                        </CardHeader>
                        <div className="flex-1 flex items-center justify-center relative h-[220px] md:h-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Active', value: categorizedStats.pipelines },
                                            { name: 'Converted', value: categorizedStats.closures },
                                            { name: 'Risk', value: categorizedStats.issues },
                                        ]}
                                        innerRadius="70%" outerRadius="90%" paddingAngle={5} dataKey="value"
                                    >
                                        <Cell fill="var(--primary)" />
                                        <Cell fill="var(--foreground)" fillOpacity={0.2} />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute text-center">
                                <div className="text-3xl font-black italic">
                                    {stats?.totalLeads > 0 ? `${((categorizedStats.closures / stats.totalLeads) * 100).toFixed(0)}%` : '0%'}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-muted-foreground">Efficiency</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Status List Carousel */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Inventory Status Matrix</h2>
                    <div
                        ref={scrollContainerRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing py-4"
                    >
                        {Object.keys(STATUS_CONFIG).map((status, index) => {
                            const config = STATUS_CONFIG[status];
                            const count = stats?.statusCounts?.find((s: any) => s._id === status)?.count || 0;
                            const percentage = stats?.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0;

                            return (
                                <div key={status} className="snap-start flex-shrink-0 w-[220px] first:ml-1 last:mr-1">
                                    <Card className="w-full border shadow-none bg-card">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-[9px] font-bold uppercase text-muted-foreground">
                                                {status.replace(/_/g, ' ')}
                                            </CardTitle>
                                            <div style={{ color: config.color }} className="opacity-50">
                                                {React.isValidElement(config.icon) ? React.cloneElement(config.icon as any, { size: 12 }) : null}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="text-2xl font-bold italic">{count}</div>
                                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    className="h-full"
                                                    style={{ backgroundColor: count > 0 ? config.color : 'transparent' }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

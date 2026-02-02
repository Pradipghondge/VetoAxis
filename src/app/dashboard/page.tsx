"use client"

import * as React from "react"
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts'
import {
    Plus,
    LayoutDashboard,
    TrendingUp,
    CheckCircle,
    Activity,
    ChevronRight,
    ChevronLeft
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
        const walk = (x - startX) * 2 // Scroll Speed
        scrollContainerRef.current.scrollLeft = scrollLeft - walk
    }

    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`/api/leads/stats?t=${Date.now()}`)
            setStats(data)
        } finally { setLoading(false) }
    }

    useEffect(() => { if (!authLoading && user) fetchStats() }, [user, authLoading])

    // Calculate aggregated stats for the charts
    const categorizedStats = React.useMemo(() => {
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

    // Carousel Navigation Logic
    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2
            scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
        }
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 w-full max-w-[1700px] max-w-full overflow-hidden mx-auto">

                {/* Dashboard Title & Inset Header Section */}
                <div className="flex items-center justify-between px-2">
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">HELLO</h1>
                        <p className="text-[13px] text-muted-foreground">{user?.name}</p>
                    </div>
                <Link href="/leads/create">
                    <Button size="sm" className="h-9 rounded-md px-4 text-xs font-semibold gap-2">
                        <Plus className="h-3.5 w-3.5" /> Create Leads
                    </Button>
                </Link>
                </div>

                {/* SECTION 1: Monochrome Metric Strip */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-xl border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Leads</CardTitle>
                            <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Live data uplink active</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-xl border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pipeline</CardTitle>
                            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Currently in outreach phase</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-xl border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conversions</CardTitle>
                            <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">2</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Verified records ready for billing</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-xl border shadow-sm text-destructive">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium uppercase tracking-wider">Risk Alerts</CardTitle>
                            <Activity className="h-3.5 w-3.5" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1</div>
                            <p className="text-[10px] mt-1 opacity-70">Manual protocol bypass required</p>
                        </CardContent>
                    </Card>
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
                        <CardContent className="h-[340px] px-2 pb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={Object.keys(STATUS_CONFIG).map(status => ({
                                        name: status.replace(/_/g, ' '),
                                        value: stats?.statusCounts.find((s: any) => s._id === status)?.count || 0,
                                        color: STATUS_CONFIG[status].color
                                    })).sort((a, b) => b.value - a.value)} // Important statuses to the top
                                    margin={{ left: 20, right: 40, top: 0, bottom: 0 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="var(--muted-foreground)"
                                        fontSize={9}
                                        width={120}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontWeight: 700, fill: 'var(--muted-foreground)' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                                        contentStyle={{
                                            backgroundColor: 'var(--background)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: 'bold'
                                        }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        radius={[0, 4, 4, 0]}
                                        barSize={12}
                                        animationDuration={1500}
                                    >
                                        {/* Dynamic coloring based on your STATUS_CONFIG Registry */}
                                        {Object.keys(STATUS_CONFIG).map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={STATUS_CONFIG[entry]?.color || 'var(--primary)'}
                                                className="opacity-80 hover:opacity-100 transition-opacity"
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Pulse Feed Table (Matched to image_0302c8.png) */}
                    <Card className="lg:col-span-3 rounded-2xl border shadow-sm bg-card/40">
                        <CardHeader className="p-6 border-b">
                            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                                All Leads
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[360px] overflow-y-auto no-scrollbar">
                            <div className="divide-y border-border">
                                {stats?.recentActivity?.map((act: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                                        <div className="h-9 w-9 rounded-md bg-muted border border-border flex items-center justify-center text-[11px] font-bold">
                                            {act.firstName[0]}{act.lastName[0]}
                                        </div>
                                        <div className="flex-1 space-y-0.5">
                                            <p className="text-sm font-semibold leading-none">{act.firstName} {act.lastName}</p>
                                            <p className="text-[11px] text-muted-foreground uppercase tracking-tight">
                                                State: <span className="text-foreground font-medium">{act.statusHistory.toStatus}</span>
                                            </p>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground tabular-nums font-bold">
                                            {format(new Date(act.statusHistory.timestamp), 'HH:mm')}
                                        </div>
                                    </div>
                                ))}
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
                        <CardContent className="h-[350px] p-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        { stage: 'Total Ingested', value: stats?.totalLeads || 0 },
                                        { stage: 'In Pipeline', value: categorizedStats.pipelines },
                                        { stage: 'Verified', value: stats?.statusCounts.find((s: any) => s._id === 'VERIFIED')?.count || 0 },
                                        { stage: 'Paid Closures', value: stats?.statusCounts.find((s: any) => s._id === 'PAID')?.count || 0 },
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis
                                        dataKey="stage"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px' }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="var(--foreground)"
                                        radius={[10, 10, 0, 0]}
                                        barSize={60}
                                    >
                                        {/* Visual gradient effect matching the Ingestion Matrix */}
                                        <Cell fillOpacity={0.8} />
                                        <Cell fillOpacity={0.6} />
                                        <Cell fillOpacity={0.4} />
                                        <Cell fillOpacity={0.2} />
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
                        <CardContent className="h-[350px] p-0 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Active Pipeline', value: categorizedStats.pipelines, color: 'var(--primary)' },
                                            { name: 'Verified Closures', value: categorizedStats.closures, color: 'var(--foreground)' },
                                            { name: 'Risk Anomalies', value: categorizedStats.issues, color: '#ef4444' },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {/* Dynamic mapping to themed colors */}
                                        <Cell fill="var(--primary)" fillOpacity={0.8} />
                                        <Cell fill="var(--foreground)" fillOpacity={0.2} />
                                        <Cell fill="#ef4444" fillOpacity={0.5} />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '11px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Label for the Gauge */}
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-3xl font-black italic tracking-tighter tabular-nums">
                                    {stats?.totalLeads > 0 ? (((categorizedStats.closures / stats.totalLeads) * 100).toFixed(0)) : 0}%
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Success Rate
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}

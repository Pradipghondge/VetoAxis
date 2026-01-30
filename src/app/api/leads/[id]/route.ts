import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Define as Promise
) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // FIX: Await params before accessing .id
    const { id: leadId } = await params;

    const lead = await Lead.findById(leadId)
      .populate('createdBy', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

    // Admin/Creator check logic remains the same
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin' &&
        lead.createdBy && lead.createdBy._id.toString() !== decoded.id) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 403 });
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Define as Promise
) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // FIX: Await params before accessing .id
    const { id: leadId } = await params;
    const body = await request.json();

    const lead = await Lead.findById(leadId);
    if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

    // Handle status history and dynamic fields as before
    if (body.status && body.status !== lead.status) {
      lead.statusHistory.push({
        fromStatus: lead.status,
        toStatus: body.status,
        notes: body.statusNote || "",
        changedBy: decoded.id,
        timestamp: new Date()
      });
      lead.status = body.status;
    }

    // Dynamic fields transformation
    if (body.fields && typeof body.fields === 'object') {
      lead.fields = Object.entries(body.fields)
        .filter(([_, v]) => v)
        .map(([k, v]) => ({ key: k, value: v }));
    }

    // Update basic fields
    const updateable = ['firstName', 'lastName', 'email', 'phone', 'address', 'applicationType', 'lawsuit', 'notes'];
    updateable.forEach(field => { if (body[field]) lead[field] = body[field]; });

    await lead.save();
    return NextResponse.json({ message: 'Updated successfully', lead });
  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
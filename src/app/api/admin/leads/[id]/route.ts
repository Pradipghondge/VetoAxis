import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    await dbConnect();

    // Verify authentication
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;
    const userRole = decoded.role;

    // Check if the lead exists
    const lead = await Lead.findById(leadId)
      .populate('createdBy', 'name email organizationId')
      .populate('statusHistory.changedBy', 'name email')
      .populate('organizationId', 'name');

    if (!lead) {
      return NextResponse.json(
        { message: 'Lead not found' },
        { status: 404 }
      );
    }

    // Check organization access (unless super_admin)
    if (userRole !== 'super_admin') {
      const user = await User.findById(userId).select('organizationId');

      // Must be in same organization or be the creator
      if (!user ||
          (!user.organizationId || lead.organizationId.toString() !== user.organizationId.toString()) &&
          lead.createdBy && lead.createdBy._id.toString() !== userId) {
        return NextResponse.json(
          { message: 'You do not have permission to view this lead' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    await dbConnect();

    // Verify authentication
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    console.log("Received request body:", body); // Added log
    const { status, notes, buyerCode } = body;
    console.log("Received buyerCode:", buyerCode); // Added log

    const statusHistory = {
      fromStatus: (await Lead.findById(leadId).select('status')).status,
      toStatus: status,
      notes: notes || "",
      changedBy: decoded.id
    };

    console.log("Attempting to save buyerCode:", buyerCode); // Added log
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      {
        $set: { status, buyerCode },
        $push: { statusHistory },
      },
      { new: true }
    );

    if (!updatedLead) {
      return NextResponse.json(
        { message: 'Lead not found' },
        { status: 404 }
      );
    }

    console.log("Lead after update:", updatedLead); // Added log

    return NextResponse.json({
      message: 'Lead updated successfully',
      lead: updatedLead,
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    await dbConnect();

    // Verify authentication and role
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object' || decoded.role !== 'super_admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const deletedLead = await Lead.findByIdAndDelete(leadId);

    if (!deletedLead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

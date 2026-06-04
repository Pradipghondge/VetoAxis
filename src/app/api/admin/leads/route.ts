import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = decoded.id;
    const userRole = decoded.role;

    if (!['admin', 'super_admin'].includes(userRole as string)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Get query parameters for potential filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const createdBy = searchParams.get('createdBy');
    const buyerCode = searchParams.get('buyerCode');
    const entryDate = searchParams.get('entryDate');
    const search = searchParams.get('search')?.trim();
    const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
    const limitParam = Number.parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`, 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    if (buyerCode) {
      query.buyerCode = buyerCode;
    }
    if (entryDate) {
      const parsed = parseDateOnly(entryDate);
      if (parsed) {
        const start = new Date(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0, 0);
        const end = new Date(parsed.year, parsed.month - 1, parsed.day, 23, 59, 59, 999);
        query.createdAt = { $gte: start, $lte: end };
      }
    }
    if (userRole === 'admin') {
      query.createdBy = userId;
    } else if (createdBy) {
      query.createdBy = createdBy;
    }
    if (search) {
      const regex = { $regex: escapeRegex(search), $options: 'i' };
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const countStatuses = (statuses: string[]) => {
      if (query.status && !statuses.includes(query.status)) return Promise.resolve(0);

      return Lead.countDocuments({
        ...query,
        status: statuses.length === 1 ? statuses[0] : { $in: statuses },
      });
    };

    const [leads, total, pending, verified, rejected] = await Promise.all([
      Lead.find(query)
        .select('firstName lastName email phone status applicationType createdAt buyerCode createdBy')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(query),
      countStatuses(['PENDING']),
      countStatuses(['VERIFIED', 'ID_VERIFIED']),
      countStatuses(['REJECTED', 'REJECTED_BY_CLIENT']),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        pending,
        verified,
        rejected,
      },
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

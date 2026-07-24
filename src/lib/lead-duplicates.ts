import Lead from '@/models/Lead';
import { normalizeEmail, normalizeText } from '@/lib/lead-utils';

type DuplicateScope = Record<string, unknown>;

export type LeadDuplicateResult = {
  isDuplicate: boolean;
  duplicateReason: 'email' | 'full name' | '';
  existingLeadInfo: {
    id: unknown;
    name: string;
    status: string;
    createdBy: string;
    createdAt: Date;
  } | null;
};

export const buildLeadDuplicateScope = (decoded: any, user: any): DuplicateScope => {
  if (decoded.role === 'super_admin') return {};
  if (user?.organizationId) return { organizationId: user.organizationId };
  return { createdBy: decoded.id };
};

const buildLeadInfo = (lead: any) => ({
  id: lead._id,
  name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
  status: lead.status,
  createdBy: lead.createdBy ? lead.createdBy.name : 'Unknown',
  createdAt: lead.createdAt,
});

export const findDuplicateLead = async ({
  decoded,
  user,
  email,
  firstName,
  lastName,
}: {
  decoded: any;
  user: any;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): Promise<LeadDuplicateResult> => {
  const scope = buildLeadDuplicateScope(decoded, user);
  const emailNormalized = normalizeEmail(email);
  const fullNameNormalized = normalizeText(`${firstName || ''} ${lastName || ''}`);

  if (emailNormalized) {
    const duplicateEmail = await Lead.findOne({
      ...scope,
      emailNormalized,
    })
      .select('_id firstName lastName status createdBy createdAt')
      .populate('createdBy', 'name email')
      .lean();

    if (duplicateEmail) {
      return {
        isDuplicate: true,
        duplicateReason: 'email',
        existingLeadInfo: buildLeadInfo(duplicateEmail),
      };
    }

    return { isDuplicate: false, duplicateReason: '', existingLeadInfo: null };
  }

  if (fullNameNormalized) {
    const duplicateName = await Lead.findOne({
      ...scope,
      fullNameNormalized,
    })
      .select('_id firstName lastName status createdBy createdAt')
      .populate('createdBy', 'name email')
      .lean();

    if (duplicateName) {
      return {
        isDuplicate: true,
        duplicateReason: 'full name',
        existingLeadInfo: buildLeadInfo(duplicateName),
      };
    }
  }

  return { isDuplicate: false, duplicateReason: '', existingLeadInfo: null };
};

import { request } from './api';

const DEFAULT_IMAGES = {
  job: 'https://images.unsplash.com/photo-1592982537447-9fea6aff1093?w=800&auto=format&fit=crop&q=80',
  equipment: 'https://images.unsplash.com/photo-1614358145930-2a892f54a5f0?w=800&auto=format&fit=crop&q=80',
  cattle: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=80',
};

function getAvatarFromUser(user) {
  if (!user) return null;
  const src =
    user.profilePhoto?.url ??
    user.profilePhoto ??
    user.avatar?.url ??
    user.avatar ??
    null;
  return src;
}

export function mapOpportunityToCard(raw) {
  if (!raw) return null;
  const type = raw.type || 'job';
  const locationText = raw.location?.text || 'Location not specified';
  const owner = raw.farmer
    ? {
        _id: raw.farmer._id,
        name: raw.farmer.name || 'Farmer',
        avatar: getAvatarFromUser(raw.farmer),
      }
    : null;

  let priceLabel = 'Price on request';
  if (type === 'job') {
    if (raw.paymentType === 'per_day' && raw.amount != null) {
      priceLabel = `₹${raw.amount}/day`;
    } else if (raw.paymentType === 'per_hour' && raw.amount != null) {
      priceLabel = `₹${raw.amount}/hour`;
    } else if (raw.paymentType === 'fixed' && raw.amount != null) {
      priceLabel = `₹${raw.amount} fixed`;
    }
  } else if (type === 'equipment') {
    if (raw.rentalUnit === 'per_hour' && raw.amount != null) {
      priceLabel = `₹${raw.amount}/hour`;
    } else if (raw.rentalUnit === 'per_day' && raw.amount != null) {
      priceLabel = `₹${raw.amount}/day`;
    } else if (raw.rentalUnit === 'per_acre' && raw.amount != null) {
      priceLabel = `₹${raw.amount}/acre`;
    }
  } else if (type === 'cattle') {
    if (raw.pricePerDay != null) {
      priceLabel = `₹${raw.pricePerDay}/day`;
    }
  }

  const firstImage = raw.images?.[0]?.url || DEFAULT_IMAGES[type] || DEFAULT_IMAGES.job;

  return {
    _id: raw._id,
    type,
    title: raw.title,
    description: raw.description,
    urgent: !!raw.urgent,
    location: locationText,
    priceLabel,
    amount: raw.amount,
    ratingAverage: raw.ratingAverage ?? 0,
    ratingCount: raw.ratingCount ?? 0,
    applicantsCount: raw.applicantsCount ?? 0,
    imageUrl: firstImage,
    owner,
    isOwner: !!raw.isOwner,
    workType: raw.workType,
    workersRequired: raw.workersRequired,
    startDate: raw.startDate,
    durationDays: raw.durationDays,
    durationHours: raw.durationHours,
    foodIncluded: raw.foodIncluded,
    stayIncluded: raw.stayIncluded,
    contactMethods: raw.contactMethods || [],
    equipmentName: raw.equipmentName,
    equipmentBrandModel: raw.equipmentBrandModel,
    equipmentCondition: raw.equipmentCondition,
    rentalUnit: raw.rentalUnit,
    securityDeposit: raw.securityDeposit,
    deliveryAvailable: raw.deliveryAvailable,
    fuelIncluded: raw.fuelIncluded,
    animalType: raw.animalType,
    purpose: raw.purpose,
    pricePerDay: raw.pricePerDay,
    healthCondition: raw.healthCondition,
    vaccinated: raw.vaccinated,
    ageYears: raw.ageYears,
    createdAt: raw.createdAt,
    raw,
  };
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, String(value));
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const opportunityService = {
  async list(params = {}) {
    const query = buildQueryString(params);
    const { data } = await request('GET', `/opportunities${query}`);
    const list = (data.data || data || []).map(mapOpportunityToCard);
    const pagination = data.meta?.pagination || data.pagination || {};
    return { opportunities: list, pagination };
  },

  async getById(id) {
    const { data } = await request('GET', `/opportunities/${id}`);
    const raw = data.data || data;
    return mapOpportunityToCard(raw);
  },

  async create(payload, options = {}) {
    if (payload instanceof FormData) {
      const { data } = await request('POST', '/opportunities', null, {
        body: payload,
        onUploadProgress: options.onUploadProgress,
      });
      const raw = data.data || data;
      return mapOpportunityToCard(raw);
    }
    const { data } = await request('POST', '/opportunities', payload);
    const raw = data.data || data;
    return mapOpportunityToCard(raw);
  },

  async apply(id, body) {
    const { data } = await request('POST', `/opportunities/${id}/applications`, body);
    const raw = data.data || data;
    return raw;
  },

  async getMine(params = {}) {
    const query = buildQueryString(params);
    const { data } = await request('GET', `/opportunities/mine${query}`);
    const items = (data.data || data || []).map(mapOpportunityToCard);
    const pagination = data.meta?.pagination || data.pagination || {};
    return { opportunities: items, pagination };
  },

  async getMyApplications(params = {}) {
    const query = buildQueryString(params);
    const { data } = await request('GET', `/opportunities/applications/mine${query}`);
    const applications = (data.data || data || []).map((app) => ({
      _id: app._id,
      status: app.status,
      createdAt: app.createdAt,
      opportunity: app.opportunity ? mapOpportunityToCard(app.opportunity) : null,
    }));
    const pagination = data.meta?.pagination || data.pagination || {};
    return { applications, pagination };
  },

  async getApplicationsForOpportunity(id, params = {}) {
    const query = buildQueryString(params);
    const { data } = await request('GET', `/opportunities/${id}/applications${query}`);
    const items = (data.data || data || []).map((app) => ({
      _id: app._id,
      name: app.name,
      experience: app.experience,
      experienceYears: app.experienceYears,
      expectedPay: app.expectedPay,
      message: app.message,
      phone: app.phone,
      aadhaarLast4: app.aadhaarLast4,
      skills: app.skills,
      idProofUrl: app.idProofUrl,
      status: app.status,
      createdAt: app.createdAt,
      applicant: app.applicant
        ? {
            _id: app.applicant._id,
            name: app.applicant.name,
            avatar: getAvatarFromUser(app.applicant),
            phoneNumber: app.applicant.phoneNumber,
          }
        : null,
    }));
    const meta = data.meta || {};
    const pagination = meta.pagination || data.pagination || {};
    const opportunity = meta.opportunity || null;
    return { applications: items, pagination, opportunity };
  },

  async updateApplicationStatus(id, applicationId, status) {
    const { data } = await request(
      'PATCH',
      `/opportunities/${id}/applications/${applicationId}`,
      { status }
    );
    return data.data || data;
  },

  async delete(id) {
    const { data } = await request('DELETE', `/opportunities/${id}`);
    return data.data || data;
  },
};


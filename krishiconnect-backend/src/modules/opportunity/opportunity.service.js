const mongoose = require('mongoose');
const crypto = require('crypto');
const Opportunity = require('./opportunity.model');
const OpportunityApplication = require('./application.model');
const Pagination = require('../../utils/pagination');
const ApiError = require('../../utils/ApiError');
const { deleteFromCloudinary } = require('../../utils/uploadToCloudinary');

const opportunityPagination = new Pagination(Opportunity);
const applicationPagination = new Pagination(OpportunityApplication);

function buildLocation(body) {
  const { locationText, lat, lng } = body;
  const loc = {
    text: locationText,
  };
  if (typeof lat === 'number' && typeof lng === 'number') {
    loc.coordinates = {
      type: 'Point',
      coordinates: [lng, lat],
    };
  }
  return loc;
}

function mapImages(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (!trimmed) return null;
        return { url: trimmed };
      }
      if (typeof item === 'object' && typeof item.url === 'string') {
        const out = { url: item.url.trim() };
        if (item.publicId) out.publicId = item.publicId;
        if (item.public_id) out.publicId = item.public_id;
        return out;
      }
      return null;
    })
    .filter(Boolean);
}

async function createOpportunity(userId, body) {
  const location = buildLocation(body);
  const requirements = Array.isArray(body.requirements)
    ? body.requirements.filter((r) => typeof r === 'string' && r.trim())
    : [];
  const images = mapImages(body.images);

  const doc = await Opportunity.create({
    farmer: userId,
    type: body.type,
    title: body.title,
    description: body.description || '',
    paymentType: body.paymentType || null,
    amount: body.amount != null ? Number(body.amount) : undefined,
    urgent: body.urgent === true,
    location,
    requirements,
    images,
    availabilityFrom: body.availabilityFrom || body.startDate || undefined,
    availabilityTo: body.availabilityTo || undefined,

    // Job
    workType: body.workType || null,
    workersRequired: body.workersRequired || undefined,
    startDate: body.startDate || undefined,
    durationDays: body.durationDays || undefined,
    durationHours: body.durationHours || undefined,
    foodIncluded: body.foodIncluded === true,
    stayIncluded: body.stayIncluded === true,
    contactMethods: Array.isArray(body.contactMethods) ? body.contactMethods : [],

    // Equipment
    equipmentName: body.equipmentName || undefined,
    equipmentBrandModel: body.equipmentBrandModel || undefined,
    equipmentCondition: body.equipmentCondition || null,
    rentalUnit: body.rentalUnit || null,
    securityDeposit: body.securityDeposit != null ? Number(body.securityDeposit) : undefined,
    deliveryAvailable: body.deliveryAvailable === true,
    fuelIncluded: body.fuelIncluded === true,

    // Cattle
    animalType: body.animalType || null,
    purpose: body.purpose || null,
    pricePerDay: body.pricePerDay != null ? Number(body.pricePerDay) : undefined,
    healthCondition: body.healthCondition || undefined,
    vaccinated: body.vaccinated === true,
    ageYears: body.ageYears != null ? Number(body.ageYears) : undefined,
  });

  return doc;
}

async function listOpportunities(query = {}, viewerId = null) {
  const {
    page = 1,
    limit = 20,
    type,
    q,
    urgent,
    sort = 'latest',
    lat,
    lng,
    radiusKm = 50,
  } = query;

  const filter = { isDeleted: false };
  if (type) {
    filter.type = type;
  }
  if (typeof urgent === 'boolean') {
    filter.urgent = urgent;
  }
  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [
      { title: regex },
      { description: regex },
      { 'location.text': regex },
      { equipmentName: regex },
      { equipmentBrandModel: regex },
    ];
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_low') {
    sortOption = { amount: 1 };
  } else if (sort === 'price_high') {
    sortOption = { amount: -1 };
  } else if (sort === 'nearest' && typeof lat === 'number' && typeof lng === 'number') {
    filter['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: radiusKm * 1000,
      },
    };
    // When using $near, MongoDB requires a 2dsphere index and ignores sort; distance is implicit
    sortOption = {};
  }

  const result = await opportunityPagination.paginate(filter, {
    page,
    limit,
    sort: sortOption,
    populate: [{ path: 'farmer', select: 'name avatar profilePhoto' }],
  });

  // Shape for frontend cards
  const data = result.data.map((doc) => {
    const o = doc.toObject ? doc.toObject() : doc;
    return {
      _id: o._id,
      type: o.type,
      title: o.title,
      description: o.description,
      paymentType: o.paymentType,
      amount: o.amount,
      currency: o.currency,
      urgent: o.urgent,
      ratingAverage: o.ratingAverage,
      ratingCount: o.ratingCount,
      applicantsCount: o.applicantsCount,
      location: o.location,
      requirements: o.requirements || [],
      images: o.images || [],
      availabilityFrom: o.availabilityFrom,
      availabilityTo: o.availabilityTo,
      workType: o.workType,
      workersRequired: o.workersRequired,
      startDate: o.startDate,
      durationDays: o.durationDays,
      durationHours: o.durationHours,
      foodIncluded: o.foodIncluded,
      stayIncluded: o.stayIncluded,
      contactMethods: o.contactMethods || [],
      equipmentName: o.equipmentName,
      equipmentBrandModel: o.equipmentBrandModel,
      equipmentCondition: o.equipmentCondition,
      rentalUnit: o.rentalUnit,
      securityDeposit: o.securityDeposit,
      deliveryAvailable: o.deliveryAvailable,
      fuelIncluded: o.fuelIncluded,
      animalType: o.animalType,
      purpose: o.purpose,
      pricePerDay: o.pricePerDay,
      healthCondition: o.healthCondition,
      vaccinated: o.vaccinated,
      ageYears: o.ageYears,
      createdAt: o.createdAt,
      farmer: o.farmer
        ? {
            _id: o.farmer._id,
            name: o.farmer.name,
            avatar:
              o.farmer.profilePhoto?.url ||
              o.farmer.profilePhoto ||
              o.farmer.avatar?.url ||
              o.farmer.avatar ||
              null,
          }
        : null,
      isOwner: viewerId && o.farmer && String(o.farmer._id) === String(viewerId),
    };
  });

  return { data, pagination: result.pagination };
}

async function getOpportunityById(id, viewerId = null) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid opportunity id');
  }
  const doc = await Opportunity.findOne({ _id: id, isDeleted: false })
    .populate('farmer', 'name avatar profilePhoto')
    .lean();
  if (!doc) {
    throw new ApiError(404, 'Opportunity not found');
  }
  const farmer = doc.farmer
    ? {
        _id: doc.farmer._id,
        name: doc.farmer.name,
        avatar:
          doc.farmer.profilePhoto?.url ||
          doc.farmer.profilePhoto ||
          doc.farmer.avatar?.url ||
          doc.farmer.avatar ||
          null,
      }
    : null;
  return {
    ...doc,
    farmer,
    isOwner: viewerId && farmer && String(farmer._id) === String(viewerId),
  };
}

async function getMyOpportunities(userId, query = {}) {
  const { page = 1, limit = 20 } = query;
  const result = await opportunityPagination.paginate(
    { farmer: userId, isDeleted: false },
    {
      page,
      limit,
      sort: { createdAt: -1 },
    }
  );
  return result;
}

async function applyToOpportunity(opportunityId, applicantId, body) {
  const opp = await Opportunity.findOne({ _id: opportunityId, isDeleted: false }).lean();
  if (!opp) {
    throw new ApiError(404, 'Opportunity not found');
  }
  if (String(opp.farmer) === String(applicantId)) {
    throw new ApiError(400, 'You cannot apply to your own opportunity');
  }

  const phone = (body.phone || '').trim();
  const skills = (body.skills || '').trim();
  const idProofUrl = (body.idProofUrl || '').trim();
  const experienceYears =
    body.experienceYears != null ? Number(body.experienceYears) : undefined;

  const rawGovtId = (body.govtIdNumber || '').trim();
  const normalizedGovtId = rawGovtId.replace(/\s+/g, '');
  const digitsOnly = normalizedGovtId.replace(/\D/g, '');
  const aadhaarLast4 =
    digitsOnly && digitsOnly.length >= 4 ? digitsOnly.slice(-4) : undefined;
  const govtIdHash = normalizedGovtId
    ? crypto.createHash('sha256').update(normalizedGovtId).digest('hex')
    : undefined;

  const doc = await OpportunityApplication.findOneAndUpdate(
    { opportunity: opportunityId, applicant: applicantId },
    {
      $set: {
        name: body.name,
        experience: body.experience || '',
        experienceYears,
        expectedPay: body.expectedPay || '',
        message: body.message || '',
        phone,
        skills,
        idProofUrl,
        ...(aadhaarLast4 ? { aadhaarLast4 } : {}),
        ...(govtIdHash ? { govtIdHash } : {}),
        status: 'pending',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Opportunity.updateOne(
    { _id: opportunityId },
    { $inc: { applicantsCount: 1 } }
  ).catch(() => {});

  return { application: doc, opportunity: opp };
}

async function getApplicationsForOpportunity(opportunityId, ownerId, query = {}) {
  const opp = await Opportunity.findById(opportunityId).lean();
  if (!opp || opp.isDeleted) {
    throw new ApiError(404, 'Opportunity not found');
  }
  if (String(opp.farmer) !== String(ownerId)) {
    throw new ApiError(403, 'Only the owner can view applicants');
  }

  const { page = 1, limit = 20 } = query;
  const result = await applicationPagination.paginate(
    { opportunity: opportunityId },
    {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [{ path: 'applicant', select: 'name avatar profilePhoto phoneNumber' }],
    }
  );

  return { opportunity: opp, ...result };
}

async function getMyApplications(applicantId, query = {}) {
  const { page = 1, limit = 20 } = query;
  const result = await applicationPagination.paginate(
    { applicant: applicantId },
    {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'opportunity',
          populate: { path: 'farmer', select: 'name avatar profilePhoto' },
        },
      ],
    }
  );
  return result;
}

async function updateApplicationStatus(opportunityId, applicationId, ownerId, status) {
  const opp = await Opportunity.findById(opportunityId).lean();
  if (!opp || opp.isDeleted) {
    throw new ApiError(404, 'Opportunity not found');
  }
  if (String(opp.farmer) !== String(ownerId)) {
    throw new ApiError(403, 'Only the owner can update application status');
  }

  const app = await OpportunityApplication.findOneAndUpdate(
    { _id: applicationId, opportunity: opportunityId },
    { status },
    { new: true }
  )
    .populate('applicant', 'name avatar profilePhoto phoneNumber')
    .lean();

  if (!app) {
    throw new ApiError(404, 'Application not found');
  }

  let rejectedApplications = [];

  if (status === 'accepted') {
    const acceptedCount = await OpportunityApplication.countDocuments({
      opportunity: opportunityId,
      status: 'accepted',
    });
    const required =
      opp.type === 'job' && typeof opp.workersRequired === 'number' && opp.workersRequired >= 1
        ? opp.workersRequired
        : 1;

    if (acceptedCount >= required) {
      const pending = await OpportunityApplication.find(
        { opportunity: opportunityId, status: 'pending', _id: { $ne: applicationId } },
        { applicant: 1, _id: 1 }
      )
        .lean();

      if (pending.length > 0) {
        await OpportunityApplication.updateMany(
          { opportunity: opportunityId, status: 'pending', _id: { $ne: applicationId } },
          { status: 'rejected' }
        );
        rejectedApplications = pending.map((a) => ({
          _id: a._id,
          applicant: a.applicant,
        }));
      }
    }
  }

  return { opportunity: opp, application: app, rejectedApplications };
}

async function deleteOpportunity(opportunityId, userId) {
  if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
    throw new ApiError(400, 'Invalid opportunity id');
  }

  const doc = await Opportunity.findById(opportunityId).lean();
  if (!doc || doc.isDeleted) {
    throw new ApiError(404, 'Opportunity not found');
  }
  if (String(doc.farmer) !== String(userId)) {
    throw new ApiError(403, 'Only the owner can delete this opportunity');
  }

  const images = Array.isArray(doc.images) ? doc.images : [];

  await Opportunity.updateOne(
    { _id: opportunityId },
    {
      $set: {
        isDeleted: true,
        images: [],
      },
    }
  );

  images
    .filter((img) => img && img.publicId)
    .forEach((img) => {
      deleteFromCloudinary(img.publicId, 'image');
    });
}

module.exports = {
  createOpportunity,
  listOpportunities,
  getOpportunityById,
  getMyOpportunities,
  applyToOpportunity,
  getApplicationsForOpportunity,
  getMyApplications,
  updateApplicationStatus,
  deleteOpportunity,
};


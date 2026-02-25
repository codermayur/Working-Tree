import { api } from './api';

export const expertApplicationConstants = {
  EXPERTISE_AREAS: [
    "Crop Science",
    "Soil Health",
    "Pest Management",
    "Irrigation",
    "Organic Farming",
    "AgriTech",
    "Livestock",
    "Other"
  ],
  GOVERNMENT_ID_TYPES: ["Aadhar", "PAN", "Passport", "Voter ID"],
  ISSUING_AUTHORITIES: ["ICAR", "NABARD", "State Agri Dept", "Ministry of Agriculture", "SFAC", "Other"],
  /** Alias for UI chips (same as ISSUING_AUTHORITIES) */
  ISSUING_AUTHORITY_CHIPS: ["ICAR", "NABARD", "State Agri Dept", "Ministry of Agriculture", "SFAC", "Other"],
  STATUS: {
    NONE: "none",
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected"
  },
  EXPERIENCE_BADGE: {
    JUNIOR: { label: "Junior", range: "1-3 yrs", min: 1, max: 3 },
    MID: { label: "Mid-level", range: "4-8 yrs", min: 4, max: 8 },
    SENIOR: { label: "Senior", range: "9-15 yrs", min: 9, max: 15 },
    EXPERT: { label: "Expert", range: "16+ yrs", min: 16, max: Infinity }
  }
};

export const expertApplicationService = {

  // Upload certificate file (PDF/JPG/PNG); returns { certificateFileUrl }
  uploadCertificate: async (file) => {
    const formData = new FormData();
    formData.append('certificate', file);
    const response = await api.post('/expert-application/upload-certificate', formData, {
      headers: { 'Content-Type': false },
    });
    const data = response.data?.data ?? response.data;
    return data;
  },

  // Submit expert application (accepts FormData or plain object; backend expects JSON when certificate already uploaded)
  applyForExpert: async (formDataOrPayload) => {
    const isFormData = formDataOrPayload instanceof FormData;
    const response = await api.post(
      '/expert-application/apply',
      formDataOrPayload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    );
    return response.data?.data ?? response.data;
  },

  // Get current user's application status
  getMyApplication: async () => {
    const response = await api.get("/expert-application/my-application");
    return response.data;
  },

  // Get all applications (admin only)
  getAllApplications: async (params = {}) => {
    const { page = 1, limit = 10, status = '' } = typeof params === 'object' && params !== null ? params : {};
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(page));
    searchParams.set('limit', String(limit));
    if (status) searchParams.set('status', String(status));
    const response = await api.get(`/expert-application/all?${searchParams.toString()}`);
    const body = response.data || {};
    return {
      data: Array.isArray(body.data) ? body.data : (body.data != null ? [body.data] : []),
      pagination: body.meta?.pagination ?? body.pagination ?? { page: 1, totalPages: 1, totalItems: 0 },
    };
  },

  // Get single application by ID (admin only)
  getApplicationById: async (id) => {
    const response = await api.get(`/expert-application/${id}`);
    const body = response.data || {};
    return body.data ?? body;
  },

  /** Alias for AdminExpertApplicationsPage */
  getById: async (id) => {
    return this.getApplicationById(id);
  },

  // Approve application (admin only)
  approveApplication: async (id) => {
    const response = await api.patch(`/expert-application/${id}/approve`);
    return response.data;
  },

  // Reject application (admin only)
  rejectApplication: async (id, adminNote) => {
    const response = await api.patch(`/expert-application/${id}/reject`, {
      adminNote
    });
    return response.data;
  },

  /** Alias for AdminExpertApplicationsPage */
  approve: async (id) => {
    return this.approveApplication(id);
  },
  reject: async (id, adminNote) => {
    return this.rejectApplication(id, adminNote);
  },

  // Helper: get experience badge based on years
  getExperienceBadge: (years) => {
    if (years >= 16) return expertApplicationConstants.EXPERIENCE_BADGE.EXPERT;
    if (years >= 9) return expertApplicationConstants.EXPERIENCE_BADGE.SENIOR;
    if (years >= 4) return expertApplicationConstants.EXPERIENCE_BADGE.MID;
    return expertApplicationConstants.EXPERIENCE_BADGE.JUNIOR;
  },

  // Helper: validate certificate file before upload
  validateCertificateFile: (file) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "Only PDF, JPG, or PNG files are accepted" };
    }
    if (file.size > maxSize) {
      return { valid: false, error: "File size exceeds 5MB. Please compress your file and try again" };
    }
    return { valid: true, error: null };
  }
};

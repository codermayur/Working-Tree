import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Search, MapPin, Clock, DollarSign, BookmarkPlus, Bookmark,
  Filter, X, ChevronDown, ChevronUp, Loader, AlertCircle, RefreshCw,
  CheckCircle, Star, Users, Building2, ArrowRight, Send, Eye, Tag
} from 'lucide-react';

// ============================================================================
// API PLACEHOLDER FUNCTIONS
// ============================================================================
const API_BASE = 'http://localhost:5000/api';
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const jobsApi = {
  fetchOpportunities: async (filters = {}) => {
    // TODO: GET ${API_BASE}/jobs?category=${filters.category}&type=${filters.type}&state=${filters.state}&q=${filters.query}
    await delay(800);
    return { jobs: DEMO_JOBS, total: DEMO_JOBS.length };
  },
  fetchFeaturedOpportunities: async () => {
    // TODO: GET ${API_BASE}/jobs/featured
    await delay(400);
    return { jobs: DEMO_JOBS.filter(j => j.featured) };
  },
  fetchJobDetails: async (jobId) => {
    // TODO: GET ${API_BASE}/jobs/${jobId}
    await delay(400);
    return { job: DEMO_JOBS.find(j => j._id === jobId) || DEMO_JOBS[0] };
  },
  applyForJob: async (jobId, data) => {
    // TODO: POST ${API_BASE}/jobs/${jobId}/apply  body: { coverLetter, resume }
    await delay(1200);
    return { success: true, applicationId: `app-${Date.now()}` };
  },
  saveJob: async (jobId) => {
    // TODO: POST ${API_BASE}/jobs/${jobId}/save
    await delay(300);
    return { success: true };
  },
  unsaveJob: async (jobId) => {
    // TODO: DELETE ${API_BASE}/jobs/${jobId}/save
    await delay(300);
    return { success: true };
  },
  fetchMyApplications: async () => {
    // TODO: GET ${API_BASE}/jobs/applications
    await delay(600);
    return { applications: DEMO_APPLICATIONS };
  },
  postOpportunity: async (data) => {
    // TODO: POST ${API_BASE}/jobs  body: data
    await delay(1000);
    return { job: { _id: `job-${Date.now()}`, ...data, postedAt: new Date().toISOString(), applicationsCount: 0 } };
  },
};

// ============================================================================
// DEMO DATA
// ============================================================================
const DEMO_JOBS = [
  {
    _id: 'j1', title: 'Farm Manager – Organic Wheat Farm', company: 'GreenHarvest Farms', companyLogo: '🌾',
    location: 'Ludhiana, Punjab', type: 'Full-time', category: 'Management',
    salary: '₹35,000–₹50,000/month', experience: '5+ years', posted: '2 days ago',
    description: 'We are seeking an experienced Farm Manager to oversee our 200-acre organic wheat farm. You will manage daily operations, coordinate with field workers, and ensure compliance with organic certification standards.',
    skills: ['Organic Farming', 'Team Management', 'Crop Planning', 'Irrigation'],
    applicationsCount: 34, views: 210, saved: false, applied: false, featured: true,
    deadline: 'March 15, 2026',
  },
  {
    _id: 'j2', title: 'Agricultural Extension Officer', company: 'Ministry of Agriculture, UP', companyLogo: '🏛️',
    location: 'Lucknow, Uttar Pradesh', type: 'Government', category: 'Advisory',
    salary: '₹45,000/month + Benefits', experience: '3+ years', posted: '5 days ago',
    description: 'Support farmers in adopting modern agricultural practices, provide technical guidance, and facilitate government schemes implementation in rural areas of Uttar Pradesh.',
    skills: ['Agricultural Science', 'Field Extension', 'Communication', 'Govt Schemes'],
    applicationsCount: 89, views: 540, saved: false, applied: false, featured: true,
    deadline: 'March 20, 2026',
  },
  {
    _id: 'j3', title: 'Crop Consultant – Horticulture', company: 'AgriTech Solutions Pvt Ltd', companyLogo: '🍎',
    location: 'Remote / Nashik, Maharashtra', type: 'Contract', category: 'Consulting',
    salary: '₹800–₹1,200/hour', experience: '7+ years', posted: '1 week ago',
    description: 'Provide expert consultation to mango and grape farmers. Conduct soil health analysis, recommend fertilizer plans, and guide yield improvement strategies.',
    skills: ['Horticulture', 'Soil Science', 'Fruit Crops', 'Remote Consulting'],
    applicationsCount: 12, views: 98, saved: true, applied: false, featured: false,
    deadline: 'Ongoing',
  },
  {
    _id: 'j4', title: 'Irrigation Technician', company: 'WaterSmart Agri', companyLogo: '💧',
    location: 'Rajkot, Gujarat', type: 'Full-time', category: 'Technical',
    salary: '₹22,000–₹28,000/month', experience: '2+ years', posted: '3 days ago',
    description: 'Install, maintain, and troubleshoot drip and sprinkler irrigation systems for large-scale farms. Train farmers on efficient water usage.',
    skills: ['Drip Irrigation', 'Equipment Maintenance', 'Water Management'],
    applicationsCount: 21, views: 145, saved: false, applied: true, featured: false,
    deadline: 'February 28, 2026',
  },
  {
    _id: 'j5', title: 'Dairy Farm Supervisor', company: 'Amul Cooperative', companyLogo: '🐄',
    location: 'Anand, Gujarat', type: 'Full-time', category: 'Livestock',
    salary: '₹30,000–₹40,000/month', experience: '4+ years', posted: '1 day ago',
    description: 'Manage daily operations of a 300-cow dairy farm including feeding schedules, health monitoring, milk production tracking, and staff supervision.',
    skills: ['Dairy Management', 'Animal Health', 'Production Records', 'Team Leadership'],
    applicationsCount: 18, views: 89, saved: false, applied: false, featured: true,
    deadline: 'March 10, 2026',
  },
  {
    _id: 'j6', title: 'AgriTech Field Sales Executive', company: 'Kisan Bazaar App', companyLogo: '📱',
    location: 'Multiple Locations, India', type: 'Full-time', category: 'Sales',
    salary: '₹25,000 + Commission', experience: '1+ year', posted: '4 days ago',
    description: 'Drive adoption of our digital farming platform among smallholder farmers. Conduct demos, onboard new users, and build relationships with farmer cooperatives.',
    skills: ['Sales', 'Digital Literacy', 'Communication', 'AgriTech'],
    applicationsCount: 55, views: 312, saved: false, applied: false, featured: false,
    deadline: 'March 30, 2026',
  },
];

const DEMO_APPLICATIONS = [
  { _id: 'a1', job: { title: 'Irrigation Technician', company: 'WaterSmart Agri', location: 'Rajkot, Gujarat' }, status: 'Under Review', appliedAt: '3 days ago', logo: '💧' },
  { _id: 'a2', job: { title: 'Farm Consultant (Wheat)', company: 'Punjab AgriBoard', location: 'Amritsar, Punjab' }, status: 'Shortlisted', appliedAt: '1 week ago', logo: '🌾' },
  { _id: 'a3', job: { title: 'Field Extension Trainer', company: 'NABARD', location: 'Patna, Bihar' }, status: 'Rejected', appliedAt: '2 weeks ago', logo: '🏛️' },
];

const CATEGORIES = ['All', 'Management', 'Advisory', 'Consulting', 'Technical', 'Livestock', 'Sales'];
const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Government', 'Internship'];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const SkeletonJobCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse shadow-sm">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-2/3" />
      </div>
    </div>
    <div className="flex gap-2 mt-3">
      <div className="h-7 bg-gray-100 dark:bg-gray-600 rounded-full w-20" />
      <div className="h-7 bg-gray-100 dark:bg-gray-600 rounded-full w-24" />
    </div>
    <div className="flex gap-2 mt-3">
      <div className="h-9 bg-gray-100 dark:bg-gray-600 rounded-xl flex-1" />
      <div className="h-9 bg-gray-100 dark:bg-gray-600 rounded-xl w-12" />
    </div>
  </div>
);

const statusColors = {
  'Under Review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Shortlisted': 'bg-green-50 text-green-700 border-green-200',
  'Rejected': 'bg-red-50 text-red-700 border-red-200',
  'Hired': 'bg-blue-50 text-blue-700 border-blue-200',
};

const typeColors = {
  'Full-time': 'bg-blue-50 text-blue-700',
  'Part-time': 'bg-orange-50 text-orange-700',
  'Contract': 'bg-purple-50 text-purple-700',
  'Government': 'bg-green-50 text-green-700',
  'Internship': 'bg-pink-50 text-pink-700',
};

// Apply Modal
const ApplyModal = ({ job, onClose, onApplied }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleApply = async () => {
    if (!coverLetter.trim()) return;
    setLoading(true);
    try {
      await jobsApi.applyForJob(job._id, { coverLetter });
      setDone(true);
      setTimeout(() => { onApplied(job._id); onClose(); }, 1500);
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Apply for Position</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{job.title} at {job.company}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 transition"><X size={18} /></button>
        </div>
        {done ? (
          <div className="p-10 text-center">
            <CheckCircle size={52} className="text-green-500 mx-auto mb-3" />
            <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">Application Submitted!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">We've sent your application to {job.company}</p>
          </div>
        ) : (
          <>
            <div className="p-5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block mb-2">Cover Letter <span className="text-red-400">*</span></label>
              <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell them why you're a great fit for this role..."
                className="w-full h-36 p-4 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 resize-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{coverLetter.length}/500 characters</p>
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">📎 Your profile details will be shared with this employer. You can also attach your resume from your profile settings.</p>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancel</button>
              <button onClick={handleApply} disabled={!coverLetter.trim() || loading}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition flex items-center justify-center gap-2">
                {loading ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Job Card
const JobCard = ({ job, onSelect, onApply, isSelected }) => {
  const [saved, setSaved] = useState(job.saved);
  const [saving, setSaving] = useState(false);

  const toggleSave = async (e) => {
    e.stopPropagation();
    setSaving(true);
    try {
      if (saved) await jobsApi.unsaveJob(job._id);
      else await jobsApi.saveJob(job._id);
      setSaved(!saved);
    } catch { } finally { setSaving(false); }
  };

  return (
    <div onClick={() => onSelect(job)}
      className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${isSelected ? 'border-green-400 dark:border-green-500 ring-2 ring-green-100 dark:ring-green-900/50' : 'border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-600'}`}>
      {job.featured && (
        <div className="px-4 pt-3 pb-0">
          <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-800">⭐ Featured</span>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border border-green-100 dark:border-green-800">
            {job.companyLogo}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight line-clamp-2">{job.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{job.company}</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={10} className="text-gray-400 dark:text-gray-500" />
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{job.location}</span>
            </div>
          </div>
          <button onClick={toggleSave} disabled={saving}
            className={`p-1.5 rounded-xl transition flex-shrink-0 ${saved ? 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            {saving ? <Loader size={14} className="animate-spin" /> : saved ? <Bookmark size={14} fill="currentColor" /> : <BookmarkPlus size={14} />}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${typeColors[job.type] || 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>{job.type}</span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">{job.category}</span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">{job.experience}</span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{job.salary}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
              <Users size={9} /> {job.applicationsCount} applied
              <span className="mx-1">·</span>
              <Clock size={9} /> {job.posted}
            </p>
          </div>
          {job.applied && (
            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg flex items-center gap-1 border border-green-100 dark:border-green-800">
              <CheckCircle size={11} /> Applied
            </span>
          )}
        </div>

        {!job.applied && (
          <button onClick={(e) => { e.stopPropagation(); onApply(job); }}
            className="mt-3 w-full py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition flex items-center justify-center gap-1.5 shadow-sm">
            <Send size={12} /> Apply Now
          </button>
        )}
      </div>
    </div>
  );
};

// Job Detail Panel
const JobDetailPanel = ({ job, onApply, onClose }) => {
  if (!job) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm h-64 flex flex-col items-center justify-center">
      <Briefcase size={40} className="text-gray-200 dark:text-gray-500 mb-3" />
      <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">Select a job to see details</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-3xl border border-green-100 dark:border-green-800">
            {job.companyLogo}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg leading-tight">{job.title}</h2>
              {job.featured && <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-800 flex-shrink-0">⭐ Featured</span>}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold mt-0.5">{job.company}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><MapPin size={11} className="text-green-600" />{job.location}</span>
              <span className="flex items-center gap-1"><Clock size={11} className="text-green-600" />{job.posted}</span>
              <span className="flex items-center gap-1"><Eye size={11} className="text-green-600" />{job.views} views</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { label: 'Salary', value: job.salary, icon: <DollarSign size={13} className="text-green-600 dark:text-green-400" /> },
            { label: 'Type', value: job.type, icon: <Briefcase size={13} className="text-green-600 dark:text-green-400" /> },
            { label: 'Experience', value: job.experience, icon: <Star size={13} className="text-green-600 dark:text-green-400" /> },
            { label: 'Deadline', value: job.deadline, icon: <Clock size={13} className="text-green-600 dark:text-green-400" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
              <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">{label}</span></div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-2">About the Role</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{job.description}</p>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {job.skills.map(skill => (
              <span key={skill} className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full border border-green-100 dark:border-green-800 flex items-center gap-1">
                <Tag size={9} />{skill}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{job.company}</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">{job.applicationsCount} applications received</p>
        </div>
      </div>

      <div className="p-5 border-t border-gray-100 dark:border-gray-700">
        {job.applied ? (
          <div className="w-full py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            <CheckCircle size={16} /> Already Applied
          </div>
        ) : (
          <button onClick={() => onApply(job)}
            className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
            <Send size={15} /> Apply for this Position <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN OPPORTUNITIES PAGE
// ============================================================================
const OpportunitiesPage = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyingJob, setApplyingJob] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, appRes] = await Promise.all([
        jobsApi.fetchOpportunities(),
        jobsApi.fetchMyApplications(),
      ]);
      setJobs(jobsRes.jobs);
      setApplications(appRes.applications);
      if (jobsRes.jobs.length > 0) setSelectedJob(jobsRes.jobs[0]);
    } catch {
      setError('Failed to load opportunities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredJobs = jobs.filter(j => {
    if (selectedCategory !== 'All' && j.category !== selectedCategory) return false;
    if (selectedType !== 'All' && j.type !== selectedType) return false;
    if (searchQuery && !j.title.toLowerCase().includes(searchQuery.toLowerCase()) && !j.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleApplied = (jobId) => {
    setJobs(prev => prev.map(j => j._id === jobId ? { ...j, applied: true } : j));
    if (selectedJob?._id === jobId) setSelectedJob(prev => ({ ...prev, applied: true }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Apply Modal */}
      {applyingJob && (
        <ApplyModal job={applyingJob} onClose={() => setApplyingJob(null)} onApplied={handleApplied} />
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-20 shadow-sm transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Briefcase size={22} className="text-green-600 dark:text-green-400" /> Opportunities
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Agri jobs, consultancies & government roles</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg font-bold border border-green-100 dark:border-green-800">{filteredJobs.length} Jobs</span>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition ${showFilters ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <Filter size={14} /> Filters
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs by title, company, or skill..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 focus:bg-white dark:focus:bg-gray-600 transition placeholder-gray-500 dark:placeholder-gray-400" />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Job Type</label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
                  className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600">
                  {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={() => { setSelectedCategory('All'); setSelectedType('All'); setSearchQuery(''); }}
                className="self-end text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 py-1.5">
                <X size={12} /> Clear
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {[
              { id: 'browse', label: 'Browse Jobs' },
              { id: 'applications', label: `My Applications (${applications.length})` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${activeTab === tab.id ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/50 p-8 text-center shadow-sm mb-6">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <p className="text-gray-700 dark:text-gray-200 font-semibold">{error}</p>
            <button onClick={loadData} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2 mx-auto">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Jobs List */}
            <div className="lg:col-span-2 space-y-3">
              {loading ? (
                [1,2,3,4].map(i => <SkeletonJobCard key={i} />)
              ) : filteredJobs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center shadow-sm">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">No jobs found</p>
                  <p className="text-gray-400 dark:text-gray-400 text-sm mt-1">Try different search terms or filters</p>
                </div>
              ) : (
                filteredJobs.map(job => (
                  <JobCard key={job._id} job={job} onSelect={setSelectedJob}
                    onApply={setApplyingJob} isSelected={selectedJob?._id === job._id} />
                ))
              )}
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-3 sticky top-40">
              <JobDetailPanel job={selectedJob} onApply={setApplyingJob} />
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            {loading ? (
              [1,2,3].map(i => <SkeletonJobCard key={i} />)
            ) : applications.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">📋</div>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">No applications yet</p>
                <p className="text-gray-400 dark:text-gray-400 text-sm mt-2">Start applying for opportunities!</p>
                <button onClick={() => setActiveTab('browse')} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition">
                  Browse Jobs
                </button>
              </div>
            ) : (
              applications.map(app => (
                <div key={app._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-2xl border border-green-100 dark:border-green-800 flex-shrink-0">{app.logo}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{app.job.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{app.job.company}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-gray-400 dark:text-gray-500" />
                        <span className="text-xs text-gray-400 dark:text-gray-500">{app.job.location}</span>
                        <span className="mx-1 text-gray-300 dark:text-gray-500 text-xs">·</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">Applied {app.appliedAt}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex-shrink-0 ${statusColors[app.status] || 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunitiesPage;

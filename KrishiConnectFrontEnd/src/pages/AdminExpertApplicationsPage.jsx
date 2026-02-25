import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award, Loader, CheckCircle, XCircle, ChevronLeft, ChevronRight, ExternalLink, FileText,
} from 'lucide-react';
import { authStore } from '../store/authStore';
import { adminService } from '../services/admin.service';
import { expertApplicationService } from '../services/expertApplication.service';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE = 10;

function getExperienceBadge(years) {
  const y = Number(years) || 0;
  if (y <= 3) return { label: 'Junior (1-3 yrs)', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
  if (y <= 8) return { label: 'Mid-level (4-8 yrs)', class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' };
  if (y <= 15) return { label: 'Senior (9-15 yrs)', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
  return { label: 'Expert (16+ yrs)', class: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' };
}

function getCertificateValidity(cert) {
  if (!cert) return null;
  if (cert.isLifelong) return { label: 'Lifelong', valid: true };
  if (!cert.expiryDate) return { label: 'Unknown', valid: false };
  const valid = new Date(cert.expiryDate) >= new Date();
  return { label: valid ? 'Valid' : 'Expired', valid };
}

export default function AdminExpertApplicationsPage() {
  const navigate = useNavigate();
  const user = authStore.getState().user;
  const isAdmin = user?.role === 'admin';

  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, adminNote: '' });
  const [confirmAction, setConfirmAction] = useState({ open: false, type: null, id: null });

  const fetchList = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getExpertApplications({
        page,
        limit: PAGE_SIZE,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setApplications(Array.isArray(res.data) ? res.data : []);
      const p = res.pagination || {};
      setPagination({
        page: p.page ?? page,
        totalPages: p.totalPages ?? 1,
        totalItems: p.totalItems ?? 0,
      });
    } catch (err) {
      if (err?.response?.status === 403) {
        navigate('/settings', { replace: true });
        return;
      }
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!isAdmin) {
      navigate('/settings', { replace: true });
      return;
    }
    fetchList(pagination.page);
  }, [user, isAdmin, statusFilter, pagination.page]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Loading details for:', id);
      }
      const d = await adminService.getExpertApplicationById(id);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const handleApprove = (id) => {
    setConfirmAction({ open: true, type: 'approve', id });
  };

  const handleRejectClick = (id) => {
    setRejectModal({ open: true, id, adminNote: '' });
  };

  const doApprove = async () => {
    const { id } = confirmAction;
    if (!id) return;
    if (!adminService?.approveApplication) {
      console.error('Admin service undefined');
      return;
    }
    setActionLoading('approve');
    try {
      await adminService.approveApplication(id);
      closeDetail();
      setConfirmAction({ open: false, type: null, id: null });
      fetchList(pagination.page);
      toast.success('Application approved');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to approve';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const doReject = async () => {
    const { id, adminNote } = rejectModal;
    if (!id || !adminNote.trim()) return;
    if (!adminService?.rejectApplication) {
      console.error('Admin service undefined');
      return;
    }
    setActionLoading('reject');
    try {
      await adminService.rejectApplication(id, adminNote.trim());
      closeDetail();
      setRejectModal({ open: false, id: null, adminNote: '' });
      fetchList(pagination.page);
      toast.success('Application rejected');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reject';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Award className="text-green-600 dark:text-green-400" size={28} />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Expert Applications</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review and approve or reject farmer applications</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pagination.totalItems}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Pending</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{statusFilter === 'pending' ? applications.length : stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 p-4">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Approved</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{statusFilter === 'approved' ? applications.length : stats.approved}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-4">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Rejected</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{statusFilter === 'rejected' ? applications.length : stats.rejected}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id || 'all'}
              onClick={() => { setStatusFilter(tab.id); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader size={32} className="animate-spin text-green-500" />
            </div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">No applications found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Applicant</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Expertise</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Experience</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Applied</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr
                      key={app._id}
                      onClick={() => openDetail(app._id)}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{app.fullName || app.userId?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{app.email || app.userId?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{app.expertiseArea}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{app.yearsOfExperience} yrs</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold ${
                            app.status === 'approved'
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                              : app.status === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeDetail}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Application Details</h2>
              <button onClick={closeDetail} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                <XCircle size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {detailLoading ? (
                <div className="flex justify-center py-8"><Loader size={28} className="animate-spin text-green-500" /></div>
              ) : detail ? (
                <>
                  <div><strong>Name:</strong> {detail.fullName}</div>
                  <div><strong>Email:</strong> {detail.email}</div>
                  <div><strong>Phone:</strong> {detail.phoneNumber}</div>
                  <div><strong>Expertise:</strong> {detail.expertiseArea}</div>
                  <div><strong>Years of experience:</strong> {detail.yearsOfExperience} years {detail.yearsOfExperience != null && <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${getExperienceBadge(detail.yearsOfExperience).class}`}>{getExperienceBadge(detail.yearsOfExperience).label}</span>}</div>
                  {detail.specializedDomain && <div><strong>Specialized domain:</strong> {detail.specializedDomain}</div>}
                  <div><strong>Qualifications:</strong> {detail.qualifications || '—'}</div>
                  <div><strong>Organization:</strong> {detail.currentOrganization || '—'}</div>
                  <div><strong>Gov. ID:</strong> {detail.governmentIdType} — {detail.governmentIdNumber}</div>
                  {detail.governmentApprovedCertificate && (
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-1 border border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Government Approved Certificate</p>
                      <p><strong>Certificate name:</strong> {detail.governmentApprovedCertificate.certificateName}</p>
                      <p><strong>Issuing authority:</strong> {detail.governmentApprovedCertificate.issuingAuthority}</p>
                      <p><strong>Certificate number:</strong> {detail.governmentApprovedCertificate.certificateNumber}</p>
                      <p><strong>Issue date:</strong> {detail.governmentApprovedCertificate.issueDate ? new Date(detail.governmentApprovedCertificate.issueDate).toLocaleDateString() : '—'}</p>
                      <p><strong>Expiry:</strong> {detail.governmentApprovedCertificate.isLifelong ? 'Lifelong' : (detail.governmentApprovedCertificate.expiryDate ? new Date(detail.governmentApprovedCertificate.expiryDate).toLocaleDateString() : '—')}</p>
                      {(() => {
                        const v = getCertificateValidity(detail.governmentApprovedCertificate);
                        return v ? <p><span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${v.valid ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>{v.label}</span></p> : null;
                      })()}
                      {detail.governmentApprovedCertificate.certificateFileUrl && (
                        <a href={detail.governmentApprovedCertificate.certificateFileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:underline">
                          <FileText size={14} /> View certificate <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}
                  {detail.linkedInProfile && (
                    <a href={detail.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400">
                      LinkedIn
                    </a>
                  )}
                  <div><strong>Short bio:</strong><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{detail.shortBio}</p></div>
                  {detail.adminNote && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                      <strong>Rejection reason:</strong> {detail.adminNote}
                    </div>
                  )}
                  {detail.status === 'pending' && (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleApprove(detail._id)}
                        className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectClick(detail._id)}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} /> Reject
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Failed to load details</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Approve */}
      {confirmAction.open && confirmAction.type === 'approve' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Approve this application? The user will become an expert.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction({ open: false, type: null, id: null })}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={doApprove}
                disabled={actionLoading === 'approve'}
                className="flex-1 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === 'approve' ? <Loader size={16} className="animate-spin" /> : null} Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Rejection reason (required)</p>
            <textarea
              value={rejectModal.adminNote}
              onChange={(e) => setRejectModal((m) => ({ ...m, adminNote: e.target.value }))}
              placeholder="Explain why the application is rejected..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRejectModal({ open: false, id: null, adminNote: '' })}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={doReject}
                disabled={!rejectModal.adminNote.trim() || actionLoading === 'reject'}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === 'reject' ? <Loader size={16} className="animate-spin" /> : null} Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

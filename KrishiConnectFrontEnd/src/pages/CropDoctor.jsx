import React, { useState, useRef, useEffect } from 'react';
import { Leaf, Upload, Camera, Loader, AlertCircle, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { ExpertCard, ExpertChatModal } from '../components/experts';
import { expertService } from '../services/expert.service';

const CROP_DOCTOR_API = 'http://localhost:8000/predict';

// ============================================================================
// CROP DOCTOR PAGE – Same layout as AlertsPage, NetworkPage (AppLayout wrapper)
// ============================================================================
const CropDoctor = () => {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const captureInputRef = useRef(null);

  const [experts, setExperts] = useState([]);
  const [selectedExpert, setSelectedExpert] = useState(null);

  useEffect(() => {
    const loadExperts = async () => {
      try {
        const data = await expertService.getExperts();
        setExperts(Array.isArray(data) ? data : []);
      } catch {
        setExperts([]);
      }
    };
    loadExperts();
  }, []);

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.).');
      return;
    }
    clearImage();
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCaptureClick = () => {
    captureInputRef.current?.click();
  };

  const handlePredict = async () => {
    if (!imageFile) {
      setError('Please upload or capture an image first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const { data } = await axios.post(CROP_DOCTOR_API, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      setResult(normalizeResponse(data));
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        err.message ||
        'Prediction failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const normalizeResponse = (data) => {
    if (!data || typeof data !== 'object') return { disease_name: 'Unknown', confidence: 0, status: 'unknown', recommendation: '' };
    return {
      disease_name: data.disease_name ?? data.disease ?? data.class ?? 'Unknown',
      confidence: typeof data.confidence === 'number' ? data.confidence : parseFloat(data.confidence) || 0,
      status: data.status ?? (data.healthy ? 'healthy' : 'affected') ?? 'unknown',
      recommendation: data.recommendation ?? data.advice ?? data.message ?? '',
    };
  };

  const isHealthy = result?.status?.toLowerCase() === 'healthy';
  const isAffected = result?.status?.toLowerCase() === 'affected' || (result?.disease_name && result.disease_name !== 'Healthy');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header – same pattern as AlertsPage */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-20 shadow-sm transition-colors duration-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2.5">
            <Leaf size={22} className="text-green-600 dark:text-green-400" />
            <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">Crop Doctor</h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">AI Crop Disease Detection</p>
        </div>
      </div>

      {/* Content – same max-width and padding as other pages */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Main card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-200">
          <div className="p-5 sm:p-6 space-y-5">
            {/* Upload & Capture */}
            <div className="flex flex-wrap gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={captureInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                <Upload size={18} /> Upload Image
              </button>
              <button
                type="button"
                onClick={handleCaptureClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                <Camera size={18} /> Capture Photo
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Image preview */}
            {previewUrl && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-700/50">
                <img
                  src={previewUrl}
                  alt="Crop preview"
                  className="w-full max-h-64 object-contain"
                />
              </div>
            )}

            {/* Predict button */}
            <button
              type="button"
              onClick={handlePredict}
              disabled={!imageFile || loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>Predict</>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <div
                className={`rounded-xl border p-4 transition-colors ${
                  isAffected
                    ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {isHealthy ? (
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                  )}
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {isHealthy ? 'Healthy' : 'Affected'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {result.disease_name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Confidence: {Math.round((result.confidence ?? 0) * 100)}%
                </p>
                {result.recommendation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    {result.recommendation}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ask an Expert – below upload/diagnosis card */}
        {experts.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Ask an Expert</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {experts.map((expert) => (
                <div key={expert._id} className="flex-shrink-0 w-[140px]">
                  <ExpertCard
                    expert={expert}
                    onAsk={setSelectedExpert}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ExpertChatModal
        expert={selectedExpert}
        open={!!selectedExpert}
        onClose={() => setSelectedExpert(null)}
      />
    </div>
  );
};

export default CropDoctor;

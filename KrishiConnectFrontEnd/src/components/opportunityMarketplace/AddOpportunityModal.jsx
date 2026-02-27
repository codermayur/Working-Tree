import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Sparkles,
  ImagePlus,
  Loader,
  MapPin,
  IndianRupee,
  Calendar,
  Phone,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import OpportunityCard from './OpportunityCard';
import OpportunityTypeIcon from './OpportunityTypeIcon';
import { cn, getTypeLabel } from './opportunityUtils';
import { opportunityService, mapOpportunityToCard } from '../../services/opportunity.service';
import { reverseGeocode } from '../../services/location.service';

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function FieldLabel({ children, required }) {
  return (
    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
      {children}
      {required ? <span className="text-red-500 ml-0.5">*</span> : null}
    </label>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition',
        value
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
      )}
    >
      <span
        className={cn(
          'w-9 h-5 rounded-full p-0.5 transition flex items-center',
          value ? 'bg-emerald-600 justify-end' : 'bg-gray-300 justify-start'
        )}
      >
        <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
      </span>
      {label}
    </button>
  );
}

function RequirementsPreview({ lines }) {
  const items = (lines || []).map((l) => l.trim()).filter(Boolean);
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
        Requirements Preview
      </p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
        As you type, farmers will see them like this.
      </p>
      {items.length === 0 ? (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
          Example: “Must have experience in sugarcane harvesting”
        </p>
      ) : (
        <ul className="mt-3 space-y-2 text-xs text-gray-700 dark:text-gray-300">
          {items.map((r) => (
            <li key={r} className="flex items-start gap-2">
              <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ImagePicker({ files, onPick, onRemove, uploading, onDropFiles }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-emerald-200/70 dark:border-emerald-800 bg-emerald-50/40 dark:bg-gray-900/40 shadow-sm p-4 transition hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer"
        onClick={onPick}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const dtFiles = Array.from(e.dataTransfer.files || []);
          if (dtFiles.length && onDropFiles) {
            onDropFiles(dtFiles);
          }
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
            {uploading ? (
              <Loader className="w-4 h-4 animate-spin text-emerald-700 dark:text-emerald-300" />
            ) : (
              <ImagePlus className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
              Upload photos
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Drag & drop or click to browse. Up to {MAX_IMAGES} images (max 5MB each).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onPick}
          disabled={uploading || files.length >= MAX_IMAGES}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-950 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 disabled:opacity-60"
        >
          {uploading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          {files.length ? 'Add more' : 'Select images'}
        </button>
      </div>
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {files.map((f) => (
            <div key={f.id} className="relative group rounded-xl overflow-hidden border border-emerald-100 dark:border-emerald-800 bg-black/5">
              <img
                src={f.previewUrl}
                alt="preview"
                className="w-full h-24 object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AddOpportunityModal({ open, onClose, onCreated }) {
  const [tab, setTab] = useState('job'); // job | equipment | cattle
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]); // [{ id, file, previewUrl }]

  const [autoLocation, setAutoLocation] = useState(null); // { lat, lng, address }
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [job, setJob] = useState({
    title: '',
    description: '',
    workType: 'harvesting',
    workersRequired: 1,
    location: '',
    startDate: '',
    durationDays: 1,
    paymentType: 'per_day',
    amount: '',
    foodIncluded: false,
    stayIncluded: false,
    contactCall: true,
    contactWhatsapp: true,
    contactChat: true,
    urgent: false,
    requirementsText: '',
  });

  const [equipment, setEquipment] = useState({
    title: '',
    description: '',
    equipmentName: '',
    brandModel: '',
    condition: 'good',
    rentalUnit: 'per_day',
    amount: '',
    securityDeposit: '',
    availabilityFrom: '',
    availabilityTo: '',
    location: '',
    deliveryAvailable: false,
    fuelIncluded: false,
    urgent: false,
  });

  const [cattle, setCattle] = useState({
    title: '',
    description: '',
    animalType: 'cow',
    purpose: 'ploughing',
    pricePerDay: '',
    healthCondition: '',
    vaccinated: true,
    ageYears: '',
    availabilityFrom: '',
    availabilityTo: '',
    location: '',
    urgent: false,
  });

  const current = tab === 'job' ? job : tab === 'equipment' ? equipment : cattle;
  const setCurrent = tab === 'job' ? setJob : tab === 'equipment' ? setEquipment : setCattle;

  const requirementsLines =
    tab === 'job' ? (job.requirementsText || '').split('\n') : [];

  const previewCard = useMemo(() => {
    const base = {
      type: tab,
      title:
        current.title ||
        (tab === 'job'
          ? 'Job: Your title'
          : tab === 'equipment'
          ? 'Rental: Your equipment'
          : 'Rental: Your cattle'),
      description:
        current.description ||
        (tab === 'job'
          ? 'Describe work and payment clearly.'
          : tab === 'equipment'
          ? 'Describe equipment and conditions.'
          : 'Describe cattle and health details.'),
      urgent: !!current.urgent,
      location: { text: current.location || 'Village / District' },
      images: images.length ? [{ url: images[0].previewUrl }] : [],
      farmer: { name: 'You' },
      ratingAverage: 0,
      ratingCount: 0,
      applicantsCount: 0,
    };

    if (tab === 'job') {
      return mapOpportunityToCard({
        ...base,
        paymentType: job.paymentType,
        amount: job.amount ? Number(job.amount) : undefined,
        workType: job.workType,
        workersRequired: job.workersRequired ? Number(job.workersRequired) : undefined,
        startDate: job.startDate || undefined,
        durationDays: job.durationDays ? Number(job.durationDays) : undefined,
        foodIncluded: !!job.foodIncluded,
        stayIncluded: !!job.stayIncluded,
        requirements: requirementsLines.map((l) => l.trim()).filter(Boolean),
      });
    }
    if (tab === 'equipment') {
      return mapOpportunityToCard({
        ...base,
        rentalUnit: equipment.rentalUnit,
        amount: equipment.amount ? Number(equipment.amount) : undefined,
        equipmentName: equipment.equipmentName,
        equipmentBrandModel: equipment.brandModel,
        equipmentCondition: equipment.condition,
        securityDeposit: equipment.securityDeposit ? Number(equipment.securityDeposit) : undefined,
        availabilityFrom: equipment.availabilityFrom || undefined,
        availabilityTo: equipment.availabilityTo || undefined,
        deliveryAvailable: !!equipment.deliveryAvailable,
        fuelIncluded: !!equipment.fuelIncluded,
      });
    }
    return mapOpportunityToCard({
      ...base,
      pricePerDay: cattle.pricePerDay ? Number(cattle.pricePerDay) : undefined,
      animalType: cattle.animalType,
      purpose: cattle.purpose,
      healthCondition: cattle.healthCondition,
      vaccinated: !!cattle.vaccinated,
      ageYears: cattle.ageYears ? Number(cattle.ageYears) : undefined,
      availabilityFrom: cattle.availabilityFrom || undefined,
      availabilityTo: cattle.availabilityTo || undefined,
    });
  }, [tab, current, job, equipment, cattle, images, requirementsLines]);

  const close = () => {
    // cleanup blob URLs
    setImages((prev) => {
      prev.forEach((p) => {
        if (p?.previewUrl?.startsWith?.('blob:')) {
          try {
            URL.revokeObjectURL(p.previewUrl);
          } catch (_) {}
        }
      });
      return [];
    });
    setDone(false);
    setAutoLocation(null);
    setDetectingLocation(false);
    onClose?.();
  };

  useEffect(() => {
    if (!open) return;
    if (!navigator.geolocation) {
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const result = await reverseGeocode(lat, lng);
          const address = result?.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setAutoLocation({ lat, lng, address });
          setCurrent((p) => ({
            ...p,
            location: p.location || address,
          }));
        } catch (err) {
          // Silent failure, user can still type manually
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn('Reverse geocoding failed', err);
          }
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [open, setCurrent]);

  const pickFiles = () => fileInputRef.current?.click?.();

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (images.length >= MAX_IMAGES) {
      toast.error(`You can upload up to ${MAX_IMAGES} images.`);
      return;
    }
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);

    for (const f of toAdd) {
      if (!f.type.startsWith('image/')) {
        toast.error('Only images are allowed (JPG, PNG, WebP).');
        return;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        toast.error('Image too large. Max size is 5MB.');
        return;
      }
    }

    const newItems = [];
    for (const f of toAdd) {
      const previewUrl = URL.createObjectURL(f);
      const id = `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      newItems.push({ id, file: f, previewUrl });
    }
    setImages((prev) => [...prev, ...newItems]);
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.previewUrl?.startsWith?.('blob:')) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch (_) {}
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const validate = () => {
    if (!current.title?.trim()) return 'Title is required';
    if (!current.location?.trim()) return 'Location is required';
    if (tab === 'job') {
      if (!job.amount || Number(job.amount) <= 0) return 'Amount must be positive';
      if (!job.workersRequired || Number(job.workersRequired) <= 0) return 'Workers required must be positive';
      if (!job.startDate) return 'Start date is required';
    }
    if (tab === 'equipment') {
      if (!equipment.equipmentName?.trim()) return 'Equipment name is required';
      if (!equipment.amount || Number(equipment.amount) <= 0) return 'Rental price must be positive';
      if (equipment.securityDeposit && Number(equipment.securityDeposit) < 0) return 'Deposit must be positive';
      if (equipment.availabilityFrom && equipment.availabilityTo) {
        if (new Date(equipment.availabilityTo).getTime() < new Date(equipment.availabilityFrom).getTime()) {
          return 'Availability end must be after start';
        }
      }
    }
    if (tab === 'cattle') {
      if (!cattle.pricePerDay || Number(cattle.pricePerDay) <= 0) return 'Price per day must be positive';
      if (cattle.availabilityFrom && cattle.availabilityTo) {
        if (new Date(cattle.availabilityTo).getTime() < new Date(cattle.availabilityFrom).getTime()) {
          return 'Availability end must be after start';
        }
      }
    }
    return null;
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!images.length) {
      toast.error('Please add at least one photo.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('type', tab);
      formData.append('title', current.title.trim());
      formData.append('description', current.description?.trim() || '');
      formData.append('locationText', current.location.trim());
      if (autoLocation) {
        formData.append('lat', String(autoLocation.lat));
        formData.append('lng', String(autoLocation.lng));
      }
      formData.append('urgent', String(!!current.urgent));

      if (tab === 'job') {
        formData.append('paymentType', job.paymentType);
        formData.append('amount', String(job.amount));
        formData.append('workType', job.workType);
        formData.append('workersRequired', String(job.workersRequired));
        formData.append('startDate', job.startDate);
        if (job.durationDays) formData.append('durationDays', String(job.durationDays));
        formData.append('foodIncluded', String(!!job.foodIncluded));
        formData.append('stayIncluded', String(!!job.stayIncluded));
        const contactMethods = [
          job.contactCall && 'call',
          job.contactWhatsapp && 'whatsapp',
          job.contactChat && 'chat',
        ].filter(Boolean);
        contactMethods.forEach((m) => formData.append('contactMethods', m));
        requirementsLines
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((r) => formData.append('requirements', r));
      } else if (tab === 'equipment') {
        formData.append('equipmentName', equipment.equipmentName.trim());
        if (equipment.brandModel?.trim()) {
          formData.append('equipmentBrandModel', equipment.brandModel.trim());
        }
        formData.append('equipmentCondition', equipment.condition);
        formData.append('rentalUnit', equipment.rentalUnit);
        formData.append('amount', String(equipment.amount));
        if (equipment.securityDeposit) {
          formData.append('securityDeposit', String(equipment.securityDeposit));
        }
        if (equipment.availabilityFrom) {
          formData.append('availabilityFrom', equipment.availabilityFrom);
        }
        if (equipment.availabilityTo) {
          formData.append('availabilityTo', equipment.availabilityTo);
        }
        formData.append('deliveryAvailable', String(!!equipment.deliveryAvailable));
        formData.append('fuelIncluded', String(!!equipment.fuelIncluded));
      } else {
        formData.append('animalType', cattle.animalType);
        formData.append('purpose', cattle.purpose);
        formData.append('pricePerDay', String(cattle.pricePerDay));
        if (cattle.healthCondition?.trim()) {
          formData.append('healthCondition', cattle.healthCondition.trim());
        }
        formData.append('vaccinated', String(!!cattle.vaccinated));
        if (cattle.ageYears) {
          formData.append('ageYears', String(cattle.ageYears));
        }
        if (cattle.availabilityFrom) {
          formData.append('availabilityFrom', cattle.availabilityFrom);
        }
        if (cattle.availabilityTo) {
          formData.append('availabilityTo', cattle.availabilityTo);
        }
      }

      images.forEach((img) => {
        if (img.file) {
          formData.append('images', img.file);
        }
      });

      setUploading(true);
      const created = await opportunityService.create(formData, {
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(pct);
        },
      });
      setDone(true);
      toast.success('Published successfully');
      onCreated?.(created);
      setTimeout(() => close(), 900);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to publish';
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-6xl border border-gray-100 dark:border-gray-800 overflow-hidden my-6">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
              <OpportunityTypeIcon type={tab} className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-gray-50">
                + Add Opportunity
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getTypeLabel(tab)} · Live preview included
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-300"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="py-14 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
              Published!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Farmers will see it instantly in the marketplace.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 p-5">
            <div className="lg:col-span-3 space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'job', label: 'Job Opportunity' },
                  { id: 'equipment', label: 'Equipment / Tools Rental' },
                  { id: 'cattle', label: 'Cattle Rental' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'px-3 py-2 rounded-full text-xs font-semibold border transition',
                      tab === t.id
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <FieldLabel required>Title</FieldLabel>
                  <input
                    value={current.title}
                    onChange={(e) => setCurrent((p) => ({ ...p, title: e.target.value }))}
                    placeholder={tab === 'job' ? 'e.g. Harvesting workers needed' : tab === 'equipment' ? 'e.g. Tractor for rent' : 'e.g. Buffalo for dairy rental'}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    value={current.description}
                    onChange={(e) => setCurrent((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Write details farmers should know…"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700 resize-none h-24"
                  />
                </div>

                <div className="sm:col-span-2">
                  <FieldLabel required>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" /> Location
                    </span>
                  </FieldLabel>
                  <div className="flex flex-col gap-1.5">
                    <input
                      value={current.location}
                      onChange={(e) => setCurrent((p) => ({ ...p, location: e.target.value }))}
                      placeholder="Village / Taluka / District"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px]">
                          📍
                        </span>
                        {autoLocation ? (
                          <>
                            <span className="font-medium text-emerald-700 dark:text-emerald-300">
                              Current location detected
                            </span>
                            <span className="hidden sm:inline text-gray-500 dark:text-gray-400 truncate">
                              · {autoLocation.address}
                            </span>
                          </>
                        ) : detectingLocation ? (
                          <span>Detecting your location…</span>
                        ) : (
                          <span>Allow GPS access to auto-fill your village / district.</span>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (!navigator.geolocation || detectingLocation) return;
                          setDetectingLocation(true);
                          navigator.geolocation.getCurrentPosition(
                            async (pos) => {
                              const lat = pos.coords.latitude;
                              const lng = pos.coords.longitude;
                              try {
                                const result = await reverseGeocode(lat, lng);
                                const address =
                                  result?.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                                setAutoLocation({ lat, lng, address });
                                setCurrent((p) => ({
                                  ...p,
                                  location: address,
                                }));
                              } catch {
                                // ignore, manual entry still works
                              } finally {
                                setDetectingLocation(false);
                              }
                            },
                            () => {
                              setDetectingLocation(false);
                            },
                            { enableHighAccuracy: true, timeout: 10000 }
                          );
                        }}
                        className="ml-auto inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[11px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        {autoLocation ? 'Change location' : 'Use current location'}
                      </button>
                    </div>
                  </div>
                </div>

                {tab === 'job' && (
                  <>
                    <div>
                      <FieldLabel required>Work Type</FieldLabel>
                      <select
                        value={job.workType}
                        onChange={(e) => setJob((p) => ({ ...p, workType: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      >
                        <option value="harvesting">Harvesting</option>
                        <option value="planting">Planting</option>
                        <option value="irrigation">Irrigation</option>
                        <option value="labour">Labour</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel required>Workers Required</FieldLabel>
                      <input
                        type="number"
                        min={1}
                        value={job.workersRequired}
                        onChange={(e) => setJob((p) => ({ ...p, workersRequired: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <FieldLabel required>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-emerald-600" /> Start Date
                        </span>
                      </FieldLabel>
                      <input
                        type="date"
                        value={job.startDate}
                        onChange={(e) => setJob((p) => ({ ...p, startDate: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <FieldLabel>Duration (days)</FieldLabel>
                      <input
                        type="number"
                        min={0}
                        value={job.durationDays}
                        onChange={(e) => setJob((p) => ({ ...p, durationDays: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <FieldLabel required>Payment Type</FieldLabel>
                      <select
                        value={job.paymentType}
                        onChange={(e) => setJob((p) => ({ ...p, paymentType: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      >
                        <option value="per_day">Per Day</option>
                        <option value="per_hour">Per Hour</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel required>
                        <span className="inline-flex items-center gap-1.5">
                          <IndianRupee className="w-4 h-4 text-emerald-600" /> Amount (₹)
                        </span>
                      </FieldLabel>
                      <input
                        type="number"
                        min={1}
                        value={job.amount}
                        onChange={(e) => setJob((p) => ({ ...p, amount: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap gap-2">
                      <Toggle label="Food Included" value={job.foodIncluded} onChange={() => setJob((p) => ({ ...p, foodIncluded: !p.foodIncluded }))} />
                      <Toggle label="Stay Included" value={job.stayIncluded} onChange={() => setJob((p) => ({ ...p, stayIncluded: !p.stayIncluded }))} />
                      <Toggle label="Urgent" value={job.urgent} onChange={() => setJob((p) => ({ ...p, urgent: !p.urgent }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>Contact Method</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        <Toggle label={<span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4" /> Call</span>} value={job.contactCall} onChange={() => setJob((p) => ({ ...p, contactCall: !p.contactCall }))} />
                        <Toggle label={<span className="inline-flex items-center gap-1.5"><span className="font-bold">WA</span> WhatsApp</span>} value={job.contactWhatsapp} onChange={() => setJob((p) => ({ ...p, contactWhatsapp: !p.contactWhatsapp }))} />
                        <Toggle label={<span className="inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> Chat</span>} value={job.contactChat} onChange={() => setJob((p) => ({ ...p, contactChat: !p.contactChat }))} />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>Requirements (one per line)</FieldLabel>
                      <textarea
                        value={job.requirementsText}
                        onChange={(e) => setJob((p) => ({ ...p, requirementsText: e.target.value }))}
                        placeholder={"Must have sugarcane harvesting experience\nMust bring own tools"}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700 resize-none h-20"
                      />
                    </div>
                  </>
                )}

                {tab === 'equipment' && (
                  <>
                    <div>
                      <FieldLabel required>Equipment Name</FieldLabel>
                      <input
                        value={equipment.equipmentName}
                        onChange={(e) => setEquipment((p) => ({ ...p, equipmentName: e.target.value }))}
                        placeholder="Tractor, Rotavator, Harvester…"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <FieldLabel>Brand / Model</FieldLabel>
                      <input
                        value={equipment.brandModel}
                        onChange={(e) => setEquipment((p) => ({ ...p, brandModel: e.target.value }))}
                        placeholder="e.g. Mahindra 575 DI"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <FieldLabel>Condition</FieldLabel>
                      <select
                        value={equipment.condition}
                        onChange={(e) => setEquipment((p) => ({ ...p, condition: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      >
                        <option value="new">New</option>
                        <option value="good">Good</option>
                        <option value="average">Average</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel required>Rental Price Unit</FieldLabel>
                      <select
                        value={equipment.rentalUnit}
                        onChange={(e) => setEquipment((p) => ({ ...p, rentalUnit: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      >
                        <option value="per_hour">Per Hour</option>
                        <option value="per_day">Per Day</option>
                        <option value="per_acre">Per Acre</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel required>
                        <span className="inline-flex items-center gap-1.5">
                          <IndianRupee className="w-4 h-4 text-emerald-600" /> Rental Price (₹)
                        </span>
                      </FieldLabel>
                      <input
                        type="number"
                        min={1}
                        value={equipment.amount}
                        onChange={(e) => setEquipment((p) => ({ ...p, amount: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <FieldLabel>Security Deposit (₹)</FieldLabel>
                      <input
                        type="number"
                        min={0}
                        value={equipment.securityDeposit}
                        onChange={(e) => setEquipment((p) => ({ ...p, securityDeposit: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <FieldLabel>Availability From</FieldLabel>
                      <input
                        type="date"
                        value={equipment.availabilityFrom}
                        onChange={(e) => setEquipment((p) => ({ ...p, availabilityFrom: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <FieldLabel>Availability To</FieldLabel>
                      <input
                        type="date"
                        value={equipment.availabilityTo}
                        onChange={(e) => setEquipment((p) => ({ ...p, availabilityTo: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap gap-2">
                      <Toggle label="Delivery Available" value={equipment.deliveryAvailable} onChange={() => setEquipment((p) => ({ ...p, deliveryAvailable: !p.deliveryAvailable }))} />
                      <Toggle label="Fuel Included" value={equipment.fuelIncluded} onChange={() => setEquipment((p) => ({ ...p, fuelIncluded: !p.fuelIncluded }))} />
                      <Toggle label="Urgent" value={equipment.urgent} onChange={() => setEquipment((p) => ({ ...p, urgent: !p.urgent }))} />
                    </div>
                  </>
                )}

                {tab === 'cattle' && (
                  <>
                    <div>
                      <FieldLabel required>Animal Type</FieldLabel>
                      <select
                        value={cattle.animalType}
                        onChange={(e) => setCattle((p) => ({ ...p, animalType: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      >
                        <option value="cow">Cow</option>
                        <option value="buffalo">Buffalo</option>
                        <option value="bull">Bull</option>
                        <option value="ox">Ox</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Purpose</FieldLabel>
                      <select
                        value={cattle.purpose}
                        onChange={(e) => setCattle((p) => ({ ...p, purpose: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      >
                        <option value="ploughing">Ploughing</option>
                        <option value="dairy">Dairy</option>
                        <option value="transport">Transport</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel required>
                        <span className="inline-flex items-center gap-1.5">
                          <IndianRupee className="w-4 h-4 text-emerald-600" /> Price / day (₹)
                        </span>
                      </FieldLabel>
                      <input
                        type="number"
                        min={1}
                        value={cattle.pricePerDay}
                        onChange={(e) => setCattle((p) => ({ ...p, pricePerDay: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <FieldLabel>Age (years)</FieldLabel>
                      <input
                        type="number"
                        min={0}
                        value={cattle.ageYears}
                        onChange={(e) => setCattle((p) => ({ ...p, ageYears: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>Health Condition</FieldLabel>
                      <textarea
                        value={cattle.healthCondition}
                        onChange={(e) => setCattle((p) => ({ ...p, healthCondition: e.target.value }))}
                        placeholder="Health notes (optional)…"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700 resize-none h-20"
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap gap-2">
                      <Toggle label="Vaccinated" value={cattle.vaccinated} onChange={() => setCattle((p) => ({ ...p, vaccinated: !p.vaccinated }))} />
                      <Toggle label="Urgent" value={cattle.urgent} onChange={() => setCattle((p) => ({ ...p, urgent: !p.urgent }))} />
                    </div>
                    <div>
                      <FieldLabel>Availability From</FieldLabel>
                      <input
                        type="date"
                        value={cattle.availabilityFrom}
                        onChange={(e) => setCattle((p) => ({ ...p, availabilityFrom: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <FieldLabel>Availability To</FieldLabel>
                      <input
                        type="date"
                        value={cattle.availabilityTo}
                        onChange={(e) => setCattle((p) => ({ ...p, availabilityTo: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                      />
                    </div>
                  </>
                )}
              </div>

              <ImagePicker
                files={images}
                onPick={pickFiles}
                onRemove={removeImage}
                uploading={uploading}
                onDropFiles={addFiles}
              />

              {tab === 'job' ? <RequirementsPreview lines={requirementsLines} /> : null}

              <div className="flex items-center justify-between pt-2">
                <Toggle
                  label={<span className="inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-red-500" /> Urgent listing</span>}
                  value={!!current.urgent}
                  onChange={() => setCurrent((p) => ({ ...p, urgent: !p.urgent }))}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting || uploading}
                    onClick={submit}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-xs font-semibold text-white shadow-sm"
                  >
                    {submitting ? 'Publishing…' : 'Publish'}
                  </button>
                </div>
              </div>
              {uploading && uploadProgress > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-300">
                    <span>Uploading photos…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-[width] duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50 via-white to-emerald-50/60 dark:from-emerald-900/15 dark:via-gray-950 dark:to-emerald-900/10 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                      Live preview card
                    </p>
                    <p className="text-[11px] text-emerald-600/80 dark:text-emerald-300/80 mt-0.5">
                      This is how farmers will see your listing
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <OpportunityCard item={previewCard} onOpen={() => {}} onPrimaryAction={() => {}} />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Quick tips
                </p>
                <ul className="mt-2 space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
                    Add clear location so nearby farmers can find you fast.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
                    Keep pricing simple (₹ per day / per hour).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
                    Upload real photos for faster responses.
                  </li>
                </ul>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const list = e.target.files;
                e.target.value = '';
                uploadAndAddFiles(list);
              }}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}


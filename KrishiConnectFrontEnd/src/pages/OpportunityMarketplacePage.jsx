import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Search,
  MapPin,
  Filter,
  X,
  Loader,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../context/SocketContext';
import { opportunityService, mapOpportunityToCard } from '../services/opportunity.service';
import OpportunityCard from '../components/opportunityMarketplace/OpportunityCard';
import OpportunityDetailModal from '../components/opportunityMarketplace/OpportunityDetailModal';
import ApplyOpportunityModal from '../components/opportunityMarketplace/ApplyOpportunityModal';
import AddOpportunityModal from '../components/opportunityMarketplace/AddOpportunityModal';
import ApplicantsModal from '../components/opportunityMarketplace/ApplicantsModal';
import { OPPORTUNITY_DUMMY_DATA } from '../components/opportunityMarketplace/opportunityDummyData';
import { cn } from '../components/opportunityMarketplace/opportunityUtils';

export default function OpportunityMarketplacePage() {
  const user = useAuthStore((s) => s.user);
  const { subscribe } = useSocket();

  const [activeTab, setActiveTab] = useState('marketplace'); // marketplace | my
  const [dashboardTab, setDashboardTab] = useState('posted'); // posted | received | booked

  const [searchText, setSearchText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [type, setType] = useState('all');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [sort, setSort] = useState('latest'); // latest | price_low | price_high | nearest
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [coords, setCoords] = useState(null); // { lat, lng }

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [myOpportunities, setMyOpportunities] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [applyItem, setApplyItem] = useState(null);

  const [applicantsFor, setApplicantsFor] = useState(null); // { id, title }

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          sort,
          ...(sort === 'nearest' && coords ? { lat: coords.lat, lng: coords.lng } : {}),
          ...(type !== 'all' ? { type } : {}),
          ...(urgentOnly ? { urgent: true } : {}),
          ...(searchText ? { q: searchText } : {}),
        };
        const { opportunities } = await opportunityService.list(params);
        const list = opportunities?.length ? opportunities : OPPORTUNITY_DUMMY_DATA.map(mapOpportunityToCard);
        setItems(list);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load marketplace');
        setItems(OPPORTUNITY_DUMMY_DATA.map(mapOpportunityToCard));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type, urgentOnly, sort, searchText, coords]);

  useEffect(() => {
    if (!user) return;
    const loadMine = async () => {
      try {
        const [{ opportunities: mine }, { applications }] = await Promise.all([
          opportunityService.getMine(),
          opportunityService.getMyApplications(),
        ]);
        setMyOpportunities(mine || []);
        setMyApplications(applications || []);
      } catch (_) {}
    };
    loadMine();
  }, [user]);

  useEffect(() => {
    const unsubNew = subscribe('opportunity:new', (payload) => {
      const mapped = mapOpportunityToCard(payload);
      setItems((prev) => {
        if (prev.some((p) => p._id === mapped._id)) return prev;
        return [mapped, ...prev];
      });
      if (activeTab === 'marketplace') {
        toast.success('New opportunity posted');
      }
    });
    const unsubApp = subscribe('opportunity:application', () => {
      toast.success('Update: someone applied / status changed');
    });
    return () => {
      unsubNew();
      unsubApp();
    };
  }, [subscribe, activeTab]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (locationText.trim()) {
      const re = new RegExp(locationText.trim(), 'i');
      list = list.filter((i) => re.test(i.location));
    }
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    if (min != null || max != null) {
      list = list.filter((i) => {
        const value = i.type === 'cattle' ? i.raw?.pricePerDay : i.raw?.amount;
        if (value == null) return false;
        if (min != null && Number(value) < min) return false;
        if (max != null && Number(value) > max) return false;
        return true;
      });
    }
    return list;
  }, [items, locationText, minPrice, maxPrice]);

  const itemsWithDistance = useMemo(() => {
    if (!coords) return filtered;
    const { lat, lng } = coords;
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
    return filtered.map((item) => {
      const point = item.raw?.location?.coordinates?.coordinates;
      if (!Array.isArray(point) || point.length !== 2) return item;
      const [lng2, lat2] = point;
      if (typeof lat2 !== 'number' || typeof lng2 !== 'number') return item;
      const dLat = toRad(lat2 - lat);
      const dLng = toRad(lng2 - lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      return { ...item, distanceKm: d };
    });
  }, [filtered, coords]);

  const rentalsBooked = useMemo(() => {
    return (myApplications || []).filter((a) => {
      const opp = a.opportunity;
      if (!opp) return false;
      if (a.status !== 'accepted') return false;
      return opp.type === 'equipment' || opp.type === 'cattle';
    });
  }, [myApplications]);

  const askGPS = () => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Location detected. Sorting by nearest.');
        setSort('nearest');
      },
      () => toast.error('Could not get your location. Please allow GPS.')
    );
  };

  const handleDeleteOpportunity = async (opp) => {
    if (!opp?._id) return;
    const ok = window.confirm(`Delete "${opp.title}"? This will remove photos too.`);
    if (!ok) return;

    const id = opp._id;
    const prevMine = myOpportunities;
    const prevItems = items;

    setDeletingId(id);
    setMyOpportunities((prev) => prev.filter((o) => o._id !== id));
    setItems((prev) => prev.filter((o) => o._id !== id));

    try {
      await opportunityService.delete(id);
      toast.success('Opportunity deleted');
    } catch (err) {
      setMyOpportunities(prevMine);
      setItems(prevItems);
      toast.error(err?.response?.data?.message || err?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-gray-50 to-amber-50 dark:from-gray-950 dark:via-gray-950 dark:to-emerald-950/40">
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-900/30 border border-emerald-400/40 text-[11px] font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              Opportunities & Rentals
            </div>
            <h1 className="text-xl sm:text-2xl font-black">Opportunities & Rentals</h1>
            <p className="mt-1 text-xs sm:text-sm text-emerald-100">
              Find work, hire help, or rent farming equipment — updated live.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-white text-emerald-700 px-4 py-2 text-xs font-semibold shadow-md hover:bg-emerald-50"
            >
              + Add Opportunity
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 space-y-4">
        <div className="flex gap-2 text-xs">
          {[
            { id: 'marketplace', label: 'Marketplace' },
            { id: 'my', label: 'My Opportunities' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'px-3 py-1.5 rounded-full font-semibold border text-xs',
                activeTab === t.id
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'marketplace' && (
          <>
            <div className="bg-white/90 dark:bg-gray-950/80 border border-emerald-100/70 dark:border-emerald-900/60 rounded-2xl shadow-sm p-3 sm:p-4">
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Keyword
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="e.g. harvesting, tractor, buffalo rental…"
                      className="w-full rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      placeholder="Village / district (optional)"
                      className="w-full rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Filters
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="mt-3 flex flex-wrap gap-2 items-center text-[11px]">
                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 rounded-xl px-2 py-1 border border-gray-100 dark:border-gray-800">
                    <span className="font-semibold text-gray-500 dark:text-gray-400">Type:</span>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'job', label: 'Job Work' },
                      { id: 'equipment', label: 'Equipment' },
                      { id: 'cattle', label: 'Cattle' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setType(opt.id)}
                        className={cn(
                          'px-2 py-0.5 rounded-lg font-medium',
                          type === opt.id
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 rounded-xl px-2 py-1 border border-gray-100 dark:border-gray-800">
                    <span className="font-semibold text-gray-500 dark:text-gray-400">Sort:</span>
                    {[
                      { id: 'latest', label: 'Latest' },
                      { id: 'price_low', label: 'Price Low' },
                      { id: 'price_high', label: 'Price High' },
                      { id: 'nearest', label: 'Nearest' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (opt.id === 'nearest' && !coords) askGPS();
                          else setSort(opt.id);
                        }}
                        className={cn(
                          'px-2 py-0.5 rounded-lg font-medium',
                          sort === opt.id
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={askGPS}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                      title="Use GPS for nearest"
                    >
                      <Navigation className="w-3.5 h-3.5" /> GPS
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-xl px-2 py-1 border border-gray-100 dark:border-gray-800">
                    <span className="font-semibold text-gray-500 dark:text-gray-400">Price:</span>
                    <input
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-20 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-2 py-1 text-[11px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                    />
                    <input
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-20 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-2 py-1 text-[11px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setUrgentOnly((v) => !v)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1',
                      urgentOnly
                        ? 'border-red-300 bg-red-50 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'
                        : 'border-gray-200 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300'
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Urgent only
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchText('');
                      setLocationText('');
                      setType('all');
                      setUrgentOnly(false);
                      setSort('latest');
                      setMinPrice('');
                      setMaxPrice('');
                      setCoords(null);
                    }}
                    className="inline-flex items-center gap-1 text-red-500 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-200">Could not refresh live data</p>
                  <p className="text-red-600/80 dark:text-red-300/80">{error}</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-6 sm:py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="rounded-2xl border border-emerald-50 dark:border-gray-800 bg-white/80 dark:bg-gray-950/60 shadow-sm overflow-hidden animate-pulse"
                  >
                    <div className="h-32 sm:h-40 bg-gradient-to-r from-emerald-50 via-emerald-100/60 to-emerald-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 w-3/4 rounded-full bg-gray-100 dark:bg-gray-800" />
                      <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
                      <div className="h-3 w-2/3 rounded-full bg-gray-100 dark:bg-gray-800" />
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="h-3 w-1/2 rounded-full bg-gray-100 dark:bg-gray-800" />
                        <div className="h-8 w-20 rounded-xl bg-gray-100 dark:bg-gray-800" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-900/60 bg-white/80 dark:bg-gray-950/60 py-10 px-6 text-center">
                <div className="text-4xl mb-2">🌾</div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">No listings found</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try different filters or post your own.</p>
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-semibold shadow-sm hover:bg-emerald-700"
                >
                  <Sparkles className="w-4 h-4" />
                  + Add Opportunity
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {itemsWithDistance.map((it) => {
                  const isOwner = it.isOwner || (user && it.owner?._id && String(it.owner._id) === String(user._id));
                  return (
                    <OpportunityCard
                      key={it._id}
                      item={it}
                      isOwner={isOwner}
                      onOpen={(x) => setDetailItem(x)}
                      onPrimaryAction={(x) => {
                        const owner = x.isOwner || (user && x.owner?._id && String(x.owner._id) === String(user._id));
                        if (owner) setApplicantsFor({ id: x._id, title: x.title });
                        else setApplyItem(x);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'my' && (
          <div className="space-y-4">
            {!user ? (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">Login required</p>
                  <p className="text-amber-700/80 dark:text-amber-300/80">Sign in to see your opportunities and applications.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { id: 'posted', label: `Posted by Me (${myOpportunities.length})` },
                    { id: 'received', label: 'Applications Received' },
                    { id: 'booked', label: `Rentals Booked (${rentalsBooked.length})` },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDashboardTab(t.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full font-semibold border text-xs',
                        dashboardTab === t.id
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {dashboardTab === 'posted' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {myOpportunities.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-900/60 bg-white/80 dark:bg-gray-950/60 py-10 px-6 text-center sm:col-span-2 lg:col-span-3">
                        <div className="text-4xl mb-2">🧑‍🌾</div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">No posts yet</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Post a job or rental and get responses quickly.</p>
                        <button
                          type="button"
                          onClick={() => setShowAdd(true)}
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-semibold shadow-sm hover:bg-emerald-700"
                        >
                          + Add Opportunity
                        </button>
                      </div>
                    ) : (
                      myOpportunities.map((it) => (
                        <OpportunityCard
                          key={it._id}
                          item={it}
                          isOwner
                          onOpen={(x) => setDetailItem(x)}
                          onPrimaryAction={(x) => setApplicantsFor({ id: x._id, title: x.title })}
                          onDelete={handleDeleteOpportunity}
                          deleting={deletingId === it._id}
                        />
                      ))
                    )}
                  </div>
                )}

                {dashboardTab === 'received' && (
                  <div className="space-y-3">
                    {myOpportunities.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/60 py-10 px-6 text-center">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">No opportunities posted</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Post something to receive applications.</p>
                      </div>
                    ) : (
                      myOpportunities.map((o) => (
                        <div key={o._id} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{o.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{o.location}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setApplicantsFor({ id: o._id, title: o.title })}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 shadow-sm flex-shrink-0"
                          >
                            View applicants
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {dashboardTab === 'booked' && (
                  <div className="space-y-3">
                    {rentalsBooked.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/60 py-10 px-6 text-center">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">No rentals booked yet</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">When a rental is accepted, it will appear here.</p>
                      </div>
                    ) : (
                      rentalsBooked.map((a) => (
                        <div key={a._id} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                            {a.opportunity?.title || 'Rental'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Status: <span className="font-semibold text-emerald-700 dark:text-emerald-300">{a.status}</span>
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowAdd(true)}
        className="fixed bottom-5 right-5 sm:hidden w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl flex items-center justify-center text-2xl"
        aria-label="Add Opportunity"
      >
        +
      </button>

      <AddOpportunityModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={(created) => {
          setItems((prev) => [created, ...prev]);
          if (user) setMyOpportunities((prev) => [created, ...prev]);
        }}
      />

      <OpportunityDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onPrimaryAction={(x) => setApplyItem(x)}
        onViewApplicants={(x) => setApplicantsFor({ id: x._id, title: x.title })}
        isOwner={detailItem && (detailItem.isOwner || (user && detailItem.owner?._id && String(detailItem.owner._id) === String(user._id)))}
      />

      <ApplyOpportunityModal
        item={applyItem}
        onClose={() => setApplyItem(null)}
        onSubmitted={() => {}}
      />

      {applicantsFor && (
        <ApplicantsModal
          opportunityId={applicantsFor.id}
          title={applicantsFor.title}
          onClose={() => setApplicantsFor(null)}
        />
      )}
    </div>
  );
}


"use client";
import React, { useState, useEffect } from "react";
import withAuth from "@/components/auth/withAuth";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import LoadingSpinner from "@/components/admin/LoadingSpinner";
import { Save, CreditCard, Clock, Shield, Info, ChevronRight, UserPlus, Contact, Plus, Trash2, Edit2, X, Phone, Mail, History, Filter, Eye, Gem, MapPin, Settings2, Trash } from "lucide-react";
import CustomLoader from "@/components/CustomLoader";
import { ReferralSource, PlatformContact, AuditLog } from "@/types";

interface Settings {
    commissionRate: number;
    vatRate: number;
    pendingBookingDeletionTime: number;
    onlineBookingReactivationTime: number;
    onlineBookingDeactivationTime: number;
}

interface PremiumEligibilityConfig {
    minImages: number;
    minimumRating: number;
    minimumReviews: number;
    minimumPremiumDailyRate: number;
    scoreThreshold: number;
    weights: {
        premiumArea: number;
        facilities: number;
        suitability: number;
        pricing: number;
        reputation: number;
    };
}

interface PremiumArea {
    name: string;
    state: string;
    neighborhoods: string[];
    weight: number;
}

interface PremiumAreasConfig {
    city: string;
    state: string;
    areas: PremiumArea[];
}

type TabId = 'financial' | 'automation' | 'vendor' | 'premium' | 'referral' | 'contacts' | 'audit';

const extractArray = <T,>(data: unknown, key?: string): T[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (key && Array.isArray(obj[key])) return obj[key] as T[];
        // Try common keys if key not provided or not found
        const potentialKeys = ['referralSources', 'contacts', 'platformContacts', 'data'];
        for (const k of potentialKeys) {
            if (Array.isArray(obj[k])) return obj[k] as T[];
        }
        // Last resort: find any array property
        const foundKey = Object.keys(obj).find(k => Array.isArray(obj[k]));
        if (foundKey) return obj[foundKey] as T[];
    }
    return [];
};

const SettingsPage = () => {
    const [settings, setSettings] = useState<Partial<Settings>>({});
    const [referralSources, setReferralSources] = useState<ReferralSource[]>([]);
    const [platformContacts, setPlatformContacts] = useState<PlatformContact[]>([]);
    const [premiumEligibilityConfig, setPremiumEligibilityConfig] = useState<PremiumEligibilityConfig | null>(null);
    const [premiumAreasConfig, setPremiumAreasConfig] = useState<PremiumAreasConfig | null>(null);
    const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
    const [isAreasModalOpen, setIsAreasModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('financial');

    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Partial<PlatformContact> | null>(null);
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
    const [editingReferral, setEditingReferral] = useState<Partial<ReferralSource> | null>(null);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [commissionRes, vatRes, pendingRes, reactivationRes, deactivationRes, referralRes, contactsRes, premiumRes] = await Promise.allSettled([
                api.get('/settings/commission-rate'),
                api.get('/settings/vat-rate'),
                api.get('/settings/pending-booking-deletion-time'),
                api.get('/settings/online-booking-reactivation-time'),
                api.get('/settings/online-booking-deactivation-time'),
                api.get('/settings/referral-sources'),
                api.get('/settings/platform-contacts'),
                api.get('/settings/premium')
            ]);

            const newSettings: Partial<Settings> = {};

            if (commissionRes.status === 'fulfilled') {
                newSettings.commissionRate = commissionRes.value.data.data.value ?? commissionRes.value.data.data.rate;
            }
            if (vatRes.status === 'fulfilled') {
                newSettings.vatRate = vatRes.value.data.data.rate ?? vatRes.value.data.data.value;
            }
            if (pendingRes.status === 'fulfilled') {
                newSettings.pendingBookingDeletionTime = pendingRes.value.data.data.time;
            }
            if (reactivationRes.status === 'fulfilled') {
                newSettings.onlineBookingReactivationTime = reactivationRes.value.data.data.time;
            }
            if (deactivationRes.status === 'fulfilled') {
                newSettings.onlineBookingDeactivationTime = deactivationRes.value.data.data.time;
            }

            if (referralRes.status === 'fulfilled') {
                setReferralSources(extractArray<ReferralSource>(referralRes.value.data.data, 'referralSources'));
            }
            if (contactsRes.status === 'fulfilled') {
                setPlatformContacts(extractArray<PlatformContact>(contactsRes.value.data.data, 'platformContacts'));
            }

            if (premiumRes.status === 'fulfilled') {
                const premiumData = premiumRes.value.data.data;
                setPremiumEligibilityConfig(premiumData.premiumEligibilityConfig || null);
                setPremiumAreasConfig(premiumData.premiumAreasConfig || null);
            }

            setSettings(newSettings);
        } catch (error) {
            console.error("Error fetching initial settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        if (activeTab === 'referral') {
            api.get('/settings/referral-sources').then(res => {
                setReferralSources(extractArray<ReferralSource>(res.data.data, 'referralSources'));
            }).catch(console.error);
        } else if (activeTab === 'contacts') {
            api.get('/settings/platform-contacts').then(res => {
                setPlatformContacts(extractArray<PlatformContact>(res.data.data, 'platformContacts'));
            }).catch(console.error);
        } else if (activeTab === 'premium') {
            api.get('/settings/premium').then(res => {
                const premiumData = res.data.data;
                setPremiumEligibilityConfig(premiumData.premiumEligibilityConfig || null);
                setPremiumAreasConfig(premiumData.premiumAreasConfig || null);
            }).catch(console.error);
        }
    }, [activeTab]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    };

    const validate = (name: keyof Settings, value: string | number | undefined): string | null => {
        if (value === undefined || value === '') return "Value is required";
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return "Please enter a valid number";

        if (name === 'commissionRate' || name === 'vatRate') {
            if (numValue < 0 || numValue > 100) return "Rate must be between 0 and 100";
        } else {
            if (numValue < 1) return "Value must be at least 1 minute";
        }
        return null;
    };

    const handleSave = async (settingName: keyof Settings, endpoint: string, payload: object, successMessage: string) => {
        const value = settings[settingName];
        const error = validate(settingName, value);
        if (error) {
            Swal.fire('Validation Error', error, 'error');
            return;
        }

        setIsSaving(settingName);
        try {
            await api.patch(endpoint, payload);
            Swal.fire({
                title: 'Success',
                text: successMessage,
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error(`Error updating ${settingName}:`, error);
            Swal.fire('Error', `Could not update ${settingName}.`, 'error');
        } finally {
            setIsSaving(null);
        }
    };

    const tabs = [
        { id: 'financial' as TabId, label: 'Financial Settings', icon: CreditCard, description: 'Manage platform fees and commissions' },
        { id: 'automation' as TabId, label: 'Booking Automation', icon: Clock, description: 'Configure automated booking behavior' },
        { id: 'vendor' as TabId, label: 'Vendor Controls', icon: Shield, description: 'Set limits and controls for venue owners' },
        { id: 'premium' as TabId, label: 'Premium Configuration', icon: Gem, description: 'Manage premium eligibility and area settings' },
        { id: 'referral' as TabId, label: 'Referral Sources', icon: UserPlus, description: 'Manage options for tracking booking origins' },
        { id: 'contacts' as TabId, label: 'Platform Contacts', icon: Contact, description: 'Manage universal list of platform representatives' },
        { id: 'audit' as TabId, label: 'Audit Logs', icon: History, description: 'Track all administrative actions and system events' },
    ];

    interface SettingCardProps {
        id: keyof Settings;
        label: string;
        description: string;
        value: number | string | undefined;
        onSave: () => void;
        placeholder: string;
        unit?: string;
    }

    const handleSaveReferralSource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingReferral) return;

        try {
            const payload = {
                name: editingReferral.name,
                triggersCommission: editingReferral.triggersCommission ?? false,
                isDefault: editingReferral.isDefault ?? false,
            };

            if (editingReferral._id) {
                await api.patch(`/settings/referral-sources/${editingReferral._id}`, payload);
                Swal.fire('Success', 'Referral source updated.', 'success');
            } else {
                await api.post('/settings/referral-sources', payload);
                Swal.fire('Success', 'Referral source added.', 'success');
            }
            setIsReferralModalOpen(false);
            setEditingReferral(null);
            const res = await api.get('/settings/referral-sources');
            setReferralSources(extractArray<ReferralSource>(res.data.data, 'referralSources'));
        } catch (error) {
            console.error("Error saving referral source:", error);
            Swal.fire('Error', 'Could not save referral source.', 'error');
        }
    };

    const handleDeleteReferralSource = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This source will be removed from future tracking options.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/settings/referral-sources/${id}`);
                Swal.fire('Deleted!', 'Referral source has been deleted.', 'success');
                const res = await api.get('/settings/referral-sources');
                setReferralSources(extractArray<ReferralSource>(res.data.data, 'referralSources'));
            } catch (error) {
                console.error("Error deleting referral source:", error);
                Swal.fire('Error', 'Could not delete referral source.', 'error');
            }
        }
    };

    const handleSavePremium = async (type: 'eligibility' | 'areas', config: unknown) => {
        setIsSaving(`premium-${type}`);
        try {
            const endpoint = type === 'eligibility' ? '/settings/premium/eligibility' : '/settings/premium/areas';
            // Extract _id from areas if they exist, to avoid sending them back if the backend doesn't want them
            // or just send the config as is. The user mentioned PATCH /api/v1/settings/premium/areas { config: { ... } }
            await api.patch(endpoint, { config });

            Swal.fire({
                title: 'Success',
                text: `Premium ${type} configuration updated.`,
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });

            // Refresh data
            const res = await api.get('/settings/premium');
            const premiumData = res.data.data;
            setPremiumEligibilityConfig(premiumData.premiumEligibilityConfig || null);
            setPremiumAreasConfig(premiumData.premiumAreasConfig || null);

            if (type === 'eligibility') setIsEligibilityModalOpen(false);
            else setIsAreasModalOpen(false);
        } catch (error) {
            console.error(`Error updating premium ${type}:`, error);
            Swal.fire('Error', `Could not update premium ${type}.`, 'error');
        } finally {
            setIsSaving(null);
        }
    };

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContact) return;

        try {
            // Requirement says POST /settings/platform-contacts to update universal list
            // Assuming it's a standard POST to create or a PUT/PATCH if it was an update.
            // But if it's "Update the universal list", maybe it takes the whole array.
            // Let's assume for now it's a create/update for a single entry if it has an ID.

            let updatedContacts;
            if (editingContact._id) {
                updatedContacts = platformContacts.map(c => c._id === editingContact._id ? editingContact : c);
            } else {
                updatedContacts = [...platformContacts, { ...editingContact, _id: Date.now().toString() }];
            }

            await api.post('/settings/platform-contacts', { contacts: updatedContacts });

            Swal.fire('Success', 'Platform contacts updated.', 'success');
            setIsContactModalOpen(false);
            setEditingContact(null);
            const res = await api.get('/settings/platform-contacts');
            setPlatformContacts(extractArray<PlatformContact>(res.data.data, 'platformContacts'));
        } catch (error) {
            console.error("Error saving platform contact:", error);
            Swal.fire('Error', 'Could not save platform contact.', 'error');
        }
    };

    const handleDeleteContact = async (id: string) => {
        const result = await Swal.fire({
            title: 'Remove Contact?',
            text: "This representative will no longer be assignable to halls.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, remove it!'
        });

        if (result.isConfirmed) {
            try {
                const updatedContacts = platformContacts.filter(c => c._id !== id);
                await api.post('/settings/platform-contacts', { contacts: updatedContacts });
                Swal.fire('Removed!', 'Contact has been removed.', 'success');
                const res = await api.get('/settings/platform-contacts');
                setPlatformContacts(extractArray<PlatformContact>(res.data.data, 'platformContacts'));
            } catch (error) {
                console.error("Error deleting platform contact:", error);
                Swal.fire('Error', 'Could not remove contact.', 'error');
            }
        }
    };

    const SettingCard = ({ id, label, description, value, onSave, placeholder, unit }: SettingCardProps) => (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 transition-all hover:shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-grow max-w-2xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{label}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-grow sm:w-48">
                        <input
                            type="number"
                            name={id}
                            id={id}
                            value={value ?? ''}
                            onChange={handleInputChange}
                            className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 font-medium transition-all"
                            placeholder={placeholder}
                        />
                        {unit && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                                {unit}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onSave}
                        disabled={isSaving === id}
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-gray-300 disabled:scale-100 shadow-sm"
                    >
                        {isSaving === id ? (
                            <CustomLoader size={20} className="brightness-0 invert" />
                        ) : (
                            <Save size={18} />
                        )}
                        <span>{isSaving === id ? 'Saving...' : 'Save'}</span>
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Application Settings</h1>
                <p className="text-gray-500 mt-2">Configure platform-wide rules and parameters.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-80 flex-shrink-0">
                    <nav className="space-y-2 sticky top-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left ${
                                        isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 ring-1 ring-primary'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200 shadow-sm'
                                    }`}
                                >
                                    <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                                        <Icon size={22} className={isActive ? 'text-white' : 'text-gray-500'} />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between">
                                            <span className={`font-bold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                                {tab.label}
                                            </span>
                                            {isActive && <ChevronRight size={18} className="opacity-60" />}
                                        </div>
                                        <p className={`text-xs mt-1 leading-snug ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                                            {tab.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="flex gap-3 text-blue-700">
                            <Info size={20} className="flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-bold mb-1">Need help?</p>
                                <p className="leading-relaxed opacity-90">Changes to these settings take effect immediately for all new transactions and bookings.</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-grow">
                    {activeTab === 'financial' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <CreditCard size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Financial Settings</h2>
                            </div>
                            <SettingCard
                                id="commissionRate"
                                label="Platform Commission Rate"
                                description="The percentage fee charged by the platform for every successful online booking. This applies to the total booking amount."
                                value={settings.commissionRate}
                                onSave={() => handleSave('commissionRate', '/settings/commission-rate', { rate: settings.commissionRate }, 'Commission rate updated.')}
                                placeholder="e.g., 10"
                                unit="%"
                            />
                            <SettingCard
                                id="vatRate"
                                label="Platform VAT Rate"
                                description="The VAT percentage applied to transaction fees across the platform. This is typically used for compliance with regional tax regulations."
                                value={settings.vatRate}
                                onSave={() => handleSave('vatRate', '/settings/vat-rate', { rate: settings.vatRate }, 'VAT rate updated.')}
                                placeholder="e.g., 7.5"
                                unit="%"
                            />
                        </div>
                    )}

                    {activeTab === 'premium' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Gem size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Premium Configuration</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Eligibility Summary */}
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-primary/5 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                                            <Settings2 size={24} />
                                        </div>
                                        <button
                                            onClick={() => setIsEligibilityModalOpen(true)}
                                            className="text-xs font-bold text-primary hover:text-primary-dark uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-xl transition-all active:scale-95"
                                        >
                                            Edit Configuration
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Eligibility Rules</h3>
                                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">Criteria for halls to attain premium status based on reviews, ratings, and pricing.</p>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Min Images</span>
                                            <span className="text-sm font-black text-gray-900">{premiumEligibilityConfig?.minImages || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Min Rating</span>
                                            <span className="text-sm font-black text-gray-900">{premiumEligibilityConfig?.minimumRating || 0}/5</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Score Threshold</span>
                                            <span className="text-sm font-black text-primary">{premiumEligibilityConfig?.scoreThreshold || 0}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Areas Summary */}
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-primary/5 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                                            <MapPin size={24} />
                                        </div>
                                        <button
                                            onClick={() => setIsAreasModalOpen(true)}
                                            className="text-xs font-bold text-primary hover:text-primary-dark uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-xl transition-all active:scale-95"
                                        >
                                            Manage Areas
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Areas</h3>
                                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">Geographic targeting for {premiumAreasConfig?.city || 'unspecified cities'}.</p>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target City</span>
                                            <span className="text-sm font-black text-gray-900">{premiumAreasConfig?.city || 'N/A'} ({premiumAreasConfig?.state || 'N/A'})</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configured Areas</span>
                                            <span className="text-sm font-black text-gray-900">{premiumAreasConfig?.areas?.length || 0} Areas</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Neighborhoods</span>
                                            <span className="text-sm font-black text-primary">
                                                {premiumAreasConfig?.areas?.reduce((acc, area) => acc + area.neighborhoods.length, 0) || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'automation' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Clock size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Booking Automation</h2>
                            </div>
                            <SettingCard
                                id="pendingBookingDeletionTime"
                                label="Unpaid Booking Expiry"
                                description="The duration (in minutes) a booking remains in 'Pending' status before being automatically deleted if payment is not confirmed."
                                value={settings.pendingBookingDeletionTime}
                                onSave={() => handleSave('pendingBookingDeletionTime', '/settings/pending-booking-deletion-time', { time: settings.pendingBookingDeletionTime }, 'Pending booking deletion time updated.')}
                                placeholder="e.g., 30"
                                unit="mins"
                            />
                        </div>
                    )}

                    {activeTab === 'vendor' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Shield size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Vendor Controls</h2>
                            </div>
                            <SettingCard
                                id="onlineBookingReactivationTime"
                                label="Reactivation Lockout Period"
                                description="The mandatory waiting time (in minutes) after a vendor disables online booking before they can enable it again."
                                value={settings.onlineBookingReactivationTime}
                                onSave={() => handleSave('onlineBookingReactivationTime', '/settings/online-booking-reactivation-time', { time: settings.onlineBookingReactivationTime }, 'Reactivation lockout time updated.')}
                                placeholder="e.g., 1440"
                                unit="mins"
                            />
                            <SettingCard
                                id="onlineBookingDeactivationTime"
                                label="Deactivation Lockout Period"
                                description="The mandatory waiting time (in minutes) after a vendor enables online booking before they can disable it again."
                                value={settings.onlineBookingDeactivationTime}
                                onSave={() => handleSave('onlineBookingDeactivationTime', '/settings/online-booking-deactivation-time', { time: settings.onlineBookingDeactivationTime }, 'Deactivation lockout time updated.')}
                                placeholder="e.g., 60"
                                unit="mins"
                            />
                        </div>
                    )}

                    {activeTab === 'referral' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <UserPlus size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Referral Sources</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingReferral({ name: '', triggersCommission: false, isDefault: false });
                                        setIsReferralModalOpen(true);
                                    }}
                                    className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95 text-sm"
                                >
                                    <Plus size={18} />
                                    <span>Add Source</span>
                                </button>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Source Name</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Triggers Commission</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Default</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {referralSources.length > 0 ? referralSources.map((source) => (
                                            <tr key={source._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-700">{source.name}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${source.triggersCommission ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {source.triggersCommission ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {source.isDefault && (
                                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                                                            Default
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingReferral(source);
                                                                setIsReferralModalOpen(true);
                                                            }}
                                                            className="text-gray-400 hover:text-primary transition-colors p-2"
                                                            title="Edit Source"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteReferralSource(source._id)}
                                                            className="text-red-400 hover:text-red-600 transition-colors p-2"
                                                            title="Delete Source"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-10 text-center text-gray-400 italic">No referral sources defined.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'audit' && <AuditLogsTab />}

                    {activeTab === 'contacts' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Contact size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Platform Contacts</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingContact({ name: '', phone: '', email: '', role: '' });
                                        setIsContactModalOpen(true);
                                    }}
                                    className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95 text-sm"
                                >
                                    <Plus size={18} />
                                    <span>Add Representative</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {platformContacts.length > 0 ? platformContacts.map((contact) => (
                                    <div key={contact._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                                    <Contact size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{contact.name}</h3>
                                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">{contact.role || 'Representative'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingContact(contact);
                                                        setIsContactModalOpen(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteContact(contact._id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <Phone size={14} className="text-gray-400" />
                                                <span className="font-medium">{contact.phone}</span>
                                            </div>
                                            {contact.email && (
                                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                                    <Mail size={14} className="text-gray-400" />
                                                    <span className="truncate">{contact.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full bg-white p-10 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 italic">
                                        No platform representatives added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Referral Source Modal */}
            {isReferralModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 uppercase italic">
                                {editingReferral?._id ? 'Edit Referral Source' : 'Add Referral Source'}
                            </h2>
                            <button onClick={() => setIsReferralModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveReferralSource} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Source Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingReferral?.name || ''}
                                    onChange={(e) => setEditingReferral(prev => ({ ...prev!, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g. Social Media"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={editingReferral?.triggersCommission || false}
                                        onChange={(e) => setEditingReferral(prev => ({ ...prev!, triggersCommission: e.target.checked }))}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">Triggers Commission</span>
                                        <span className="text-[10px] text-gray-500">Should this source trigger a platform fee?</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={editingReferral?.isDefault || false}
                                        onChange={(e) => setEditingReferral(prev => ({ ...prev!, isDefault: e.target.checked }))}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">Default Source</span>
                                        <span className="text-[10px] text-gray-500">Is this the standard selection for new bookings?</span>
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsReferralModalOpen(false)}
                                    className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                >
                                    {editingReferral?._id ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            <EligibilityModal
                isOpen={isEligibilityModalOpen}
                onClose={() => setIsEligibilityModalOpen(false)}
                initialData={premiumEligibilityConfig}
                onSave={(config) => handleSavePremium('eligibility', config)}
                isSaving={isSaving === 'premium-eligibility'}
            />

            <AreasModal
                isOpen={isAreasModalOpen}
                onClose={() => setIsAreasModalOpen(false)}
                initialData={premiumAreasConfig}
                onSave={(config) => handleSavePremium('areas', config)}
                isSaving={isSaving === 'premium-areas'}
            />

            {isContactModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 uppercase italic">
                                {editingContact?._id ? 'Edit Representative' : 'Add Representative'}
                            </h2>
                            <button onClick={() => setIsContactModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveContact} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingContact?.name || ''}
                                    onChange={(e) => setEditingContact(prev => ({ ...prev!, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={editingContact?.phone || ''}
                                    onChange={(e) => setEditingContact(prev => ({ ...prev!, phone: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g. +234..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email (Optional)</label>
                                <input
                                    type="email"
                                    value={editingContact?.email || ''}
                                    onChange={(e) => setEditingContact(prev => ({ ...prev!, email: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g. john@gobokin.com"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Role / Designation</label>
                                <input
                                    type="text"
                                    value={editingContact?.role || ''}
                                    onChange={(e) => setEditingContact(prev => ({ ...prev!, role: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g. Customer Support"
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsContactModalOpen(false)}
                                    className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                >
                                    {editingContact?._id ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const AuditLogsTab = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        action: '',
        actorEmail: '',
        resource: '',
        status: '',
        startDate: '',
        endDate: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
            };
            const res = await api.get('/admin/audit-logs', { params });
            setLogs(res.data.data.logs || []);
            setTotalPages(res.data.data.totalPages || 1);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
            Swal.fire("Error", "Could not fetch audit logs.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchLogs, 500);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const fetchLogDetails = async (id: string) => {
        Swal.fire({ title: 'Loading...', didOpen: () => Swal.showLoading() });
        try {
            const res = await api.get(`/admin/audit-logs/${id}`);
            setSelectedLog(res.data.data);
            Swal.close();
        } catch (error) {
            console.error("Error fetching log details:", error);
            Swal.fire("Error", "Could not fetch log details.", "error");
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <History size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">System Audit Logs</h2>
                    {loading && <CustomLoader size={20} />}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        showFilters ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                    }`}
                >
                    <Filter size={18} />
                    <span>Filters</span>
                </button>
            </div>

            {showFilters && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Action</label>
                        <input name="action" value={filters.action} onChange={handleFilterChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="e.g. USER_LOGIN" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Actor Email</label>
                        <input name="actorEmail" value={filters.actorEmail} onChange={handleFilterChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="Search by email" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Resource</label>
                        <input name="resource" value={filters.resource} onChange={handleFilterChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Booking" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                            <option value="">All Statuses</option>
                            <option value="success">Success</option>
                            <option value="failure">Failure</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Start Date</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">End Date</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Time</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Action</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Actor</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.length > 0 ? logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-gray-900">{log.action}</span>
                                        <div className="text-[10px] text-gray-400 font-medium uppercase">{log.resource} ({log.resourceId})</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-700">{log.actorName}</div>
                                        <div className="text-[10px] text-gray-400">{log.actorEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => fetchLogDetails(log._id)} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-all">
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No audit logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Previous
                    </button>

                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .map((p, i, arr) => (
                                <React.Fragment key={p}>
                                    {i > 0 && arr[i-1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                                    <button
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                                            page === p ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                </React.Fragment>
                            ))
                        }
                    </div>

                    <button
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Next
                    </button>
                </div>
            )}

            {selectedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 italic uppercase">Audit Log Details</h2>
                                <p className="text-xs text-gray-500 mt-1">{selectedLog._id}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Action</label>
                                    <div className="text-sm font-bold text-gray-900">{selectedLog.action}</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Timestamp</label>
                                    <div className="text-sm text-gray-700">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Actor</label>
                                    <div className="text-sm font-bold text-gray-900">{selectedLog.actorName}</div>
                                    <div className="text-xs text-gray-500">{selectedLog.actorEmail}</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</label>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${selectedLog.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {selectedLog.status}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Details</label>
                                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{selectedLog.details}</p>
                            </div>

                            {selectedLog.metadata && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Metadata & Context</label>
                                    <pre className="text-xs bg-gray-900 text-emerald-400 p-6 rounded-2xl overflow-x-auto shadow-inner font-mono leading-relaxed">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.metadata?.delta && Object.keys(selectedLog.metadata.delta).length > 0 && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Changes (Delta)</label>
                                    <pre className="text-xs bg-gray-50 text-gray-700 p-6 rounded-2xl overflow-x-auto border border-gray-200 font-mono leading-relaxed">
                                        {JSON.stringify(selectedLog.metadata.delta, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const EligibilityModal = ({ isOpen, onClose, initialData, onSave, isSaving }: {
    isOpen: boolean;
    onClose: () => void;
    initialData: PremiumEligibilityConfig | null;
    onSave: (config: PremiumEligibilityConfig) => void;
    isSaving: boolean;
}) => {
    const [config, setConfig] = useState<PremiumEligibilityConfig>(initialData || {
        minImages: 0,
        minimumRating: 0,
        minimumReviews: 0,
        minimumPremiumDailyRate: 0,
        scoreThreshold: 0,
        weights: {
            premiumArea: 0,
            facilities: 0,
            suitability: 0,
            pricing: 0,
            reputation: 0
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">Eligibility Criteria</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Configure Scoring & Weights</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-2xl bg-white shadow-sm transition-all hover:scale-110">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-grow space-y-8">
                    {/* Basic Criteria */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Minimum Images</label>
                            <input
                                type="number"
                                value={config.minImages}
                                onChange={(e) => setConfig({ ...config, minImages: parseInt(e.target.value) || 0 })}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Minimum Rating</label>
                            <input
                                type="number"
                                step="0.1"
                                max="5"
                                value={config.minimumRating}
                                onChange={(e) => setConfig({ ...config, minimumRating: parseFloat(e.target.value) || 0 })}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Minimum Reviews</label>
                            <input
                                type="number"
                                value={config.minimumReviews}
                                onChange={(e) => setConfig({ ...config, minimumReviews: parseInt(e.target.value) || 0 })}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Min Daily Rate (₦)</label>
                            <input
                                type="number"
                                value={config.minimumPremiumDailyRate}
                                onChange={(e) => setConfig({ ...config, minimumPremiumDailyRate: parseInt(e.target.value) || 0 })}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 ml-1">Scoring Weights (%)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(config.weights).map(([key, value]) => (
                                <div key={key}>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                    <input
                                        type="number"
                                        value={value}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            weights: { ...config.weights, [key]: parseInt(e.target.value) || 0 }
                                        })}
                                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center">
                            <span className="text-xs font-bold text-primary uppercase tracking-widest">Total Weight</span>
                            <span className={`text-lg font-black ${Object.values(config.weights).reduce((a, b) => a + b, 0) === 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {Object.values(config.weights).reduce((a, b) => a + b, 0)}%
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Overall Score Threshold (%)</label>
                        <input
                            type="number"
                            value={config.scoreThreshold}
                            onChange={(e) => setConfig({ ...config, scoreThreshold: parseInt(e.target.value) || 0 })}
                            className="w-full px-5 py-4 bg-gray-900 text-emerald-400 border-none rounded-2xl text-xl font-black focus:ring-4 focus:ring-primary/20 outline-none transition-all shadow-inner"
                        />
                    </div>
                </div>

                <div className="p-8 bg-gray-50/50 border-t flex gap-4 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 px-6 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-white transition-all uppercase tracking-widest text-xs"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(config)}
                        disabled={isSaving}
                        className="flex-[2] py-4 px-6 bg-primary text-white rounded-2xl font-black hover:bg-primary-dark transition-all uppercase tracking-widest text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSaving ? <CustomLoader size={20} className="brightness-0 invert" /> : <Save size={18} />}
                        <span>Save Configuration</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const AreasModal = ({ isOpen, onClose, initialData, onSave, isSaving }: {
    isOpen: boolean;
    onClose: () => void;
    initialData: PremiumAreasConfig | null;
    onSave: (config: PremiumAreasConfig) => void;
    isSaving: boolean;
}) => {
    const [config, setConfig] = useState<PremiumAreasConfig>(initialData || {
        city: '',
        state: '',
        areas: []
    });
    const [countries, setCountries] = useState<{ _id: string; name: string }[]>([]);
    const [states, setStates] = useState<{ _id: string; name: string }[]>([]);
    const [selectedCountryId, setSelectedCountryId] = useState('');

    useEffect(() => {
        if (isOpen) {
            api.get('/locations/countries').then(res => {
                setCountries(res.data.data);
            }).catch(console.error);
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedCountryId) {
            api.get(`/locations/states/${selectedCountryId}`).then(res => {
                setStates(res.data.data);
            }).catch(console.error);
        } else {
            setStates([]);
        }
    }, [selectedCountryId]);

    if (!isOpen) return null;

    const addArea = () => {
        setConfig({
            ...config,
            areas: [...config.areas, { name: '', state: config.state, neighborhoods: [], weight: 0 }]
        });
    };

    const updateArea = (index: number, field: keyof PremiumArea, value: string | number | string[]) => {
        const newAreas = [...config.areas];
        newAreas[index] = { ...newAreas[index], [field]: value };
        setConfig({ ...config, areas: newAreas });
    };

    const removeArea = (index: number) => {
        setConfig({ ...config, areas: config.areas.filter((_, i) => i !== index) });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">Premium Areas</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Configure Geographic Weights</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-2xl bg-white shadow-sm transition-all hover:scale-110">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-grow space-y-8">
                    {/* City & State */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Select Country</label>
                            <select
                                value={selectedCountryId}
                                onChange={(e) => setSelectedCountryId(e.target.value)}
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            >
                                <option value="">Select Country</option>
                                {countries.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Target State</label>
                            <select
                                value={config.state}
                                onChange={(e) => setConfig({ ...config, state: e.target.value })}
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                disabled={!selectedCountryId}
                            >
                                <option value="">{selectedCountryId ? 'Select State' : 'Select Country first'}</option>
                                {states.map(s => (
                                    <option key={s._id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Target City</label>
                            <input
                                type="text"
                                value={config.city}
                                onChange={(e) => setConfig({ ...config, city: e.target.value })}
                                placeholder="e.g. Abuja"
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Weighted Areas ({config.areas.length})</h3>
                            <button
                                onClick={addArea}
                                className="text-xs font-bold text-primary hover:text-primary-dark uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Area
                            </button>
                        </div>

                        <div className="space-y-4">
                            {config.areas.map((area, idx) => (
                                <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Area Name</label>
                                            <input
                                                type="text"
                                                value={area.name}
                                                onChange={(e) => updateArea(idx, 'name', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Weight</label>
                                            <input
                                                type="number"
                                                value={area.weight}
                                                onChange={(e) => updateArea(idx, 'weight', parseInt(e.target.value) || 0)}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={() => removeArea(idx)}
                                                className="w-full py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Trash size={14} /> Remove
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Neighborhoods (Comma separated)</label>
                                        <input
                                            type="text"
                                            value={area.neighborhoods.join(', ')}
                                            onChange={(e) => updateArea(idx, 'neighborhoods', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                                            placeholder="e.g. Maitama, Wuse 2"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                            {config.areas.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-[2rem]">
                                    <p className="text-gray-400 text-sm font-medium italic">No premium areas configured yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/50 border-t flex gap-4 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 px-6 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-white transition-all uppercase tracking-widest text-xs"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(config)}
                        disabled={isSaving}
                        className="flex-[2] py-4 px-6 bg-primary text-white rounded-2xl font-black hover:bg-primary-dark transition-all uppercase tracking-widest text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSaving ? <CustomLoader size={20} className="brightness-0 invert" /> : <Save size={18} />}
                        <span>Update Area Settings</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default withAuth(SettingsPage, ["super-admin"]);

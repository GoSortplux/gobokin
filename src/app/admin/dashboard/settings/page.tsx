"use client";
import React, { useState, useEffect } from "react";
import withAuth from "@/components/auth/withAuth";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import LoadingSpinner from "@/components/admin/LoadingSpinner";
import { Save, CreditCard, Clock, Shield, Info, ChevronRight, UserPlus, Contact, Plus, Trash2, Edit2, X, Phone, Mail, History, Filter, Eye } from "lucide-react";
import CustomLoader from "@/components/CustomLoader";
import { ReferralSource, PlatformContact, AuditLog } from "@/types";

interface Settings {
    commissionRate: number;
    vatRate: number;
    pendingBookingDeletionTime: number;
    onlineBookingReactivationTime: number;
    onlineBookingDeactivationTime: number;
}

type TabId = 'financial' | 'automation' | 'vendor' | 'referral' | 'contacts' | 'audit';

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
            const [commissionRes, vatRes, pendingRes, reactivationRes, deactivationRes, referralRes, contactsRes] = await Promise.allSettled([
                api.get('/settings/commission-rate'),
                api.get('/settings/vat-rate'),
                api.get('/settings/pending-booking-deletion-time'),
                api.get('/settings/online-booking-reactivation-time'),
                api.get('/settings/online-booking-deactivation-time'),
                api.get('/settings/referral-sources'),
                api.get('/settings/platform-contacts')
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

export default withAuth(SettingsPage, ["super-admin"]);

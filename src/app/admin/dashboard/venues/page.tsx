"use client";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import withAuth from "@/components/auth/withAuth";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import LoadingSpinner from "@/components/admin/LoadingSpinner";
import { Search, Trash, Edit, Power, PowerOff, Eye, PlusCircle, Calendar as CalendarIcon, Ban, CheckCircle, Star, Crown } from "lucide-react";
import Link from "next/link";
import { createVenueSlug } from "@/utils/slugify";
import VenueModal from "@/components/vendor/VenueModal";
import ReservationModal from "@/components/vendor/ReservationModal";
import Tabs from "@/components/admin/Tabs"; // New Import

// Venue Interface
interface Venue {
  _id: string;
  slug?: string;
  name: string;
  location: string;
  owner?: {
    fullName: string;
  };
  isOnlineBookingEnabled: boolean;
  isListed: boolean;
  isFeatured?: boolean;
  featuredUntil?: string;
  isPremium?: boolean;
}

// Facility Interface
interface Facility {
  _id: string;
  name: string;
}

// Suitability Interface
interface Suitability {
  _id: string;
  name: string;
}

const VenueManagementContent = () => {
  // Common State
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("venues");

  // Venues State
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | undefined>(undefined);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  // Facilities State
  const [facilities, setFacilities] = useState<Facility[]>([]);

  // Suitabilities State
  const [suitabilities, setSuitabilities] = useState<Suitability[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchVenues(), fetchFacilities(), fetchSuitabilities()]);
        } catch (error) {
            console.error("Error fetching data:", error);
            Swal.fire("Error", "Could not fetch all necessary data.", "error");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // Venues Functions
  const fetchVenues = () => {
    return api.get("/halls")
      .then(response => {
        setVenues(response.data.data);
      })
      .catch(error => {
        console.error("Error fetching venues:", error);
        throw error; // Re-throw to be caught by Promise.all
      });
  };

  const filteredVenues = useMemo(() => {
    return venues
      .filter(venue => {
        if (statusFilter === "enabled") return venue.isOnlineBookingEnabled;
        if (statusFilter === "disabled") return !venue.isOnlineBookingEnabled;
        if (statusFilter === "listed") return venue.isListed;
        if (statusFilter === "unlisted") return !venue.isListed;
        if (statusFilter === "featured") return !!venue.isFeatured;
        if (statusFilter === "premium") return !!venue.isPremium;
        return true;
      })
      .filter(venue =>
        (venue.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (venue.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (venue.owner?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [venues, searchTerm, statusFilter]);

  const handleToggleFeatured = async (venue: Venue) => {
    const isCurrentlyFeatured = !!venue.isFeatured;

    if (isCurrentlyFeatured) {
        const result = await Swal.fire({
            title: 'Remove Featured Status',
            text: "Are you sure you want to remove this venue from featured halls?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, remove it!'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/admin/halls/${venue._id}/discovery-status`, { isFeatured: false });
                Swal.fire('Success!', 'Venue removed from featured halls.', 'success');
                fetchVenues();
            } catch (error) {
                console.error("Error removing featured status:", error);
                Swal.fire('Error', 'Could not remove featured status.', 'error');
            }
        }
    } else {
        const { value: formValues } = await Swal.fire({
            title: 'Set as Featured Venue',
            html:
                '<div class="text-left">' +
                '<label class="block text-sm font-medium text-gray-700">Featured Until</label>' +
                '<input id="featuredUntil" type="datetime-local" class="swal2-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm">' +
                '</div>',
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                const featuredUntil = (document.getElementById('featuredUntil') as HTMLInputElement).value;
                if (!featuredUntil) {
                    Swal.showValidationMessage('Please select a date and time');
                    return false;
                }
                try {
                  return { featuredUntil: new Date(featuredUntil).toISOString() };
                } catch (e) {
                  Swal.showValidationMessage('Invalid date/time format');
                  return false;
                }
            }
        });

        if (formValues) {
            try {
                await api.patch(`/admin/halls/${venue._id}/discovery-status`, {
                    isFeatured: true,
                    featuredUntil: formValues.featuredUntil
                });
                Swal.fire('Success!', 'Venue is now featured.', 'success');
                fetchVenues();
            } catch (error) {
                console.error("Error setting featured status:", error);
                Swal.fire('Error', 'Could not set featured status.', 'error');
            }
        }
    }
  };

  const handleTogglePremium = async (venue: Venue) => {
    const isCurrentlyPremium = !!venue.isPremium;
    const action = isCurrentlyPremium ? "remove from" : "add to";

    const result = await Swal.fire({
        title: `${isCurrentlyPremium ? 'Remove' : 'Add'} Premium Status`,
        text: `Are you sure you want to ${action} premium halls?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: `Yes, ${isCurrentlyPremium ? 'remove' : 'add'} it!`
    });

    if (result.isConfirmed) {
        try {
            await api.patch(`/admin/halls/${venue._id}/discovery-status`, { isPremium: !isCurrentlyPremium });
            Swal.fire('Success!', `Venue ${isCurrentlyPremium ? 'removed from' : 'added to'} premium halls.`, 'success');
            fetchVenues();
        } catch (error) {
            console.error("Error toggling premium status:", error);
            Swal.fire('Error', 'Could not update premium status.', 'error');
        }
    }
  };

  const handleToggleBooking = async (hallId: string, currentState: boolean) => {
    const action = currentState ? "disable" : "enable";
    const result = await Swal.fire({
        title: `Are you sure you want to ${action} online booking?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Yes, ${action} it!`,
    });

    if (result.isConfirmed) {
        try {
            await api.patch(`/halls/${hallId}/toggle-online-booking`);
            Swal.fire('Success!', `Online booking has been ${action}d.`, 'success');
            fetchVenues();
        } catch (error) {
            console.error(`Error toggling online booking:`, error);
            Swal.fire('Error', `Could not ${action} online booking.`, 'error');
        }
    }
  };

  const handleUnlistRelist = async (hallId: string, isListed: boolean) => {
    if (isListed) {
      const { value: reason } = await Swal.fire({
        title: 'Unlist Venue',
        input: 'textarea',
        inputLabel: 'Reason for unlisting',
        inputPlaceholder: 'The venue is under renovation...',
        inputAttributes: {
          'aria-label': 'Type your reason here'
        },
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to provide a reason for unlisting!'
          }
        }
      });

      if (reason) {
        try {
          await api.patch(`/admin/halls/${hallId}/unlist`, { reason });
          Swal.fire('Success!', 'The venue has been unlisted.', 'success');
          fetchVenues();
        } catch (error) {
          console.error("Error unlisting venue:", error);
          Swal.fire('Error', 'Could not unlist the venue.', 'error');
        }
      }
    } else {
      const result = await Swal.fire({
        title: 'Relist Venue',
        text: "Are you sure you want to relist this venue?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, relist it!'
      });

      if (result.isConfirmed) {
        try {
          await api.patch(`/admin/halls/${hallId}/relist`);
          Swal.fire('Success!', 'The venue has been relisted.', 'success');
          fetchVenues();
        } catch (error) {
          console.error("Error relisting venue:", error);
          Swal.fire('Error', 'Could not relist the venue.', 'error');
        }
      }
    }
  };

  const handleDeleteVenue = async (hallId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the venue and all its data!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/halls/${hallId}`);
        Swal.fire('Deleted!', 'The venue has been deleted.', 'success');
        fetchVenues();
      } catch (error) {
        console.error("Error deleting venue:", error);
        Swal.fire('Error', 'Could not delete the venue.', 'error');
      }
    }
  };

  const handleCreateVenue = async (formData: Record<string, unknown>) => {
    Swal.fire({
      title: 'Creating Venue...',
      text: 'Please wait while we set up the new venue.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await api.post('/halls', formData);
      Swal.fire({
        icon: 'success',
        title: 'Venue Created!',
        text: 'The new venue has been created successfully.',
        timer: 2000,
        showConfirmButton: false,
      });
      fetchVenues();
      return response.data.data;
    } catch (error) {
      console.error('Failed to create venue:', error);
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: 'Something went wrong. Please try again.',
      });
      throw error;
    }
  };

  const handleUpdateVenue = async (formData: Record<string, unknown>) => {
    if (!editingVenue) return;

    Swal.fire({
      title: 'Updating Venue...',
      text: 'Please wait while we save the changes.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await api.patch(`/halls/${editingVenue._id}`, formData);
      Swal.fire({
        icon: 'success',
        title: 'Venue Updated!',
        text: 'The venue details have been successfully updated.',
        timer: 2000,
        showConfirmButton: false,
      });
      fetchVenues();
      setIsModalOpen(false);
      setEditingVenue(undefined);
      return response.data.data;
    } catch (error) {
      console.error('Failed to update venue:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Something went wrong. Please try again.',
      });
      throw error;
    }
  };

  const openEditModal = (venue: Venue) => {
    setEditingVenue(venue);
    setIsModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingVenue(undefined);
    setIsModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateReservation = async (reservationData: any) => {
    try {
      await api.post(`/halls/${reservationData.hallId}/reservations`, reservationData);
      setIsReservationModalOpen(false);
      Swal.fire('Success!', 'Reservation created successfully.', 'success');
    } catch (error) {
      console.error('Failed to create reservation:', error);
      Swal.fire('Error', 'Could not create reservation.', 'error');
    }
  };

  const openReservationModal = (hallId: string) => {
    setSelectedVenueId(hallId);
    setIsReservationModalOpen(true);
  };

  // Facilities Functions
  const fetchFacilities = () => {
    return api.get("/facilities")
      .then(response => {
        setFacilities(response.data.data.facilities || []);
      })
      .catch(error => {
        console.error("Error fetching facilities:", error);
        throw error; // Re-throw to be caught by Promise.all
      });
  };

  const handleAddFacility = async () => {
    const { value: name } = await Swal.fire({
      title: 'Add a new facility',
      input: 'text',
      inputLabel: 'Facility Name',
      inputPlaceholder: 'e.g., Air Conditioning',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'You need to write something!'
      }
    });

    if (name) {
      try {
        await api.post('/facilities', { name });
        Swal.fire('Success!', 'Facility added successfully.', 'success');
        fetchFacilities();
      } catch (error) {
        console.error("Error adding facility:", error);
        Swal.fire('Error', 'Could not add the facility.', 'error');
      }
    }
  };

  const handleEditFacility = async (facility: Facility) => {
    const { value: name } = await Swal.fire({
      title: 'Edit facility',
      input: 'text',
      inputValue: facility.name,
      inputLabel: 'Facility Name',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'You need to write something!'
      }
    });

    if (name && name !== facility.name) {
      try {
        await api.patch(`/facilities/${facility._id}`, { name });
        Swal.fire('Success!', 'Facility updated successfully.', 'success');
        fetchFacilities();
      } catch (error) {
        console.error("Error updating facility:", error);
        Swal.fire('Error', 'Could not update the facility.', 'error');
      }
    }
  };

  const handleDeleteFacility = async (facilityId: string) => {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/facilities/${facilityId}`);
            Swal.fire('Deleted!', 'The facility has been deleted.', 'success');
            fetchFacilities();
        } catch (error) {
            console.error("Error deleting facility:", error);
            Swal.fire('Error', 'Could not delete the facility.', 'error');
        }
    }
  };

  // Suitabilities Functions
  const fetchSuitabilities = () => {
    return api.get("/suitabilities")
      .then(response => {
        setSuitabilities(response.data.data || []);
      })
      .catch(error => {
        console.error("Error fetching suitabilities:", error);
        throw error;
      });
  };

  const handleAddSuitability = async () => {
    const { value: name } = await Swal.fire({
      title: 'Add a new suitability',
      input: 'text',
      inputLabel: 'Suitability Name',
      inputPlaceholder: 'e.g., Wedding',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'You need to write something!'
      }
    });

    if (name) {
      try {
        await api.post('/suitabilities', { name });
        Swal.fire('Success!', 'Suitability added successfully.', 'success');
        fetchSuitabilities();
      } catch (error) {
        console.error("Error adding suitability:", error);
        Swal.fire('Error', 'Could not add the suitability.', 'error');
      }
    }
  };

  const handleEditSuitability = async (suitability: Suitability) => {
    const { value: name } = await Swal.fire({
      title: 'Edit suitability',
      input: 'text',
      inputValue: suitability.name,
      inputLabel: 'Suitability Name',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'You need to write something!'
      }
    });

    if (name && name !== suitability.name) {
      try {
        await api.patch(`/suitabilities/${suitability._id}`, { name });
        Swal.fire('Success!', 'Suitability updated successfully.', 'success');
        fetchSuitabilities();
      } catch (error) {
        console.error("Error updating suitability:", error);
        Swal.fire('Error', 'Could not update the suitability.', 'error');
      }
    }
  };

  const handleDeleteSuitability = async (suitabilityId: string) => {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/suitabilities/${suitabilityId}`);
            Swal.fire('Deleted!', 'The suitability has been deleted.', 'success');
            fetchSuitabilities();
        } catch (error) {
            console.error("Error deleting suitability:", error);
            Swal.fire('Error', 'Could not delete the suitability.', 'error');
        }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const tabs = [
      { label: "Venues", value: "venues" },
      { label: "Facilities", value: "facilities" },
      { label: "Suitabilities", value: "suitabilities" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Conditionally render VenueModal only for the venues tab */}
      {activeTab === 'venues' && (
        <VenueModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingVenue(undefined);
          }}
          onSubmit={editingVenue ? handleUpdateVenue : handleCreateVenue}
          venue={editingVenue}
        />
      )}

      {selectedVenueId && (
        <ReservationModal
          isOpen={isReservationModalOpen}
          onClose={() => setIsReservationModalOpen(false)}
          onSubmit={handleCreateReservation}
          hallId={selectedVenueId}
        />
      )}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-primary">Venue Management</h1>
        {activeTab === 'venues' && (
             <button
                onClick={handleOpenCreateModal}
                className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-opacity-90"
             >
                <PlusCircle size={20} />
                <span>Create Venue</span>
             </button>
        )}
        {activeTab === 'facilities' && (
            <button
                onClick={handleAddFacility}
                className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-opacity-90"
            >
                <PlusCircle size={20} />
                <span>Add Facility</span>
            </button>
        )}
        {activeTab === 'suitabilities' && (
            <button
                onClick={handleAddSuitability}
                className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-opacity-90"
            >
                <PlusCircle size={20} />
                <span>Add Suitability</span>
            </button>
        )}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-8">
        {activeTab === 'venues' && (
            <div className="bg-white p-6 shadow-lg rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-1/3">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input
                            type="text"
                            placeholder="Search by name, location, owner..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary w-full text-gray-600"
                        />
                    </div>
                    <div className="w-full md:w-1/4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded-md text-gray-600"
                        >
                            <option value="">All Statuses</option>
                            <option value="enabled">Booking Enabled</option>
                            <option value="disabled">Booking Disabled</option>
                            <option value="listed">Listed</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="featured">Featured</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVenues.map((venue) => (
                        <tr key={venue._id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{venue.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venue.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venue.owner?.fullName || 'No Owner'}</td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                venue.isOnlineBookingEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                Booking: {venue.isOnlineBookingEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                venue.isListed ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                                {venue.isListed ? 'Listed' : 'Unlisted'}
                            </span>
                            {venue.isFeatured && (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Featured
                                </span>
                            )}
                            {venue.isPremium && (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                    Premium
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/venues/${createVenueSlug(venue.name, venue._id, venue.slug)}`} passHref>
                                <button title="View Venue" className="text-blue-600 hover:text-blue-900 mr-3"><Eye size={18} /></button>
                            </Link>
                            <button onClick={() => openEditModal(venue)} title="Edit Venue" className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={18} /></button>
                            <button
                                onClick={() => handleToggleFeatured(venue)}
                                title={venue.isFeatured ? "Remove Featured" : "Set as Featured"}
                                className={`${venue.isFeatured ? 'text-yellow-600' : 'text-gray-400'} hover:text-yellow-600 mr-3`}
                            >
                                <Star size={18} fill={venue.isFeatured ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={() => handleTogglePremium(venue)}
                                title={venue.isPremium ? "Remove Premium" : "Set as Premium"}
                                className={`${venue.isPremium ? 'text-purple-600' : 'text-gray-400'} hover:text-purple-600 mr-3`}
                            >
                                <Crown size={18} fill={venue.isPremium ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={() => handleToggleBooking(venue._id, venue.isOnlineBookingEnabled)}
                                title={venue.isOnlineBookingEnabled ? "Disable Booking" : "Enable Booking"}
                                className="text-yellow-600 hover:text-yellow-900 mr-3"
                            >
                                {venue.isOnlineBookingEnabled ? <PowerOff size={18} /> : <Power size={18} />}
                            </button>
                            <button
                                onClick={() => handleUnlistRelist(venue._id, venue.isListed)}
                                title={venue.isListed ? "Unlist Venue" : "Relist Venue"}
                                className={`${venue.isListed ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} mr-3`}
                            >
                                {venue.isListed ? <Ban size={18} /> : <CheckCircle size={18} />}
                            </button>
                            <button onClick={() => openReservationModal(venue._id)} title="Block Dates" className="text-green-600 hover:text-green-900 mr-3">
                                <CalendarIcon size={18} />
                            </button>
                            <button onClick={() => handleDeleteVenue(venue._id)} title="Delete Venue" className="text-red-600 hover:text-red-900">
                                <Trash size={18} />
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {filteredVenues.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No venues found.
                    </div>
                )}
                </div>
            </div>
        )}
        {activeTab === 'facilities' && (
             <div className="bg-white p-6 shadow-lg rounded-lg">
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(facilities) && facilities.map((facility) => (
                        <tr key={facility._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{facility.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleEditFacility(facility)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                <Edit size={18} />
                            </button>
                            <button onClick={() => handleDeleteFacility(facility._id)} className="text-red-600 hover:text-red-900">
                                <Trash size={18} />
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {facilities.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No facilities found. Click &quot;Add Facility&quot; to create one.
                    </div>
                )}
                </div>
            </div>
        )}
        {activeTab === 'suitabilities' && (
             <div className="bg-white p-6 shadow-lg rounded-lg">
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(suitabilities) && suitabilities.map((suitability) => (
                        <tr key={suitability._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{suitability.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleEditSuitability(suitability)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                <Edit size={18} />
                            </button>
                            <button onClick={() => handleDeleteSuitability(suitability._id)} className="text-red-600 hover:text-red-900">
                                <Trash size={18} />
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {suitabilities.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No suitabilities found. Click &quot;Add Suitability&quot; to create one.
                    </div>
                )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const VenueManagementPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <VenueManagementContent />
  </Suspense>
);

export default withAuth(VenueManagementPage, ["super-admin"]);

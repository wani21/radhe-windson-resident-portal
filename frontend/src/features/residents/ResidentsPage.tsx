import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  X,
  UserX,
  ArrowRightLeft,
  Home,
  Mail,
  Phone,
} from 'lucide-react';
import { residentService } from '../../services/residentService';
import { societyService } from '../../services/societyService';
import { Building, Flat } from '../../types/society';
import { Resident, ResidentCategory } from '../../types/resident';
import { useAuthStore } from '../../store/authStore';

export const ResidentsPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SOCIETY_ADMIN';

  // Data states
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [allFlats, setAllFlats] = useState<Flat[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [reassigningResident, setReassigningResident] = useState<Resident | null>(null);
  const [movingOutResident, setMovingOutResident] = useState<Resident | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Add form states
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newFlatId, setNewFlatId] = useState('');
  const [newCategory, setNewCategory] = useState<ResidentCategory>('OWNER');
  const [newIsOccupant, setNewIsOccupant] = useState(true);
  const [newRelationship, setNewRelationship] = useState('');

  // Edit form states
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCategory, setEditCategory] = useState<ResidentCategory>('OWNER');
  const [editIsOccupant, setEditIsOccupant] = useState(false);
  const [editRelationship, setEditRelationship] = useState('');

  // Reassign state
  const [reassignFlatId, setReassignFlatId] = useState('');

  // Fetch buildings and all flats
  const fetchBuildingsAndFlats = useCallback(async () => {
    try {
      const buildingData = await societyService.getBuildings();
      setBuildings(buildingData);

      // Fetch flats for all buildings to populate the flat selector
      const flatPromises = buildingData.map((b) =>
        societyService.getFlats({ buildingId: b._id, limit: 100 })
      );
      const flatResults = await Promise.all(flatPromises);
      const allFlatsData = flatResults.flatMap((r) => r.flats);
      setAllFlats(allFlatsData);
    } catch (err: any) {
      console.error('Failed to fetch buildings/flats:', err);
    }
  }, []);

  // Fetch residents
  const fetchResidents = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await residentService.getResidents({
        buildingId: selectedBuildingId || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        residencyStatus: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        search: searchQuery.trim() || undefined,
        page: currentPage,
        limit: 25,
      });
      setResidents(res.residents);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to load residents.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBuildingId, selectedCategory, selectedStatus, searchQuery, currentPage]);

  useEffect(() => {
    fetchBuildingsAndFlats();
  }, [fetchBuildingsAndFlats]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  // Clear feedback after 4s
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle Add Resident
  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newFlatId) {
      setModalError('Full name and flat are required.');
      return;
    }
    setIsActionLoading(true);
    setModalError(null);
    try {
      await residentService.createResident({
        fullName: newFullName.trim(),
        email: newEmail.trim() || undefined,
        phone: newPhone.trim() || undefined,
        flatId: newFlatId,
        residentCategory: newCategory,
        isOccupant: newIsOccupant,
        relationshipToPrimaryResident: newRelationship.trim() || undefined,
      });
      setShowAddModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewRelationship('');
      setNewIsOccupant(true);
      setNewCategory('OWNER');
      setSuccessMessage(`Resident ${newFullName.trim()} registered successfully.`);
      await fetchResidents();
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to create resident.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (resident: Resident) => {
    setEditingResident(resident);
    setEditFullName(resident.fullName);
    setEditEmail(resident.email || '');
    setEditPhone(resident.phone || '');
    setEditCategory(resident.residentCategory);
    setEditIsOccupant(resident.isOccupant);
    setEditRelationship(resident.relationshipToPrimaryResident || '');
    setModalError(null);
  };

  // Handle Edit Resident
  const handleEditResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident || !editFullName.trim()) {
      setModalError('Full name is required.');
      return;
    }
    setIsActionLoading(true);
    setModalError(null);
    try {
      await residentService.updateResident(editingResident._id, {
        fullName: editFullName.trim(),
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        residentCategory: editCategory,
        isOccupant: editIsOccupant,
        relationshipToPrimaryResident: editRelationship.trim() || undefined,
      });
      setEditingResident(null);
      setSuccessMessage('Resident updated successfully.');
      await fetchResidents();
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to update resident.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Move Out
  const handleMoveOut = async () => {
    if (!movingOutResident) return;
    setIsActionLoading(true);
    setModalError(null);
    try {
      await residentService.moveOut(movingOutResident._id);
      setMovingOutResident(null);
      setSuccessMessage(`Resident ${movingOutResident.fullName} moved out. Flat occupancy updated.`);
      await fetchResidents();
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to move out resident.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Reassign
  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassigningResident || !reassignFlatId) {
      setModalError('Please select a target flat.');
      return;
    }
    setIsActionLoading(true);
    setModalError(null);
    try {
      await residentService.reassign(reassigningResident._id, reassignFlatId);
      setReassigningResident(null);
      setReassignFlatId('');
      setSuccessMessage(`Resident reassigned to new flat successfully.`);
      await fetchResidents();
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to reassign resident.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Delete (archive)
  const handleDelete = async (resident: Resident) => {
    if (!window.confirm(`Permanently archive resident record for ${resident.fullName}? This removes them from all directories.`)) {
      return;
    }
    try {
      await residentService.deleteResident(resident._id);
      setSuccessMessage(`Resident record archived.`);
      await fetchResidents();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to archive resident.');
    }
  };

  // Helper to get flat display info from a resident
  const getFlatInfo = (resident: Resident): { flatNumber: string; buildingName: string } => {
    const flat = typeof resident.flatId === 'object' ? resident.flatId : null;
    if (flat && typeof flat.buildingId === 'object') {
      return { flatNumber: flat.flatNumber, buildingName: flat.buildingId.name };
    }
    return { flatNumber: 'N/A', buildingName: 'N/A' };
  };

  const getCategoryBadge = (category: ResidentCategory) => {
    switch (category) {
      case 'OWNER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'TENANT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Filter flats by selected building for the add/edit/reassign forms
  const availableFlats = selectedBuildingId
    ? allFlats.filter((f) => {
        const buildingId = typeof f.buildingId === 'object' ? f.buildingId._id : f.buildingId;
        return buildingId === selectedBuildingId;
      })
    : allFlats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Resident Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage residents, households, and occupancy across all wings and flats.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setModalError(null);
              setShowAddModal(true);
            }}
            disabled={allFlats.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Resident</span>
          </button>
        )}
      </div>

      {/* Feedback */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedBuildingId}
            onChange={(e) => {
              setSelectedBuildingId(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Wings</option>
            {buildings.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            <option value="OWNER">Owners</option>
            <option value="TENANT">Tenants</option>
            <option value="FAMILY_MEMBER">Family Members</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ACTIVE">Active Residents</option>
            <option value="INACTIVE">Moved Out (History)</option>
            <option value="ALL">All</option>
          </select>

          <span className="text-xs text-slate-400 font-mono">
            {totalCount} {totalCount === 1 ? 'record' : 'records'}
          </span>
        </div>
      </div>

      {/* Resident Table */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading residents...</p>
        </div>
      ) : residents.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No residents found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {allFlats.length === 0
              ? 'Create buildings and flats first, then add residents.'
              : 'No residents match your filters. Try adjusting the search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="py-3 px-5">Resident</th>
                  <th className="py-3 px-5">Flat / Wing</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Occupant</th>
                  <th className="py-3 px-5">Status</th>
                  {isAdmin && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {residents.map((resident) => {
                  const flatInfo = getFlatInfo(resident);
                  return (
                    <tr key={resident._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{resident.fullName}</div>
                        {resident.email && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {resident.email}
                          </div>
                        )}
                        {resident.phone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {resident.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        <div className="font-mono font-semibold">{flatInfo.flatNumber}</div>
                        <div className="text-[11px] text-slate-400">{flatInfo.buildingName}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadge(resident.residentCategory)}`}>
                          {resident.residentCategory.replace('_', ' ')}
                        </span>
                        {resident.relationshipToPrimaryResident && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {resident.relationshipToPrimaryResident}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {resident.isOccupant ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Yes
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">No</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {resident.residencyStatus === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Moved Out
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(resident)}
                              title="Edit Resident"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {resident.residencyStatus === 'ACTIVE' && (
                              <>
                                <button
                                  onClick={() => setReassigningResident(resident)}
                                  title="Reassign to Another Flat"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setMovingOutResident(resident)}
                                  title="Move Out"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(resident)}
                              title="Archive Record"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Resident */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Register New Resident</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddResident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input type="text" placeholder="e.g. Rajesh Patel" value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" placeholder="email@example.com" value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input type="text" placeholder="9876543210" value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Flat / Unit *</label>
                <select value={newFlatId} onChange={(e) => setNewFlatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a flat...</option>
                  {availableFlats.map((f) => {
                    const building = buildings.find((b) => {
                      const fbId = typeof f.buildingId === 'object' ? f.buildingId._id : f.buildingId;
                      return b._id === fbId;
                    });
                    return (
                      <option key={f._id} value={f._id}>
                        {building?.name} — {f.flatNumber} (Floor {f.floor})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as ResidentCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="OWNER">Owner</option>
                    <option value="TENANT">Tenant</option>
                    <option value="FAMILY_MEMBER">Family Member</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                  <input type="text" placeholder="e.g. Spouse, Son" value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newIsOccupant} onChange={(e) => setNewIsOccupant(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs text-slate-700">Currently occupies this flat (affects flat occupancy status)</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={isActionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Resident */}
      {editingResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Edit Resident</h3>
              </div>
              <button onClick={() => setEditingResident(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditResident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input type="text" value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input type="text" value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as ResidentCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="OWNER">Owner</option>
                    <option value="TENANT">Tenant</option>
                    <option value="FAMILY_MEMBER">Family Member</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                  <input type="text" value={editRelationship}
                    onChange={(e) => setEditRelationship(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editIsOccupant} onChange={(e) => setEditIsOccupant(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs text-slate-700">Currently occupies this flat</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingResident(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={isActionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Move Out Confirmation */}
      {movingOutResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-sm">Confirm Move-Out</h3>
              </div>
              <button onClick={() => setMovingOutResident(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              End the active residency for <span className="font-bold text-slate-900">{movingOutResident.fullName}</span>?
              This records the move-out date and updates flat occupancy. The resident's history is preserved.
            </p>

            {modalError && (
              <div className="p-3 mb-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setMovingOutResident(null)} disabled={isActionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleMoveOut} disabled={isActionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Move-Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reassign */}
      {reassigningResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Reassign Resident</h3>
              </div>
              <button onClick={() => setReassigningResident(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Move <span className="font-bold text-slate-900">{reassigningResident.fullName}</span> to a new flat.
              The current residency will be marked as moved-out (preserving history), and a new active residency
              will be created in the target flat.
            </p>

            {modalError && (
              <div className="p-3 mb-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleReassign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target Flat</span>
                </label>
                <select value={reassignFlatId} onChange={(e) => setReassignFlatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a flat...</option>
                  {allFlats.map((f) => {
                    const building = buildings.find((b) => {
                      const fbId = typeof f.buildingId === 'object' ? f.buildingId._id : f.buildingId;
                      return b._id === fbId;
                    });
                    return (
                      <option key={f._id} value={f._id}>
                        {building?.name} — {f.flatNumber} (Floor {f.floor})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReassigningResident(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={isActionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Reassign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Layers,
  X,
} from 'lucide-react';
import { societyService } from '../../services/societyService';
import { Building, Flat, OccupancyStatus } from '../../types/society';
import { useAuthStore } from '../../store/authStore';

export const FlatsPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SOCIETY_ADMIN';

  // Data states
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI / Modal states
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [showAddFlatModal, setShowAddFlatModal] = useState(false);
  const [showEditBuildingModal, setShowEditBuildingModal] = useState(false);
  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);

  // Form states
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newBuildingFloors, setNewBuildingFloors] = useState<number>(10);

  const [newFlatBuildingId, setNewFlatBuildingId] = useState('');
  const [newFlatNumber, setNewFlatNumber] = useState('');
  const [newFlatFloor, setNewFlatFloor] = useState<number>(1);
  const [newFlatStatus, setNewFlatStatus] = useState<OccupancyStatus>('VACANT');

  const [editBuildingName, setEditBuildingName] = useState('');
  const [editBuildingFloors, setEditBuildingFloors] = useState<number>(10);

  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch buildings
  const fetchBuildings = useCallback(async () => {
    try {
      const data = await societyService.getBuildings();
      setBuildings(data);
      if (data.length > 0 && !newFlatBuildingId) {
        setNewFlatBuildingId(data[0]._id);
      }
    } catch (err: any) {
      console.error('Failed to fetch buildings:', err);
    }
  }, [newFlatBuildingId]);

  // Fetch flats
  const fetchFlats = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await societyService.getFlats({
        buildingId: selectedBuildingId || undefined,
        occupancyStatus: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        search: searchQuery.trim() || undefined,
        page: currentPage,
        limit: 20,
      });
      setFlats(res.flats);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to load flats.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBuildingId, selectedStatus, searchQuery, currentPage]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  useEffect(() => {
    fetchFlats();
  }, [fetchFlats]);

  // Clear feedback messages after 4s
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle Add Building
  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingName.trim()) {
      setModalError('Building name is required.');
      return;
    }
    setIsActionLoading(true);
    setModalError(null);
    try {
      await societyService.createBuilding({
        name: newBuildingName.trim(),
        totalFloors: Number(newBuildingFloors),
      });
      setShowAddBuildingModal(false);
      setNewBuildingName('');
      setSuccessMessage('Building/Wing added successfully.');
      await fetchBuildings();
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to create building.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Open Edit Building modal with pre-populated values
  const openEditBuilding = (building: Building) => {
    setEditingBuilding(building);
    setEditBuildingName(building.name);
    setEditBuildingFloors(building.totalFloors);
    setModalError(null);
    setShowEditBuildingModal(true);
  };

  // Handle Edit Building
  const handleEditBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuilding || !editBuildingName.trim()) {
      setModalError('Building name is required.');
      return;
    }
    setIsActionLoading(true);
    setModalError(null);
    try {
      await societyService.updateBuilding(editingBuilding._id, {
        name: editBuildingName.trim(),
        totalFloors: Number(editBuildingFloors),
      });
      setShowEditBuildingModal(false);
      setEditingBuilding(null);
      setSuccessMessage('Building/Wing updated successfully.');
      await fetchBuildings();
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to update building.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Add Flat
  const handleAddFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlatBuildingId || !newFlatNumber.trim()) {
      setModalError('Please specify building and flat number.');
      return;
    }

    const selectedBuilding = buildings.find((b) => b._id === newFlatBuildingId);
    if (selectedBuilding && newFlatFloor > selectedBuilding.totalFloors) {
      setModalError(
        `Floor ${newFlatFloor} exceeds ${selectedBuilding.name}'s max floors (${selectedBuilding.totalFloors}).`
      );
      return;
    }

    setIsActionLoading(true);
    setModalError(null);
    try {
      await societyService.createFlat({
        buildingId: newFlatBuildingId,
        flatNumber: newFlatNumber.trim().toUpperCase(),
        floor: Number(newFlatFloor),
        occupancyStatus: newFlatStatus,
      });
      setShowAddFlatModal(false);
      setNewFlatNumber('');
      setSuccessMessage(`Flat ${newFlatNumber.trim().toUpperCase()} registered successfully.`);
      await fetchFlats();
    } catch (err: any) {
      // Handles 409 Conflict duplicate error cleanly
      setModalError(err.response?.data?.error?.message || 'Failed to create flat.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Update Flat Occupancy
  const handleUpdateFlatStatus = async (flat: Flat, newStatus: OccupancyStatus) => {
    try {
      await societyService.updateFlat(flat._id, { occupancyStatus: newStatus });
      setSuccessMessage(`Flat ${flat.flatNumber} status changed to ${newStatus}.`);
      setEditingFlat(null);
      await fetchFlats();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to update flat.');
    }
  };

  // Handle Delete Flat
  const handleDeleteFlat = async (flat: Flat) => {
    if (!window.confirm(`Are you sure you want to archive Flat ${flat.flatNumber}?`)) {
      return;
    }
    try {
      await societyService.deleteFlat(flat._id);
      setSuccessMessage(`Flat ${flat.flatNumber} archived.`);
      await fetchFlats();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to archive flat.');
    }
  };

  const getOccupancyBadge = (status: OccupancyStatus) => {
    switch (status) {
      case 'OCCUPIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TENANTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Wings & Flat Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage society towers, wings, and individual residential flats with compound uniqueness guarantees.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setModalError(null);
                setShowAddBuildingModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Add Wing/Tower</span>
            </button>

            <button
              onClick={() => {
                setModalError(null);
                setShowAddFlatModal(true);
              }}
              disabled={buildings.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Flat</span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback Messages */}
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

      {/* Buildings Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => {
            setSelectedBuildingId('');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedBuildingId === ''
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Wings ({buildings.length})
        </button>

        {buildings.map((b) => (
          <div key={b._id} className="flex items-center gap-1 whitespace-nowrap">
            <button
              onClick={() => {
                setSelectedBuildingId(b._id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                selectedBuildingId === b._id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{b.name}</span>
              <span className="text-[10px] opacity-75 font-normal">({b.totalFloors} fl)</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => openEditBuilding(b)}
                title={`Edit ${b.name}`}
                aria-label={`Edit ${b.name}`}
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search flat number (e.g. 101, A-102)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Occupancy:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="VACANT">Vacant</option>
            <option value="OCCUPIED">Occupied (Owner)</option>
            <option value="TENANTED">Tenanted</option>
          </select>

          <span className="text-xs text-slate-400 font-mono">
            {totalCount} {totalCount === 1 ? 'flat' : 'flats'}
          </span>
        </div>
      </div>

      {/* Flat Directory Grid / Table */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Querying flats from MongoDB...</p>
        </div>
      ) : flats.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No flats found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {buildings.length === 0
              ? 'Start by creating your first Wing/Tower using the button above.'
              : 'No residential units match your search or filter settings.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="py-3 px-5">Flat Number</th>
                  <th className="py-3 px-5">Wing / Tower</th>
                  <th className="py-3 px-5">Floor</th>
                  <th className="py-3 px-5">Occupancy Status</th>
                  {isAdmin && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {flats.map((flat) => {
                  const buildingObj = typeof flat.buildingId === 'object' ? flat.buildingId : null;
                  return (
                    <tr key={flat._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                        {flat.flatNumber}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {buildingObj?.name || 'N/A'}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-mono">
                        Floor {flat.floor}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getOccupancyBadge(
                            flat.occupancyStatus
                          )}`}
                        >
                          {flat.occupancyStatus}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingFlat(flat)}
                              title="Edit Flat"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFlat(flat)}
                              title="Archive Flat"
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
              <span>
                Page {currentPage} of {totalPages}
              </span>
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

      {/* Modal: Add Building */}
      {showAddBuildingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add Wing or Tower</h3>
              </div>
              <button
                onClick={() => setShowAddBuildingModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddBuilding} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wing / Tower Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wing A, Tower 1, Blossom Block"
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Floors
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newBuildingFloors}
                  onChange={(e) => setNewBuildingFloors(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Flats registered in this wing cannot exceed this floor number.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBuildingModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Wing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Building */}
      {showEditBuildingModal && editingBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Edit Wing / Tower</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditBuildingModal(false);
                  setEditingBuilding(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditBuilding} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wing / Tower Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wing A, Tower 1, Blossom Block"
                  value={editBuildingName}
                  onChange={(e) => setEditBuildingName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Floors
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editBuildingFloors}
                  onChange={(e) => setEditBuildingFloors(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Reducing below existing flat floors will be rejected by the server.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBuildingModal(false);
                    setEditingBuilding(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Wing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Flat */}
      {showAddFlatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Register Flat Unit</h3>
              </div>
              <button
                onClick={() => setShowAddFlatModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddFlat} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Wing / Tower
                </label>
                <select
                  value={newFlatBuildingId}
                  onChange={(e) => setNewFlatBuildingId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {buildings.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} (Max {b.totalFloors} floors)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Flat Number / Unit ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 101, A-204"
                  value={newFlatNumber}
                  onChange={(e) => setNewFlatNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl uppercase font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Unique constraint enforced per wing. Same flat number in another wing is allowed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Floor</label>
                <input
                  type="number"
                  min="0"
                  value={newFlatFloor}
                  onChange={(e) => setNewFlatFloor(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Occupancy Status
                </label>
                <select
                  value={newFlatStatus}
                  onChange={(e) => setNewFlatStatus(e.target.value as OccupancyStatus)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VACANT">Vacant</option>
                  <option value="OCCUPIED">Occupied (Owner)</option>
                  <option value="TENANTED">Tenanted</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFlatModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Flat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Flat Occupancy */}
      {editingFlat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Update Flat {editingFlat.flatNumber}
              </h3>
              <button onClick={() => setEditingFlat(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Change the operational occupancy state:</p>

            <div className="space-y-2">
              {(['VACANT', 'OCCUPIED', 'TENANTED'] as OccupancyStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateFlatStatus(editingFlat, status)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold border text-left transition-colors ${
                    editingFlat.occupancyStatus === status
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{status}</span>
                  {editingFlat.occupancyStatus === status && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

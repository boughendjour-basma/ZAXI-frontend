import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FavoriteService } from '@/services/favorite.service';
import type { Favorite } from '@/services/favorite.service';
import { Plus, Trash2, Home, Briefcase, Plane, Star, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

function getFavoriteIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('maison') || lower.includes('home'))
    return <Home className="w-4 h-4 text-[#FF9900]" />;
  if (lower.includes('travail') || lower.includes('bureau') || lower.includes('work'))
    return <Briefcase className="w-4 h-4 text-blue-600" />;
  if (lower.includes('aéroport') || lower.includes('aeroport') || lower.includes('airport'))
    return <Plane className="w-4 h-4 text-indigo-600" />;
  return <Star className="w-4 h-4 text-amber-500" />;
}

export function FavoriteLocationsManager() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for creating favorite
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const latitude = 36.073;
  const longitude = 4.761;

  const { data: res, isLoading } = useQuery({
    queryKey: ['favoriteLocations'],
    queryFn: () => FavoriteService.list(),
  });

  const raw = res?.data?.data;
  const favorites: Favorite[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any)?.favorites)
    ? (raw as any).favorites
    : [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Favorite, 'id' | 'createdAt'>) => FavoriteService.create(data),
    onSuccess: () => {
      toast.success('Lieu favori ajouté !');
      queryClient.invalidateQueries({ queryKey: ['favoriteLocations'] });
      setIsAddModalOpen(false);
      setName('');
      setAddress('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Erreur lors de l'ajout du favori.";
      toast.error(msg);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => FavoriteService.remove(id),
    onSuccess: () => {
      toast.success('Favori supprimé.');
      queryClient.invalidateQueries({ queryKey: ['favoriteLocations'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erreur lors de la suppression.';
      toast.error(msg);
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error('Veuillez remplir le nom et l\'adresse.');
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      address: address.trim(),
      latitude,
      longitude,
    });
  };

  const handlePresetSelect = (presetName: string) => {
    setName(presetName);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">
          Mes lieux favoris
        </h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#FF9900] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter un lieu
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-3 bg-white rounded-2xl animate-pulse space-y-2">
          <div className="h-4 bg-[#F5F5F5] rounded w-1/3" />
          <div className="h-3 bg-white rounded w-2/3" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && favorites.length === 0 && (
        <div className="p-4 bg-white border border-dashed border-[#FFE0A0] rounded-2xl text-center space-y-2">
          <p className="text-xs text-[#888] font-medium">
            Aucun lieu favori enregistré (ex: Maison, Travail).
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#FFF3D6] text-[#FF9900] font-semibold text-xs rounded-xl"
          >
            ➕ Ajouter un lieu favori
          </button>
        </div>
      )}

      {/* List Favorites */}
      {!isLoading && favorites.length > 0 && (
        <div className="grid gap-2">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="p-3 bg-white rounded-2xl border border-[#FFE0A0] flex items-center justify-between shadow-2xs hover:border-teal-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white shrink-0">
                  {getFavoriteIcon(fav.name)}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1A1A1A]">
                    {fav.name}
                  </div>
                  <div className="text-[11px] text-[#888] line-clamp-1">
                    {fav.address}
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteMutation.mutate(fav.id)}
                disabled={deleteMutation.isPending}
                className="p-1.5 rounded-xl hover:bg-rose-50 text-[#888] hover:text-rose-500 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#FFE0A0] pb-3">
              <h3 className="text-base font-extrabold text-[#1A1A1A]">
                Ajouter un lieu favori
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full bg-white text-[#888]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              {/* Presets */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">Raccourcis</label>
                <div className="flex items-center gap-2">
                  {['🏠 Maison', '💼 Travail', '✈️ Aéroport'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="px-2.5 py-1 bg-white rounded-lg text-xs font-medium text-[#333] hover:bg-[#FFF3D6] hover:text-[#FF9900]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">Nom du lieu</label>
                <input
                  type="text"
                  placeholder="Ex: Maison, Bureau..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">Adresse / Quartier</label>
                <input
                  type="text"
                  placeholder="Ex: Centre ville, Bordj Bou Arréridj..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-3 bg-gradient-to-r from-[#FF9900] to-[#FF9900] text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Enregistrer le lieu'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

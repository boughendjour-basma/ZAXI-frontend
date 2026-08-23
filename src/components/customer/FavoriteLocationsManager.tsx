import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FavoriteService } from '@/services/favorite.service';
import type { Favorite } from '@/services/favorite.service';
import { Plus, Trash2, Home, Briefcase, Plane, Star, Loader2, X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

function getFavoriteIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('maison') || lower.includes('home'))
    return <Home className="w-4 h-4" style={{ color: '#FF9900' }} />;
  if (lower.includes('travail') || lower.includes('bureau') || lower.includes('work'))
    return <Briefcase className="w-4 h-4" style={{ color: '#3B82F6' }} />;
  if (lower.includes('aéroport') || lower.includes('aeroport') || lower.includes('airport'))
    return <Plane className="w-4 h-4" style={{ color: '#6366F1' }} />;
  return <Star className="w-4 h-4" style={{ color: '#FF9900' }} />;
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
    <div className="space-y-4 text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: '#AAA' }}
        >
          Mes lieux favoris
        </span>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1 text-[12px] font-bold cursor-pointer"
          style={{ color: '#FF9900' }}
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter un lieu
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          className="p-4 rounded-2xl animate-pulse space-y-2"
          style={{ backgroundColor: '#F5F5F5' }}
        >
          <div className="h-4 rounded-xl w-1/3" style={{ backgroundColor: '#E8E8E8' }} />
          <div className="h-3 rounded-xl w-2/3" style={{ backgroundColor: '#E8E8E8' }} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && favorites.length === 0 && (
        <div
          className="py-6 px-4 rounded-2xl text-center space-y-3"
          style={{ backgroundColor: '#F5F5F5' }}
        >
          <MapPin className="w-6 h-6 mx-auto" style={{ color: '#CCC' }} />
          <p className="text-[12px] font-medium" style={{ color: '#999' }}>
            Aucun lieu favori enregistré (ex: Maison, Travail).
          </p>
        </div>
      )}

      {/* List Favorites */}
      {!isLoading && favorites.length > 0 && (
        <div className="space-y-2.5">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="p-3.5 rounded-2xl flex items-center justify-between"
              style={{
                backgroundColor: '#F8F8F8',
                border: '1px solid #F0F0F0',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl shrink-0"
                  style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                >
                  {getFavoriteIcon(fav.name)}
                </div>
                <div>
                  <div className="text-[13px] font-bold" style={{ color: '#1A1A1A' }}>
                    {fav.name}
                  </div>
                  <div className="text-[11px] line-clamp-1" style={{ color: '#999' }}>
                    {fav.address}
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteMutation.mutate(fav.id)}
                disabled={deleteMutation.isPending}
                className="p-2 rounded-xl transition-colors cursor-pointer"
                style={{ color: '#CCC' }}
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 space-y-4 shadow-2xl text-left"
            style={{
              backgroundColor: '#FFFFFF',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid #F0F0F0' }}
            >
              <h3
                className="text-base font-extrabold"
                style={{ color: '#1A1A1A' }}
              >
                Ajouter un lieu favori
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full transition-colors"
                style={{ backgroundColor: '#F5F5F5', color: '#888' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              {/* Presets */}
              <div className="space-y-1.5">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: '#AAA' }}
                >
                  Raccourcis
                </label>
                <div className="flex items-center gap-2">
                  {['🏠 Maison', '💼 Travail', '✈️ Aéroport'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors"
                      style={{
                        backgroundColor: '#F5F5F5',
                        color: '#555',
                        border: '1px solid #E8E8E8',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: '#AAA' }}
                >
                  Nom du lieu
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maison, Bureau..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-[13px] p-3.5 rounded-2xl outline-none"
                  style={{
                    border: '1px solid #E8E8E8',
                    backgroundColor: '#FFFFFF',
                    color: '#1A1A1A',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#FF9900')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E8E8E8')}
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: '#AAA' }}
                >
                  Adresse / Quartier
                </label>
                <input
                  type="text"
                  placeholder="Ex: Centre ville, Bordj Bou Arréridj..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-[13px] p-3.5 rounded-2xl outline-none"
                  style={{
                    border: '1px solid #E8E8E8',
                    backgroundColor: '#FFFFFF',
                    color: '#1A1A1A',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#FF9900')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E8E8E8')}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-3.5 rounded-2xl font-extrabold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-md"
                style={{
                  backgroundColor: '#FF9900',
                  color: '#000',
                }}
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

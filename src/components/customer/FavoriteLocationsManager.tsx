import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FavoriteService } from '@/services/favorite.service';
import type { Favorite } from '@/services/favorite.service';
import { useTranslation } from '@/store/languageStore';
import { Trash2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function FavoriteLocationsManager() {
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
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
      toast.success(language === 'ar' ? 'تمت إضافة المكان المفضل بنجاح !' : 'Lieu favori ajouté !');
      queryClient.invalidateQueries({ queryKey: ['favoriteLocations'] });
      setIsAddModalOpen(false);
      setName('');
      setAddress('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء إضافة المكان.' : "Erreur lors de l'ajout du favori.");
      toast.error(msg);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => FavoriteService.remove(id),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم حذف المكان المفضل.' : 'Favori supprimé.');
      queryClient.invalidateQueries({ queryKey: ['favoriteLocations'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء الحذف.' : 'Erreur lors de la suppression.');
      toast.error(msg);
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال الاسم والعنوان.' : 'Veuillez remplir le nom et l\'adresse.');
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

  const presets = language === 'ar'
    ? ['المنزل', 'العمل', 'المطار']
    : ['Maison', 'Travail', 'Aéroport'];

  return (
    <div className="space-y-4 text-start">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
        >
          {t.profile.favoritesTitle}
        </span>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1 text-[12px] font-bold cursor-pointer text-[#FF9900]"
        >
          + {t.profile.addFavorite}
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          className="p-4 rounded-2xl animate-pulse space-y-2 bg-slate-50"
        >
          <div className="h-4 rounded-xl w-1/3 bg-slate-200" />
          <div className="h-3 rounded-xl w-2/3 bg-slate-200" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && favorites.length === 0 && (
        <div
          className="py-6 px-4 rounded-2xl text-center space-y-3 bg-slate-50"
        >
          <p className="text-[12px] font-medium text-slate-500">
            {language === 'ar' ? 'لا توجد أماكن مفضلة محفوظة (مثل: المنزل، العمل).' : 'Aucun lieu favori enregistré (ex: Maison, Travail).'}
          </p>
        </div>
      )}

      {/* List Favorites */}
      {!isLoading && favorites.length > 0 && (
        <div className="space-y-2.5">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="p-3.5 rounded-2xl flex items-center justify-between bg-slate-50 border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl shrink-0 bg-white border border-slate-200 flex items-center justify-center text-[12px] font-extrabold text-slate-700 shadow-xs"
                >
                  {fav.name ? fav.name.charAt(0).toUpperCase() : '•'}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-900">
                    {fav.name}
                  </div>
                  <div className="text-[11px] line-clamp-1 text-slate-500">
                    {fav.address}
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteMutation.mutate(fav.id)}
                disabled={deleteMutation.isPending}
                className="p-2 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-rose-500"
                title={t.common.delete}
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
            className="w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 space-y-4 shadow-2xl bg-white text-start"
            style={{
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              className="flex items-center justify-between pb-3 border-b border-slate-100"
            >
              <h3
                className="text-base font-extrabold text-slate-900"
              >
                {t.profile.addFavorite}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full transition-colors bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              {/* Presets */}
              <div className="space-y-1.5">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  {language === 'ar' ? 'اختصارات سريعة' : 'Raccourcis'}
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  {language === 'ar' ? 'اسم المكان' : 'Nom du lieu'}
                </label>
                <input
                  type="text"
                  placeholder={t.profile.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-[13px] p-3.5 rounded-2xl outline-none border border-slate-200 bg-white text-slate-900 focus:border-[#FF9900]"
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  {language === 'ar' ? 'العنوان الكامل / الحي' : 'Adresse / Quartier'}
                </label>
                <input
                  type="text"
                  placeholder={t.profile.addressPlaceholder}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-[13px] p-3.5 rounded-2xl outline-none border border-slate-200 bg-white text-slate-900 focus:border-[#FF9900]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-3.5 rounded-2xl font-extrabold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-md bg-[#FF9900] hover:bg-[#FF8800] text-black"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t.common.save
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

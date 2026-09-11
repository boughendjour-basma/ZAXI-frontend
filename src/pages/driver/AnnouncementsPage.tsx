import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import { useTranslation } from '@/store/languageStore';
import { useSocket } from '@/hooks/useSocket';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Calendar,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  description?: string;
  category?: 'AIRPORT' | 'BEACH' | 'TOUR' | 'SPECIAL_OFFER' | 'OTHER';
  price?: number | null;
  createdAt?: string;
}

export default function DriverAnnouncementsPage() {
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  const { useSocketEvent } = useSocket();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'AIRPORT' | 'BEACH' | 'TOUR' | 'SPECIAL_OFFER' | 'OTHER'>('SPECIAL_OFFER');
  const [price, setPrice] = useState('');

  // ── Real-time Socket.IO Listeners ──────────────────────────────────────────
  useSocketEvent('announcement:new', () => {
    queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
  });
  useSocketEvent('announcement:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
  });
  useSocketEvent('announcement:removed', () => {
    queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
  });

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['driverAnnouncements'],
    queryFn: () => DriverService.getPublicAnnouncements(),
    refetchInterval: 5000,
  });

  const rawData = (res?.data?.data as any) ?? (res?.data as any);
  const announcements: Announcement[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.announcements)
    ? rawData.announcements
    : [];

  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      category: 'AIRPORT' | 'BEACH' | 'TOUR' | 'SPECIAL_OFFER' | 'OTHER';
      price?: number;
    }) => DriverService.createAnnouncement(data),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم نشر الإعلان بنجاح !' : 'Annonce publiée avec succès !');
      queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setPrice('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء نشر الإعلان.' : 'Erreur lors de la création de l\'annonce.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        description?: string;
        category?: 'AIRPORT' | 'BEACH' | 'TOUR' | 'SPECIAL_OFFER' | 'OTHER';
        price?: number;
      };
    }) => DriverService.updateAnnouncement(id, data),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تحديث الإعلان بنجاح !' : 'Annonce mise à jour !');
      queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
      setIsModalOpen(false);
      setEditingId(null);
      setTitle('');
      setDescription('');
      setPrice('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء التحديث.' : 'Erreur lors de la mise à jour.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DriverService.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم حذف الإعلان.' : 'Annonce supprimée.');
      queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء الحذف.' : 'Erreur lors de la suppression.'));
    },
  });

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('SPECIAL_OFFER');
    setPrice('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || (item as any).content || '');
    setCategory(item.category || 'SPECIAL_OFFER');
    setPrice(item.price != null ? String(item.price) : '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال العنوان والمحتوى.' : 'Veuillez remplir le titre et le contenu.');
      return;
    }

    const parsedPrice = price.trim() ? parseInt(price.trim(), 10) : undefined;
    const finalPrice = parsedPrice && !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : undefined;

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          title: title.trim(),
          description: description.trim(),
          category,
          price: finalPrice,
        },
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        description: description.trim(),
        category,
        price: finalPrice,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-8 pt-7 px-5 max-w-lg mx-auto space-y-5 text-start">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t.driver.announcements.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {t.driver.announcements.subtitle}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-xs rounded-2xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t.driver.announcements.newAnnouncement}
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 bg-white rounded-[22px] border border-slate-100 animate-pulse space-y-2"
            >
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">
            {t.common.error}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            {t.common.confirm}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && announcements.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-[22px] border border-slate-100 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto text-[#FF9900]">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              {t.driver.announcements.noAnnouncements}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-medium">
              {t.driver.announcements.noAnnouncementsDesc}
            </p>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {!isLoading && !isError && announcements.length > 0 && (
        <div className="grid gap-3">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white rounded-[22px] border border-slate-100 shadow-sm space-y-3 text-start"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-[#FF9900] border border-amber-100">
                      {item.category || 'OFFRE'}
                    </span>
                    {item.price != null && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        {item.price.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')} {t.common.currency}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-2">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={t.common.edit}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(language === 'ar' ? 'هل تريد حذف هذا الإعلان بالتأكيد؟' : 'Veuillez confirmer la suppression de cette annonce.')) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title={t.common.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {item.description || (item as any).content}
              </p>

              {item.createdAt && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'تاريخ النشر:' : 'Publiée le'} {new Date(item.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-start"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingId ? (language === 'ar' ? 'تعديل الإعلان' : 'Modifier l\'annonce') : t.driver.announcements.newAnnouncement}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">{t.driver.announcements.announcementTitle}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: رحلات إلى مطار هواري بومدين...' : 'Ex: Transfert Aéroport d\'Alger & Sétif...'}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{t.driver.announcements.category}</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  >
                    <option value="SPECIAL_OFFER">{language === 'ar' ? 'عرض خاص' : 'Offre Spéciale'}</option>
                    <option value="AIRPORT">{language === 'ar' ? 'توصيل للمطار' : 'Transfert Aéroport'}</option>
                    <option value="BEACH">{language === 'ar' ? 'رحلات شاطئية' : 'Trajet Plage'}</option>
                    <option value="TOUR">{language === 'ar' ? 'جولة سياحية' : 'Circuit Touristique'}</option>
                    <option value="OTHER">{language === 'ar' ? 'عام / أخرى' : 'Autre / Général'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === 'ar' ? 'السعر (دج)' : 'Prix (DZD)'}
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={language === 'ar' ? 'اختياري (مثال: 5000)' : 'Optionnel (ex: 5000)'}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">{t.driver.announcements.announcementContent}</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب تفاصيل العرض أو الإعلان هنا...' : 'Décrivez votre offre ou message public...'}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-[#FF9900] focus:bg-white resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full py-3.5 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingId ? (
                  t.common.save
                ) : (
                  t.driver.announcements.publish
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

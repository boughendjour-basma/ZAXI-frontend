import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
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
  createdAt?: string;
}

export default function DriverAnnouncementsPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'AIRPORT' | 'BEACH' | 'TOUR' | 'SPECIAL_OFFER' | 'OTHER'>('OTHER');

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['driverAnnouncements'],
    queryFn: () => DriverService.getAnnouncements(),
  });

  const rawData = res?.data?.data;
  const announcements: Announcement[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.announcements)
    ? (rawData as any).announcements
    : [];

  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      category?: 'AIRPORT' | 'BEACH' | 'TOUR' | 'SPECIAL_OFFER' | 'OTHER';
    }) => DriverService.createAnnouncement(data),
    onSuccess: () => {
      toast.success('Annonce publiée avec succès !');
      queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la création de l\'annonce.');
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
      };
    }) => DriverService.updateAnnouncement(id, data),
    onSuccess: () => {
      toast.success('Annonce mise à jour !');
      queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
      setIsModalOpen(false);
      setEditingId(null);
      setTitle('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DriverService.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success('Annonce supprimée.');
      queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression.');
    },
  });

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('OTHER');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || (item as any).content || '');
    setCategory(item.category || 'OTHER');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Veuillez remplir le titre et le contenu.');
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          title: title.trim(),
          description: description.trim(),
          category,
        },
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        description: description.trim(),
        category,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-8 pt-7 px-5 max-w-lg mx-auto space-y-5 text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Annonces publiques
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Informations et actualités diffusées aux clients ZAXI
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-xs rounded-2xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Publier
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
            Impossible de charger les annonces.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl"
          >
            Réessayer
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
              Aucune annonce publiée
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-medium">
              Publiez votre première annonce pour informer vos clients de vos tarifs ou trajets.
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
              className="p-5 bg-white rounded-[22px] border border-slate-100 shadow-sm space-y-3 text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-[#FF9900] border border-amber-100">
                    {item.category || 'OFFRE'}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-2">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Voulez-vous vraiment supprimer cette annonce ?')) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
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
                  Publiée le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-left"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingId ? 'Modifier l\'annonce' : 'Publier une annonce'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Titre de l'annonce</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Transfert Aéroport d'Alger & Sétif..."
                  className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Catégorie</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                >
                  <option value="SPECIAL_OFFER">Offre Spéciale</option>
                  <option value="AIRPORT">Transfert Aéroport</option>
                  <option value="BEACH">Trajet Plage / Vacances</option>
                  <option value="TOUR">Circuit Touristique</option>
                  <option value="OTHER">Autre / Général</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Description / Détails</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre offre ou message public..."
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
                  'Mettre à jour'
                ) : (
                  'Publier l\'annonce'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

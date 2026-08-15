import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import type { Announcement } from '@/services/driver.service';
import { Megaphone, Plus, Trash2, Edit2, AlertCircle, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function DriverAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GÉNÉRAL');

  // Query announcements
  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['driverAnnouncements'],
    queryFn: () => DriverService.getPublicAnnouncements(),
  });

  const rawData = res?.data?.data;
  const announcements: Announcement[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.announcements)
    ? (rawData as any).announcements
    : [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; category?: string }) =>
      DriverService.createAnnouncement(data),
    onSuccess: () => {
      toast.success('Annonce publiée avec succès !');
      queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la création de l\'annonce.');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; content?: string; category?: string } }) =>
      DriverService.updateAnnouncement(id, data),
    onSuccess: () => {
      toast.success('Annonce mise à jour !');
      queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    },
  });

  // Delete mutation
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
    setContent('');
    setCategory('GÉNÉRAL');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category || 'GÉNÉRAL');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Veuillez remplir le titre et le contenu.');
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: { title: title.trim(), content: content.trim(), category },
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        content: content.trim(),
        category,
      });
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
            Annonces publiques
          </h1>
          <p className="text-xs text-[#888] mt-0.5">
            Informations et actualités diffusées aux clients ZAXI
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#FF9900] text-black font-bold text-xs rounded-2xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Publier une annonce
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 bg-white rounded-3xl border border-[#FFE0A0] animate-pulse space-y-2"
            >
              <div className="h-4 bg-[#F5F5F5] rounded w-1/3" />
              <div className="h-3 bg-white rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">
            Impossible de charger les annonces.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && announcements.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-3xl border border-[#FFE0A0] space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF3D6] flex items-center justify-center mx-auto text-[#FF9900]">
            <Megaphone className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A]">
              Aucune annonce publiée
            </h3>
            <p className="text-xs text-[#888] mt-1 max-w-xs mx-auto">
              Publiez votre première annonce pour informer vos clients de vos horaires ou offres.
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
              className="p-5 bg-white rounded-3xl border border-[#FFE0A0] shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3D6] text-[#1A1A1A] border border-[#FFE0A0]">
                    {item.category || 'GÉNÉRAL'}
                  </span>
                  <h3 className="text-sm font-extrabold text-[#1A1A1A] mt-1.5">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 rounded-xl text-[#888] hover:text-[#333] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-2 rounded-xl text-rose-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#555] leading-relaxed whitespace-pre-line">
                {item.content}
              </p>

              <div className="text-[10px] text-[#888] font-medium">
                Publié le {formatDate(item.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#FFE0A0] pb-3">
              <h3 className="text-base font-extrabold text-[#1A1A1A]">
                {editingId ? 'Modifier l\'annonce' : 'Nouvelle Annonce'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-full bg-white text-[#888]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                >
                  <option value="GÉNÉRAL">Général</option>
                  <option value="HORAIRES">Horaires & Disponibilité</option>
                  <option value="PROMOTION">Offre Spéciale / Promo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">Titre de l'annonce</label>
                <input
                  type="text"
                  placeholder="Ex: Disponibilité ce week-end..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">Contenu de l'annonce</label>
                <textarea
                  rows={4}
                  placeholder="Rédigez votre message à l'attention des clients..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full py-3 bg-[#FF9900] text-black font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingId ? (
                  'Mettre à jour l\'annonce'
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

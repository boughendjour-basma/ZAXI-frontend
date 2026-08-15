import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { CustomerService } from '@/services/customer.service';
import { FavoriteLocationsManager } from '@/components/customer/FavoriteLocationsManager';
import { Avatar } from '@/components/ui/Avatar';
import {
  LogOut,
  Phone,
  Calendar,
  Edit2,
  Check,
  X,
  Car,
  Loader2,
  Key,
} from 'lucide-react';
import toast from 'react-hot-toast';

function formatFrenchDate(dateStr?: string | null) {
  if (!dateStr) return 'Non renseignée';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export default function CustomerProfilePage() {
  const { user: authUser, logout } = useAuth();
  const queryClient = useQueryClient();

  // Profile data query
  const { data: profileRes } = useQuery({
    queryKey: ['customerProfile'],
    queryFn: () => CustomerService.getProfile(),
  });

  const rawUser = profileRes?.data?.data?.customer ?? (profileRes?.data?.data as any)?.user ?? authUser;
  const profile = rawUser;

  // Edit Name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || '');

  // Edit Name Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (name: string) => CustomerService.updateProfile({ name }),
    onSuccess: () => {
      toast.success('Nom mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['customerProfile'] });
      setIsEditingName(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erreur lors de la mise à jour.';
      toast.error(msg);
    },
  });

  const handleNameSave = () => {
    if (!nameInput.trim()) return;
    updateProfileMutation.mutate(nameInput.trim());
  };

  // Change Password Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      CustomerService.changePassword(data),
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès !');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Mot de passe actuel incorrect.';
      toast.error(msg);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-28">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
          Mon Profil
        </h1>
        <p className="text-xs text-[#888] mt-0.5">
          Gérez vos informations personnelles et lieux favoris
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="p-6 bg-white rounded-3xl border border-[#FFE0A0] text-center space-y-4 shadow-xs">
        <div className="relative inline-block">
          <Avatar name={profile?.name} size="xl" />
        </div>

        {/* Name Editing */}
        <div className="space-y-1">
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="text-sm font-bold text-center px-3 py-1.5 rounded-xl border border-[#FF9900] bg-amber-50/50 text-[#1A1A1A] outline-none"
                autoFocus
              />
              <button
                onClick={handleNameSave}
                disabled={updateProfileMutation.isPending}
                className="p-1.5 rounded-xl bg-[#FF9900] text-black font-bold"
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1.5 rounded-xl bg-[#F5F5F5] text-[#555]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-lg font-extrabold text-[#1A1A1A]">
                {profile?.name ?? 'Client ZAXI'}
              </h2>
              <button
                onClick={() => {
                  setNameInput(profile?.name || '');
                  setIsEditingName(true);
                }}
                className="p-1 rounded-lg text-[#888] hover:text-[#FF9900] transition-colors"
                title="Modifier le nom"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-xs text-[#888] flex items-center justify-center gap-1">
            <Phone className="h-3.5 w-3.5 text-[#FF9900]" /> +213 {profile?.phone}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#FFE0A0] text-xs">
          <div className="p-3 bg-white rounded-2xl">
            <div className="flex items-center justify-center gap-1 text-[#FF9900] font-bold text-base">
              <Car className="w-4 h-4" />
              {profile?.totalTrips ?? 0}
            </div>
            <div className="text-[10px] text-[#888] font-semibold uppercase mt-0.5">Courses</div>
          </div>
          <div className="p-3 bg-white rounded-2xl">
            <div className="flex items-center justify-center gap-1 text-[#FF9900] font-bold text-base">
              <Calendar className="w-4 h-4" />
              {formatFrenchDate(profile?.dateOfBirth)}
            </div>
            <div className="text-[10px] text-[#888] font-semibold uppercase mt-0.5">Date de naissance</div>
          </div>
        </div>

        {/* Change password CTA */}
        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="w-full mt-2 py-2.5 bg-white hover:bg-white text-[#1A1A1A] text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <Key className="w-4 h-4 text-[#FF9900]" /> Modifier mon mot de passe
        </button>
      </div>

      {/* Favorites Section */}
      <div className="p-4 bg-white rounded-3xl border border-[#FFE0A0] shadow-xs">
        <FavoriteLocationsManager />
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" /> Se déconnecter
      </button>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#FFE0A0] pb-3">
              <h3 className="text-base font-extrabold text-[#1A1A1A]">
                Modifier le mot de passe
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-2 rounded-full bg-white text-[#888]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                  placeholder="Minimum 8 caractères"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full py-3 bg-[#FF9900] text-black font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2"
              >
                {changePasswordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Changer le mot de passe'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

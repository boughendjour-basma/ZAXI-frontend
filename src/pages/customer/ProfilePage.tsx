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
  ChevronRight,
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
    <div
      className="min-h-screen pb-10"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <div className="px-5 pt-7 pb-8 max-w-lg mx-auto space-y-5">

        {/* ── Title Section ── */}
        <div className="text-left">
          <h1
            className="text-[22px] font-extrabold tracking-tight"
            style={{ color: '#1A1A1A' }}
          >
            Mon Profil
          </h1>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: '#999' }}
          >
            Gérez vos informations personnelles et lieux favoris
          </p>
        </div>

        {/* ── Main Profile Card ── */}
        <div
          className="rounded-[20px] px-5 pt-7 pb-4 text-center"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <Avatar name={profile?.name} size="xl" />
          </div>

          {/* Name + Edit */}
          <div className="mb-1">
            {isEditingName ? (
              <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="text-base font-bold text-center px-3 py-1.5 rounded-xl outline-none"
                  style={{
                    border: '1.5px solid #FF9900',
                    backgroundColor: '#FFF8F0',
                    color: '#1A1A1A',
                  }}
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  disabled={updateProfileMutation.isPending}
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: '#FF9900', color: '#000' }}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: '#F0F0F0', color: '#888' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <h2
                  className="text-[17px] font-extrabold"
                  style={{ color: '#1A1A1A' }}
                >
                  {profile?.name ?? 'Client ZAXI'}
                </h2>
                <button
                  onClick={() => {
                    setNameInput(profile?.name || '');
                    setIsEditingName(true);
                  }}
                  className="p-1 transition-colors"
                  style={{ color: '#AAA' }}
                  title="Modifier le nom"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Phone */}
          <div
            className="flex items-center justify-center gap-1.5 text-[13px] mb-5"
            style={{ color: '#888' }}
          >
            <Phone className="h-3.5 w-3.5" style={{ color: '#FF9900' }} />
            <span className="font-medium">+213 {profile?.phone}</span>
          </div>

          {/* Divider */}
          <div className="border-t mb-4" style={{ borderColor: '#F0F0F0' }} />

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Courses */}
            <div
              className="py-3.5 px-3 rounded-2xl text-center"
              style={{
                border: '1px solid #F0F0F0',
                backgroundColor: '#FAFAFA',
              }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Car className="w-4 h-4" style={{ color: '#FF9900' }} />
                <span
                  className="text-[15px] font-extrabold"
                  style={{ color: '#1A1A1A' }}
                >
                  {profile?.totalTrips ?? 0}
                </span>
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: '#AAA' }}
              >
                Courses
              </span>
            </div>

            {/* Date de naissance */}
            <div
              className="py-3.5 px-3 rounded-2xl text-center"
              style={{
                border: '1px solid #F0F0F0',
                backgroundColor: '#FAFAFA',
              }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Calendar className="w-4 h-4" style={{ color: '#FF9900' }} />
                <span
                  className="text-[13px] font-extrabold"
                  style={{ color: '#1A1A1A' }}
                >
                  {formatFrenchDate(profile?.dateOfBirth)}
                </span>
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: '#AAA' }}
              >
                Date de naissance
              </span>
            </div>
          </div>

          {/* Change password row */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full py-3.5 rounded-2xl flex items-center justify-between px-4 transition-colors cursor-pointer"
            style={{
              backgroundColor: '#F5F5F5',
              color: '#1A1A1A',
            }}
          >
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4" style={{ color: '#FF9900' }} />
              <span className="text-[13px] font-semibold">Modifier mon mot de passe</span>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: '#CCC' }} />
          </button>
        </div>

        {/* ── Favorites Card ── */}
        <div
          className="rounded-[20px] px-5 py-5"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <FavoriteLocationsManager />
        </div>

        {/* ── Logout Button ── */}
        <button
          onClick={logout}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          style={{
            backgroundColor: '#FFF0F0',
            border: '1px solid #FFD4D4',
            color: '#E53E3E',
          }}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[13px] font-bold">Se déconnecter</span>
        </button>
      </div>

      {/* ── Change Password Modal ── */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 space-y-4 shadow-2xl text-left"
            style={{
              backgroundColor: '#FFFFFF',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid #F0F0F0' }}
            >
              <h3
                className="text-base font-extrabold"
                style={{ color: '#1A1A1A' }}
              >
                Modifier le mot de passe
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-2 rounded-full transition-colors"
                style={{ backgroundColor: '#F5F5F5', color: '#888' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: '#AAA' }}
                >
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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

              <div className="space-y-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: '#AAA' }}
                >
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-[13px] p-3.5 rounded-2xl outline-none"
                  style={{
                    border: '1px solid #E8E8E8',
                    backgroundColor: '#FFFFFF',
                    color: '#1A1A1A',
                  }}
                  placeholder="Minimum 8 caractères"
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#FF9900')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E8E8E8')}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full py-3.5 rounded-2xl font-extrabold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-md"
                style={{
                  backgroundColor: '#FF9900',
                  color: '#000',
                }}
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

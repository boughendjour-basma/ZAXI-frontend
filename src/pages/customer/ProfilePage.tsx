import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { CustomerService } from '@/services/customer.service';
import { FavoriteLocationsManager } from '@/components/customer/FavoriteLocationsManager';
import { Avatar } from '@/components/ui/Avatar';
import { useTranslation } from '@/store/languageStore';
import {
  LogOut,
  Edit2,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

function formatLocalizedDate(dateStr?: string | null, lang: string = 'fr') {
  if (!dateStr) return lang === 'ar' ? 'غير محدد' : 'Non renseignée';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
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
  const { t, language, isRTL } = useTranslation();

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
      toast.success(language === 'ar' ? 'تم تحديث الاسم بنجاح !' : 'Nom mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['customerProfile'] });
      setIsEditingName(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء التحديث.' : 'Erreur lors de la mise à jour.');
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
      toast.success(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح !' : 'Mot de passe modifié avec succès !');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || (language === 'ar' ? 'كلمة المرور الحالية غير صحيحة.' : 'Mot de passe actuel incorrect.');
      toast.error(msg);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول.' : 'Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error(language === 'ar' ? 'يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل.' : 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
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
        <div className="text-start">
          <h1
            className="text-[22px] font-extrabold tracking-tight text-slate-900"
          >
            {t.profile.title}
          </h1>
          <p
            className="text-[13px] mt-0.5 text-slate-500"
          >
            {t.profile.subtitle}
          </p>
        </div>

        {/* ── Main Profile Card ── */}
        <div
          className="rounded-[20px] px-5 pt-7 pb-4 text-center bg-white shadow-sm"
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
                  className="text-base font-bold text-center px-3 py-1.5 rounded-xl outline-none border border-amber-500 bg-amber-50 text-slate-900"
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  disabled={updateProfileMutation.isPending}
                  className="p-2 rounded-xl bg-[#FF9900] text-black cursor-pointer"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <h2
                  className="text-[17px] font-extrabold text-slate-900"
                >
                  {profile?.name ?? t.header.client}
                </h2>
                <button
                  onClick={() => {
                    setNameInput(profile?.name || '');
                    setIsEditingName(true);
                  }}
                  className="p-1 transition-colors text-slate-400 hover:text-amber-500 cursor-pointer"
                  title={t.common.edit}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Phone */}
          <div
            className="flex items-center justify-center gap-1.5 text-[13px] mb-5 text-slate-500"
          >
            <span className="font-medium">+213 {profile?.phone}</span>
          </div>

          {/* Divider */}
          <div className="border-t mb-4 border-slate-100" />

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Courses */}
            <div
              className="py-3.5 px-3 rounded-2xl text-center border border-slate-100 bg-slate-50/50"
            >
              <div className="flex items-center justify-center mb-0.5">
                <span
                  className="text-[15px] font-extrabold text-slate-900"
                >
                  {profile?.totalTrips ?? 0}
                </span>
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
              >
                {t.profile.totalRides}
              </span>
            </div>

            {/* Date de naissance */}
            <div
              className="py-3.5 px-3 rounded-2xl text-center border border-slate-100 bg-slate-50/50"
            >
              <div className="flex items-center justify-center mb-0.5">
                <span
                  className="text-[13px] font-extrabold text-slate-900"
                >
                  {formatLocalizedDate(profile?.dateOfBirth, language)}
                </span>
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
              >
                {t.profile.dateOfBirth}
              </span>
            </div>
          </div>

          {/* Change password row */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center px-4 transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-100"
          >
            <span className="text-[13px] font-semibold">{t.profile.changePassword}</span>
          </button>
        </div>

        {/* ── Favorites Card ── */}
        <div
          className="rounded-[20px] px-5 py-5 bg-white shadow-sm"
        >
          <FavoriteLocationsManager />
        </div>

        {/* ── Logout Button ── */}
        <button
          onClick={logout}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100"
        >
          <LogOut className={cn('w-4 h-4', isRTL && 'rotate-180')} />
          <span className="text-[13px] font-bold">{t.nav.logout}</span>
        </button>
      </div>

      {/* ── Change Password Modal ── */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 space-y-4 shadow-2xl bg-white text-start"
            style={{
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between pb-3 border-b border-slate-100"
            >
              <h3
                className="text-base font-extrabold text-slate-900"
              >
                {t.profile.changePassword}
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-2 rounded-full transition-colors bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  {t.profile.currentPassword}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-[13px] p-3.5 rounded-2xl outline-none border border-slate-200 bg-white text-slate-900 focus:border-[#FF9900]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  {t.profile.newPassword}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-[13px] p-3.5 rounded-2xl outline-none border border-slate-200 bg-white text-slate-900 focus:border-[#FF9900]"
                  placeholder={language === 'ar' ? '8 أحرف على الأقل' : 'Minimum 8 caractères'}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full py-3.5 rounded-2xl font-extrabold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-md bg-[#FF9900] hover:bg-[#FF8800] text-black"
              >
                {changePasswordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t.profile.changePassword
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

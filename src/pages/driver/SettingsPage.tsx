import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import { useAuth } from '@/hooks/useAuth';
import {
  User,
  Car,
  Key,
  Lock,
  LogOut,
  Save,
  Loader2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverSettingsPage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['driverProfileSettings'],
    queryFn: () => DriverService.getProfile(),
  });

  const rawData = profileRes?.data?.data ?? profileRes?.data;
  const profile = rawData?.driver ?? rawData;

  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if (profile.vehicleModel) setVehicleModel(profile.vehicleModel);
      if (profile.vehiclePlate) setVehiclePlate(profile.vehiclePlate);
      if (profile.vehicleMake) setVehicleMake(profile.vehicleMake);
      if (profile.vehicleColor) setVehicleColor(profile.vehicleColor);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: {
      name?: string;
      vehicleModel?: string;
      vehiclePlate?: string;
      vehicleMake?: string;
      vehicleColor?: string;
    }) => DriverService.updateProfile(data),
    onSuccess: () => {
      toast.success('Profil mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['driverProfileSettings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      DriverService.changePassword(data),
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

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: name.trim(),
      vehicleModel: vehicleModel.trim(),
      vehiclePlate: vehiclePlate.trim(),
      vehicleMake: vehicleMake.trim(),
      vehicleColor: vehicleColor.trim(),
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-8 pt-7 px-5 max-w-lg mx-auto space-y-5 text-left">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Paramètres du Chauffeur
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Gérez votre profil public, votre véhicule et la sécurité du compte
        </p>
      </div>

      {isLoading && (
        <div className="p-5 bg-white rounded-[22px] border border-slate-100 animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
      )}

      {!isLoading && (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Personal Info Card */}
          <div className="p-5 bg-white rounded-[22px] border border-slate-100 space-y-3.5 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#FF9900]" /> Profil du chauffeur
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nom complet</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Numéro de téléphone</span>
                  <Lock className="w-3 h-3 text-slate-400" />
                </label>
                <input
                  type="text"
                  value={`+213 ${profile?.phone ?? ''}`}
                  disabled
                  className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed font-bold"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Info Card */}
          <div className="p-5 bg-white rounded-[22px] border border-slate-100 space-y-3.5 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-[#FF9900]" /> Informations du véhicule
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Marque</label>
                  <input
                    type="text"
                    placeholder="Volkswagen..."
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Modèle</label>
                  <input
                    type="text"
                    placeholder="Golf 7..."
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Couleur</label>
                  <input
                    type="text"
                    placeholder="Gris..."
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Matricule</label>
                  <input
                    type="text"
                    placeholder="029954-112-34"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full py-3.5 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Enregistrer les modifications
              </>
            )}
          </button>
        </form>
      )}

      {/* Account Security Card */}
      <div className="p-5 bg-white rounded-[22px] border border-slate-100 space-y-3.5 shadow-sm">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-[#FF9900]" /> Sécurité et Compte
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="py-3 px-3 bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-2xl border border-slate-100 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-[#FF9900]" /> Mot de passe
          </button>

          <button
            onClick={() => logout()}
            className="py-3 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-2xl border border-rose-100 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-[24px] p-5 space-y-4 shadow-2xl border border-slate-100 text-left"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Modifier le mot de passe
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  placeholder="Minimum 8 caractères"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full py-3.5 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {changePasswordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Mettre à jour le mot de passe'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

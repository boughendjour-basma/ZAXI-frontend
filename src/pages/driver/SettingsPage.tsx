import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { DriverService } from '@/services/driver.service';
import { CustomerService } from '@/services/customer.service';
import {
  User,
  Car,
  Lock,
  Key,
  LogOut,
  Save,
  Loader2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverSettingsPage() {
  const { user: authUser, logout } = useAuth();
  const queryClient = useQueryClient();

  // Profile data query
  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['driverProfileSettings'],
    queryFn: () => DriverService.getProfile(),
  });

  const profile = profileRes?.data?.data?.driver ?? (profileRes?.data as any)?.driver ?? authUser;

  // Form states
  const [name, setName] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setVehicleMake(profile.vehicleMake || '');
      setVehicleModel(profile.vehicleModel || '');
      setVehicleColor(profile.vehicleColor || '');
      setVehiclePlate(profile.vehiclePlate || '');
    }
  }, [profile]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => DriverService.updateProfile(data),
    onSuccess: () => {
      toast.success('Paramètres du profil chauffeur mis à jour !');
      queryClient.invalidateQueries({ queryKey: ['driverProfileSettings'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erreur lors de la mise à jour.';
      toast.error(msg);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: name.trim() || undefined,
      vehicleMake: vehicleMake.trim() || undefined,
      vehicleModel: vehicleModel.trim() || undefined,
      vehicleColor: vehicleColor.trim() || undefined,
      vehiclePlate: vehiclePlate.trim() || undefined,
    });
  };

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      CustomerService.changePassword(data),
    onSuccess: () => {
      toast.success('Mot de passe mis à jour avec succès !');
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
      toast.error('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
          Paramètres du Chauffeur
        </h1>
        <p className="text-xs text-[#888] mt-0.5">
          Gérez votre profil public, votre véhicule et la sécurité du compte
        </p>
      </div>

      {isLoading && (
        <div className="p-6 bg-white rounded-3xl animate-pulse space-y-4">
          <div className="h-6 bg-[#F5F5F5] rounded w-1/3" />
          <div className="h-4 bg-white rounded w-2/3" />
        </div>
      )}

      {!isLoading && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* Personal Info Card */}
          <div className="p-6 bg-white rounded-3xl border border-[#FFE0A0] space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#FF9900]" /> Profil du chauffeur
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">Nom complet</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888] flex items-center justify-between">
                  <span>Numéro de téléphone</span>
                  <Lock className="w-3 h-3 text-[#888]" />
                </label>
                <input
                  type="text"
                  value={`+213 ${profile?.phone ?? ''}`}
                  disabled
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#888] cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Info Card */}
          <div className="p-6 bg-white rounded-3xl border border-[#FFE0A0] space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4 text-[#FF9900]" /> Informations du véhicule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">Marque (ex: Volkswagen)</label>
                <input
                  type="text"
                  placeholder="Ex: Volkswagen, Renault..."
                  value={vehicleMake}
                  onChange={(e) => setVehicleMake(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">Modèle (ex: Golf 7)</label>
                <input
                  type="text"
                  placeholder="Ex: Golf 7, Clio 4..."
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">Couleur du véhicule</label>
                <input
                  type="text"
                  placeholder="Ex: Noir, Blanc, Gris..."
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">Matricule / Immatriculation</label>
                <input
                  type="text"
                  placeholder="Ex: 029954-112-34"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full py-3.5 bg-[#FF9900] text-black font-bold text-xs rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
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
      <div className="p-6 bg-white rounded-3xl border border-[#FFE0A0] space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider flex items-center gap-1.5">
          <Key className="w-4 h-4 text-[#FF9900]" /> Sécurité et Compte
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#F5F5F5] text-[#1A1A1A] font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4 text-[#FF9900]" /> Changer de mot de passe
          </button>

          <button
            onClick={() => logout()}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl">
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

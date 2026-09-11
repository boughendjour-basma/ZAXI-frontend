import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import { CustomerService } from '@/services/customer.service';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/store/languageStore';
import {
  User,
  Car,
  Key,
  LogOut,
  Save,
  Loader2,
  X,
  Phone,
  Image as ImageIcon,
  Trash2,
  Plus,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverSettingsPage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Vehicle Info
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  // Car Photos
  const [carPhotos, setCarPhotos] = useState<string[]>([]);

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['driverProfileSettings'],
    queryFn: () => DriverService.getProfile(),
  });

  const rawData = profileRes?.data?.data ?? profileRes?.data;
  const profile = (rawData as any)?.driver ?? rawData;

  useEffect(() => {
    if (profile) {
      if (profile.name || profile.driverName) setName(profile.name || profile.driverName || '');
      if (profile.phone || profile.phoneNumber) setPhone(profile.phone || profile.phoneNumber || '');
      if (profile.whatsappNumber) setWhatsappNumber(profile.whatsappNumber);
      if (profile.vehicleMake) setVehicleMake(profile.vehicleMake);
      if (profile.vehicleModel) setVehicleModel(profile.vehicleModel);
      if (profile.vehicleColor) setVehicleColor(profile.vehicleColor);
      if (profile.vehiclePlate) setVehiclePlate(profile.vehiclePlate);
      if (Array.isArray(profile.carPhotos)) setCarPhotos(profile.carPhotos);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: {
      name?: string;
      phone?: string;
      whatsappNumber?: string | null;
      vehicleMake?: string;
      vehicleModel?: string;
      vehicleColor?: string;
      vehiclePlate?: string;
      carPhotos?: string[];
    }) => DriverService.updateProfile(data),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم حفظ التعديلات بنجاح !' : 'Modifications enregistrées avec succès !');
      queryClient.invalidateQueries({ queryKey: ['driverProfileSettings'] });
      queryClient.invalidateQueries({ queryKey: ['publicDriverProfile'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t.common.error);
    },
  });

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

  // Client-side canvas compression for uploaded vehicle photos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(language === 'ar' ? 'يرجى اختيار صور فقط.' : 'Veuillez sélectionner des images uniquement.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1024;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setCarPhotos((prev) => [...prev, compressed]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setCarPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: name.trim(),
      phone: phone.trim(),
      whatsappNumber: whatsappNumber.trim() || null,
      vehicleMake: vehicleMake.trim(),
      vehicleModel: vehicleModel.trim(),
      vehicleColor: vehicleColor.trim(),
      vehiclePlate: vehiclePlate.trim(),
      carPhotos,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول.' : 'Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error(language === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' : 'Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12 pt-7 px-5 max-w-lg mx-auto space-y-5 text-start">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {t.driver.settings.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          {language === 'ar'
            ? 'تعديل معلومات الحساب، السيارة، وحساب CCP المعروض للزبائن'
            : "Gérez vos informations, votre véhicule et votre compte CCP affichés aux clients"}
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
          {/* 1. Personal & Contact Info Card */}
          <div className="p-5 bg-white rounded-[22px] border border-slate-100 space-y-3.5 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#FF9900]" /> {t.driver.settings.profileSettings}
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">{t.driver.settings.driverName}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Zakaria Boukedjar"
                  className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#FF9900]" />
                    {t.driver.settings.phone}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0555 12 34 56"
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-emerald-500" />
                    {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                  </label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="0555 12 34 56"
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Vehicle Specs Card */}
          <div className="p-5 bg-white rounded-[22px] border border-slate-100 space-y-3.5 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-[#FF9900]" /> {t.driver.settings.vehicleModel}
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === 'ar' ? 'الماركة' : 'Marque'}
                  </label>
                  <input
                    type="text"
                    placeholder="Volkswagen..."
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === 'ar' ? 'الموديل' : 'Modèle'}
                  </label>
                  <input
                    type="text"
                    placeholder="Golf 7..."
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === 'ar' ? 'اللون' : 'Couleur'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'رمادي...' : 'Gris...'}
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{t.driver.settings.vehiclePlate}</label>
                  <input
                    type="text"
                    placeholder="029954-112-34"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Vehicle Photos Card (Galerie affichée sur la page d'accueil client) */}
          <div className="p-5 bg-white rounded-[22px] border border-slate-100 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#FF9900]" />
                {language === 'ar' ? 'صور السيارة (تظهر للزبائن)' : 'Photos de la voiture (Accueil client)'}
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                {carPhotos.length} {language === 'ar' ? 'صور' : 'photo(s)'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              {language === 'ar'
                ? 'أضف صور سيارتك لعرضها مباشرة على الصفحة الرئيسية للزبائن وجذب المزيد من الحجوزات.'
                : 'Ajoutez les photos de votre véhicule pour les mettre en valeur sur la page d\'accueil des clients.'}
            </p>

            {/* Photo Thumbnails Grid */}
            {carPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {carPhotos.map((photoUrl, index) => (
                  <div key={index} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-100 shadow-sm">
                    <img
                      src={photoUrl}
                      alt={`Voiture ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-all cursor-pointer"
                      title={language === 'ar' ? 'حذف الصورة' : 'Supprimer'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <label className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-800 font-bold text-xs cursor-pointer transition-all">
              <Plus className="w-4 h-4 text-[#FF9900]" />
              <span>{language === 'ar' ? 'إضافة صور من هاتفك / حاسوبك' : 'Ajouter des photos du véhicule'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full py-4 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-[#FF9900]/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> {t.driver.settings.saveSettings}
              </>
            )}
          </button>
        </form>
      )}

      {/* Account Security Card */}
      <div className="p-5 bg-white rounded-[22px] border border-slate-100 space-y-3.5 shadow-sm">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-[#FF9900]" /> {t.driver.settings.securitySettings}
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="py-3 px-3 bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-2xl border border-slate-100 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-[#FF9900]" /> {t.driver.settings.changePassword}
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="py-3 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-2xl border border-rose-100 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> {t.nav.logout}
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
            className="w-full max-w-md bg-white rounded-[24px] p-5 space-y-4 shadow-2xl border border-slate-100 text-start"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {t.driver.settings.changePassword}
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {t.profile.currentPassword}
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
                  {t.profile.newPassword}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                  placeholder={language === 'ar' ? '8 أحرف على الأقل' : 'Minimum 8 caractères'}
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
                  language === 'ar' ? 'تحديث كلمة المرور' : 'Mettre à jour le mot de passe'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

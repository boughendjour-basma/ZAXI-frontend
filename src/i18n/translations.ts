export type Language = 'fr' | 'ar';

export interface Translations {
  nav: {
    home: string;
    rides: string;
    notifications: string;
    profile: string;
    logout: string;
    dashboard: string;
    today: string;
    history: string;
    customers: string;
    pricing: string;
    announcements: string;
    statistics: string;
    auditLogs: string;
    settings: string;
    clientTag: string;
    driverTag: string;
    language: string;
    switchLanguage: string;
  };
  header: {
    welcome: string;
    client: string;
    driver: string;
    available: string;
    unavailable: string;
  };
  home: {
    tabHome: string;
    tabFinished: string;
    tabScheduled: string;
    tabOffers: string;
    activeRideTitle: string;
    activeRideSubtitle: string;
    showRide: string;
    pendingConfirmation: string;
    pending: string;
    pickup: string;
    destination: string;
    currentPosition: string;
    notSpecified: string;
    estimatedFare: string;
    cancelBooking: string;
    finishedRidesTitle: string;
    noFinishedRides: string;
    scheduledRidesTitle: string;
    noScheduledRides: string;
    plannedOn: string;
    cityRide: string;
    scheduledRide: string;
    driverCertified: string;
    mainCardTitle: string;
    mainCardSubtitle: string;
    services: {
      city: string;
      airport: string;
      interWilayas: string;
      beaches: string;
      tourist: string;
    };
    vipTitle: string;
    vipText: string;
    bookNow: string;
    ourOffers: string;
    bookThisOffer: string;
    bookDriverModalTitle: string;
    carComfortTag: string;
    carAcWifiTag: string;
    offersFallbackTitle: string;
    offersFallbackText: string;
    currency: string;
  };
  history: {
    title: string;
    subtitle: string;
    filterAll: string;
    filterCompleted: string;
    filterCancelled: string;
    filterScheduled: string;
    noRides: string;
    noRidesDesc: string;
    bookFirstRide: string;
    statusCompleted: string;
    statusCancelled: string;
    statusInProgress: string;
    statusDriverArriving: string;
    statusPending: string;
    rideDetails: string;
    rideNumber: string;
    date: string;
    driverInfo: string;
    callDriver: string;
    rateRide: string;
    alreadyRated: string;
    ratingTitle: string;
    ratingSubtitle: string;
    ratingCommentPlaceholder: string;
    submitRating: string;
    cancelRideBtn: string;
    distance: string;
    duration: string;
    baseFare: string;
    totalPaid: string;
  };
  notifications: {
    title: string;
    subtitle: string;
    markAllRead: string;
    allCaughtUp: string;
    noNotifications: string;
    noNotificationsDesc: string;
    typeRide: string;
    typeOffer: string;
    typeSystem: string;
    types: {
      'booking:accepted': { title: string; message: string };
      'booking:cancelled': { title: string; message: string };
      'booking:driver_arriving': { title: string; message: string };
      'booking:driver_arrived': { title: string; message: string };
      'ride:started': { title: string; message: string };
      'ride:completed': { title: string; message: string };
    };
  };
  profile: {
    title: string;
    subtitle: string;
    personalInfo: string;
    fullName: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    editProfile: string;
    saveChanges: string;
    favoritesTitle: string;
    favoritesSubtitle: string;
    addFavorite: string;
    namePlaceholder: string;
    addressPlaceholder: string;
    statsTitle: string;
    totalRides: string;
    totalSpent: string;
    memberSince: string;
    securityTitle: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  booking: {
    modalTitle: string;
    instantTab: string;
    scheduledTab: string;
    pickupLabel: string;
    pickupPlaceholder: string;
    detectingGps: string;
    gpsDetected: string;
    gpsFailed: string;
    destinationLabel: string;
    destinationPlaceholder: string;
    popularDestinations: string;
    favoritesTitle: string;
    estimatedFare: string;
    estimatedDistance: string;
    estimatedDuration: string;
    routeCalculation: string;
    confirmBooking: string;
    bookingSuccess: string;
    selectDateTime: string;
    scheduleNotice: string;
    cityFlatFareNotice: string;
    outsideCityFareNotice: string;
  };
  tracking: {
    title: string;
    driverOnTheWay: string;
    driverArrived: string;
    rideInProgress: string;
    approaching: string;
    etaMinutes: string;
    driverVehicle: string;
    plateNumber: string;
    call: string;
    whatsapp: string;
    cancelRide: string;
    backToHome: string;
    liveGpsActive: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    phoneLabel: string;
    phonePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    loginBtn: string;
    noAccount: string;
    registerLink: string;
    registerTitle: string;
    registerSubtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    confirmPasswordLabel: string;
    registerBtn: string;
    alreadyHaveAccount: string;
    loginLink: string;
    forgotPasswordLink: string;
    forgotPasswordTitle: string;
    forgotPasswordSubtitle: string;
    sendResetLink: string;
    resetPasswordTitle: string;
    resetPasswordSubtitle: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    clientAccount: string;
    driverAccount: string;
    getStarted: string;
  };
  driver: {
    dashboard: {
      title: string;
      subtitle: string;
      onlineStatus: string;
      goOnline: string;
      goOffline: string;
      todayEarnings: string;
      todayRides: string;
      pendingRequests: string;
      ratingAverage: string;
      activeRideTitle: string;
      noActiveRide: string;
      recentRides: string;
      quickActions: string;
      viewToday: string;
      updatePricing: string;
      newOffer: string;
      completedRides: string;
      cancelledRides: string;
    };
    today: {
      title: string;
      subtitle: string;
      noRidesToday: string;
      noRidesTodayDesc: string;
      scheduledRides: string;
      instantRides: string;
      accept: string;
      reject: string;
      startRide: string;
      completeRide: string;
      cancel: string;
      customerPhone: string;
    };
    history: {
      title: string;
      subtitle: string;
      filterAll: string;
      filterCompleted: string;
      filterCancelled: string;
      dateRange: string;
      totalRevenue: string;
      totalDistance: string;
      tripDetails: string;
    };
    customers: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      totalCustomers: string;
      tripsCount: string;
      lastTrip: string;
      contact: string;
      noCustomers: string;
    };
    pricing: {
      title: string;
      subtitle: string;
      cityFlatFare: string;
      cityFlatFareDesc: string;
      outsideRateKm: string;
      outsideRateKmDesc: string;
      minimumFare: string;
      savePricing: string;
      pricingSaved: string;
    };
    announcements: {
      title: string;
      subtitle: string;
      createBtn: string;
      createTitle: string;
      promoTitle: string;
      promoDesc: string;
      promoPrice: string;
      promoCategory: string;
      catAirport: string;
      catBeach: string;
      catTour: string;
      catSpecial: string;
      catOther: string;
      publishBtn: string;
      deleteBtn: string;
      noAnnouncements: string;
      noAnnouncementsDesc: string;
      newAnnouncement: string;
      announcementTitle: string;
      category: string;
      announcementContent: string;
      publish: string;
    };
    statistics: {
      title: string;
      subtitle: string;
      revenueOverview: string;
      tripsOverview: string;
      weekly: string;
      monthly: string;
      completionRate: string;
      customerSatisfaction: string;
      totalRevenue: string;
      monthlyRevenue: string;
      avgDistance: string;
    };
    auditLogs: {
      title: string;
      subtitle: string;
      action: string;
      actor: string;
      timestamp: string;
      details: string;
      noLogs: string;
      noLogsDesc: string;
    };
    settings: {
      title: string;
      subtitle: string;
      profileSettings: string;
      driverName: string;
      phone: string;
      whatsapp: string;
      vehicleModel: string;
      vehiclePlate: string;
      workingHours: string;
      bio: string;
      saveSettings: string;
      securitySettings: string;
      changePassword: string;
      settingsUpdated: string;
    };
  };
  common: {
    cancel: string;
    confirm: string;
    save: string;
    close: string;
    loading: string;
    success: string;
    error: string;
    completed: string;
    scheduled: string;
    french: string;
    arabic: string;
    edit: string;
    delete: string;
    back: string;
    search: string;
    viewAll: string;
    currency: string;
    minutes: string;
    kilometers: string;
  };
}

export const translations: Record<Language, Translations> = {
  fr: {
    nav: {
      home: 'Accueil',
      rides: 'Mes courses',
      notifications: 'Notifications',
      profile: 'Profil',
      logout: 'Déconnexion',
      dashboard: 'Tableau de bord',
      today: "Aujourd'hui",
      history: 'Historique',
      customers: 'Clients',
      pricing: 'Tarification',
      announcements: 'Annonces',
      statistics: 'Statistiques',
      auditLogs: "Logs d'audit",
      settings: 'Paramètres',
      clientTag: 'Client',
      driverTag: 'Chauffeur',
      language: 'Langue',
      switchLanguage: 'العربية',
    },
    header: {
      welcome: 'Bienvenue',
      client: 'Client',
      driver: 'Chauffeur',
      available: 'Disponible',
      unavailable: 'Indisponible',
    },
    home: {
      tabHome: 'Accueil',
      tabFinished: 'Reservations finis',
      tabScheduled: 'Reservations programmes',
      tabOffers: 'Nos offres',
      activeRideTitle: 'Course en cours',
      activeRideSubtitle: 'Touchez pour ouvrir la carte de suivi en direct',
      showRide: 'Afficher',
      pendingConfirmation: 'En attente de confirmation',
      pending: 'En attente',
      pickup: 'Départ',
      destination: 'Destination',
      currentPosition: 'Position Actuelle',
      notSpecified: 'Non spécifiée',
      estimatedFare: 'Tarif estimé',
      cancelBooking: 'Annuler la réservation',
      finishedRidesTitle: 'Reservations finis',
      noFinishedRides: 'Aucune réservation terminée pour le moment.',
      scheduledRidesTitle: 'Réservations programmées',
      noScheduledRides: 'Aucune réservation programmée à venir.',
      plannedOn: 'Prévue le',
      cityRide: 'Course en ville',
      scheduledRide: 'Course programmée',
      driverCertified: 'Chauffeur privé VTC certifié • Bordj Bou Arréridj',
      mainCardTitle: 'Votre chauffeur privé à Bordj Bou Arréridj',
      mainCardSubtitle: 'Pour tous vos déplacements locaux et longues distances :',
      services: {
        city: 'courses en ville',
        airport: 'transferts aéroport',
        interWilayas: 'trajets inter-wilayas',
        beaches: 'excursions vers les plages',
        tourist: 'les sites touristiques.',
      },
      vipTitle: "Service d'Excellence Personnalisé",
      vipText: "Profitez d'un service sur-mesure avec mise à disposition à la journée pour vous accompagner et assurer votre retour en toute sérénité.",
      bookNow: 'Reserver maintenant',
      ourOffers: 'Nos offres',
      bookThisOffer: 'Réserver cette offre',
      bookDriverModalTitle: 'Réserver votre chauffeur VTC',
      carComfortTag: 'Golf 7 — Confort VIP',
      carAcWifiTag: 'Climatisation & Wifi',
      offersFallbackTitle: 'Service de Transport VIP & Excursions',
      offersFallbackText: 'Disponibilité 7j/7 pour vos déplacements urbains, transferts aéroport et trajets inter-wilayas.',
      currency: 'DA',
    },
    history: {
      title: 'Historique des courses',
      subtitle: 'Consultez le récapitulatif de tous vos trajets passés et programmés.',
      filterAll: 'Toutes',
      filterCompleted: 'Terminées',
      filterCancelled: 'Annulées',
      filterScheduled: 'Programmées',
      noRides: 'Aucune course trouvée',
      noRidesDesc: 'Vous n’avez pas encore effectué de course dans cette catégorie.',
      bookFirstRide: 'Réserver une course',
      statusCompleted: 'Course terminée',
      statusCancelled: 'Course annulée',
      statusInProgress: 'En cours',
      statusDriverArriving: 'Chauffeur en route',
      statusPending: 'En attente',
      rideDetails: 'Détails de la course',
      rideNumber: 'Course n°',
      date: 'Date & Heure',
      driverInfo: 'Informations chauffeur',
      callDriver: 'Appeler le chauffeur',
      rateRide: 'Évaluer la course',
      alreadyRated: 'Course évaluée',
      ratingTitle: 'Votre avis compte',
      ratingSubtitle: 'Comment s’est déroulée votre course avec Zakaria ?',
      ratingCommentPlaceholder: 'Laissez un commentaire (optionnel)...',
      submitRating: 'Envoyer mon avis',
      cancelRideBtn: 'Annuler la course',
      distance: 'Distance parcourue',
      duration: 'Durée estimée',
      baseFare: 'Tarif de base',
      totalPaid: 'Total réglé',
    },
    notifications: {
      title: 'Notifications',
      subtitle: 'Restez informé de vos réservations, offres exclusives et mises à jour.',
      markAllRead: 'Tout marquer comme lu',
      allCaughtUp: 'Vous êtes à jour !',
      noNotifications: 'Aucune notification',
      noNotificationsDesc: 'Vous recevrez ici les confirmations de courses et les actualités.',
      typeRide: 'Course',
      typeOffer: 'Offre spéciale',
      typeSystem: 'Système',
      types: {
        'booking:accepted': {
          title: 'Réservation acceptée',
          message: 'Votre chauffeur a accepté la course et est en route !',
        },
        'booking:cancelled': {
          title: 'Réservation annulée',
          message: 'Votre réservation a été annulée.',
        },
        'booking:driver_arriving': {
          title: 'Chauffeur en route',
          message: 'Votre chauffeur se dirige vers votre lieu de prise en charge.',
        },
        'booking:driver_arrived': {
          title: 'Chauffeur arrivé',
          message: 'Votre chauffeur est arrivé au point de rendez-vous !',
        },
        'ride:started': {
          title: 'Course démarrée',
          message: 'Votre course a démarré. Bon trajet avec ZAXI !',
        },
        'ride:completed': {
          title: 'Course terminée',
          message: "Votre course est terminée. Merci d'avoir utilisé ZAXI !",
        },
      },
    },
    profile: {
      title: 'Mon Profil',
      subtitle: 'Gérez vos coordonnées, lieux favoris et préférences personnelles.',
      personalInfo: 'Informations personnelles',
      fullName: 'Nom complet',
      phone: 'Numéro de téléphone',
      email: 'Adresse email',
      dateOfBirth: 'Date de naissance',
      editProfile: 'Modifier le profil',
      saveChanges: 'Enregistrer les modifications',
      favoritesTitle: 'Mes adresses favorites',
      favoritesSubtitle: 'Enregistrez vos destinations fréquentes (Maison, Travail...)',
      addFavorite: 'Ajouter une adresse',
      namePlaceholder: 'Ex: Maison, Bureau...',
      addressPlaceholder: 'Adresse complète...',
      statsTitle: 'Mes statistiques',
      totalRides: 'Courses effectuées',
      totalSpent: 'Total dépensé',
      memberSince: 'Membre depuis',
      securityTitle: 'Sécurité & Mot de passe',
      changePassword: 'Changer de mot de passe',
      currentPassword: 'Mot de passe actuel',
      newPassword: 'Nouveau mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
    },
    booking: {
      modalTitle: 'Réserver un chauffeur VTC',
      instantTab: 'À l’instant',
      scheduledTab: 'À une date précise',
      pickupLabel: 'Lieu de départ',
      pickupPlaceholder: 'Rechercher votre lieu de départ...',
      detectingGps: 'Détection de votre position GPS...',
      gpsDetected: 'Position actuelle détectée',
      gpsFailed: 'Position non détectée. Veuillez saisir l’adresse.',
      destinationLabel: 'Destination',
      destinationPlaceholder: 'Rechercher une destination...',
      popularDestinations: 'Destinations populaires',
      favoritesTitle: 'Vos favoris',
      estimatedFare: 'Tarif estimé',
      estimatedDistance: 'Distance estimée',
      estimatedDuration: 'Durée estimée',
      routeCalculation: 'Calcul de l’itinéraire en cours...',
      confirmBooking: 'Confirmer la réservation',
      bookingSuccess: 'Réservation confirmée avec succès !',
      selectDateTime: 'Choisir la date et l’heure',
      scheduleNotice: 'Le chauffeur sera averti pour effectuer la course au moment indiqué.',
      cityFlatFareNotice: 'Course intra-muros à tarif forfaitaire',
      outsideCityFareNotice: 'Tarif kilométrique interurbain calculé avec précision',
    },
    tracking: {
      title: 'Suivi de course en direct',
      driverOnTheWay: 'Zakaria arrive vers votre position',
      driverArrived: 'Zakaria est arrivé au point de rendez-vous',
      rideInProgress: 'Course en cours vers votre destination',
      approaching: 'Arrivée imminente',
      etaMinutes: 'min restantes',
      driverVehicle: 'Véhicule',
      plateNumber: 'Immatriculation',
      call: 'Appeler',
      whatsapp: 'WhatsApp',
      cancelRide: 'Annuler la course',
      backToHome: 'Retour à l’accueil',
      liveGpsActive: 'Signal GPS en direct',
    },
    auth: {
      loginTitle: 'Connexion',
      loginSubtitle: 'Accédez à votre espace personnel ZAXI.',
      phoneLabel: 'Numéro de téléphone',
      phonePlaceholder: '0555 12 34 56',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: '••••••••',
      loginBtn: 'Se connecter',
      noAccount: 'Vous n’avez pas encore de compte ?',
      registerLink: 'Créer un compte',
      registerTitle: 'Créer un compte',
      registerSubtitle: 'Rejoignez ZAXI et réservez vos trajets en toute simplicité.',
      nameLabel: 'Nom et Prénom',
      namePlaceholder: 'Ex: Mohamed Benali',
      confirmPasswordLabel: 'Confirmer le mot de passe',
      registerBtn: 'Créer mon compte',
      alreadyHaveAccount: 'Vous possédez déjà un compte ?',
      loginLink: 'Se connecter',
      forgotPasswordLink: 'Mot de passe oublié ?',
      forgotPasswordTitle: 'Récupération de mot de passe',
      forgotPasswordSubtitle: 'Saisissez votre numéro pour réinitialiser votre accès.',
      sendResetLink: 'Envoyer les instructions',
      resetPasswordTitle: 'Nouveau mot de passe',
      resetPasswordSubtitle: 'Définissez votre nouveau mot de passe sécurisé.',
      welcomeTitle: 'Bienvenue sur ZAXI',
      welcomeSubtitle: 'Votre service de transport privé VTC d’excellence.',
      clientAccount: 'Espace Client',
      driverAccount: 'Espace Chauffeur',
      getStarted: 'Commencer',
    },
    driver: {
      dashboard: {
        title: 'Tableau de bord Chauffeur',
        subtitle: 'Suivez vos courses du jour, revenus et disponibilité en temps réel.',
        onlineStatus: 'Statut de service',
        goOnline: 'Passer en ligne',
        goOffline: 'Passer hors ligne',
        todayEarnings: 'Revenus du jour',
        todayRides: 'Courses aujourd’hui',
        pendingRequests: 'Demandes en attente',
        ratingAverage: 'Note moyenne',
        activeRideTitle: 'Course active en cours',
        noActiveRide: 'Aucune course active pour le moment.',
        recentRides: 'Dernières courses',
        quickActions: 'Actions rapides',
        viewToday: 'Voir les courses du jour',
        updatePricing: 'Ajuster les tarifs',
        newOffer: 'Publier une offre',
        completedRides: 'Courses terminées',
        cancelledRides: 'Courses annulées',
      },
      today: {
        title: 'Courses d’aujourd’hui',
        subtitle: 'Gérez vos demandes de courses instantanées et réservations programmées.',
        noRidesToday: 'Aucune course programmée pour aujourd\'hui.',
        noRidesTodayDesc: 'Les nouvelles demandes apparaîtront ici en temps réel.',
        scheduledRides: 'Réservations programmées',
        instantRides: 'Demandes immédiates',
        accept: 'Accepter',
        reject: 'Refuser',
        startRide: 'Démarrer la course',
        completeRide: 'Terminer la course',
        cancel: 'Annuler',
        customerPhone: 'Téléphone client',
      },
      history: {
        title: 'Historique des courses',
        subtitle: 'Consultez l’ensemble de vos courses réalisées et le détail des gains.',
        filterAll: 'Toutes les courses',
        filterCompleted: 'Terminées',
        filterCancelled: 'Annulées',
        dateRange: 'Période',
        totalRevenue: 'Chiffre d’affaires total',
        totalDistance: 'Kilomètres parcourus',
        tripDetails: 'Détail du trajet',
      },
      customers: {
        title: 'Répertoire Clients',
        subtitle: 'Retrouvez vos clients fréquents et l’historique de leurs trajets.',
        searchPlaceholder: 'Rechercher par nom ou numéro...',
        totalCustomers: 'Clients enregistrés',
        tripsCount: 'trajets effectués',
        lastTrip: 'Dernier trajet',
        contact: 'Contacter',
        noCustomers: 'Aucun client trouvé',
      },
      pricing: {
        title: 'Configuration des Tarifs',
        subtitle: 'Définissez la tarification forfaitaire intra-muros et le barème kilométrique.',
        cityFlatFare: 'Tarif forfaitaire intra-muros',
        cityFlatFareDesc: 'Prix fixe appliqué aux courses à l’intérieur de Bordj Bou Arréridj.',
        outsideRateKm: 'Tarif kilométrique inter-wilayas',
        outsideRateKmDesc: 'Prix par kilomètre pour les trajets hors wilaya et transferts aéroport.',
        minimumFare: 'Course minimale',
        savePricing: 'Mettre à jour les tarifs',
        pricingSaved: 'Grille tarifaire enregistrée avec succès.',
      },
      announcements: {
        title: 'Offres & Annonces',
        subtitle: 'Diffusez vos tarifs spéciaux (Aéroports, Plages, Excursions VIP).',
        createBtn: 'Créer une offre',
        createTitle: 'Nouvelle annonce promotionnelle',
        promoTitle: 'Titre de l’offre',
        promoDesc: 'Description détaillée',
        promoPrice: 'Tarif proposé (DA)',
        promoCategory: 'Catégorie',
        catAirport: 'Transfert Aéroport',
        catBeach: 'Excursion Plage',
        catTour: 'Circuit Touristique',
        catSpecial: 'Offre Spéciale',
        catOther: 'Autre prestation',
        publishBtn: 'Publier l’annonce',
        deleteBtn: 'Supprimer',
        noAnnouncements: 'Aucune annonce active actuellement.',
        noAnnouncementsDesc: 'Publiez vos offres spéciales pour attirer plus de clients.',
        newAnnouncement: 'Nouvelle annonce',
        announcementTitle: 'Titre de l\'annonce',
        category: 'Catégorie',
        announcementContent: 'Description de l\'offre',
        publish: 'Publier l\'annonce',
      },
      statistics: {
        title: 'Statistiques & Performance',
        subtitle: 'Analysez l’évolution de votre activité, vos revenus et la satisfaction client.',
        revenueOverview: 'Évolution du Chiffre d’Affaires',
        tripsOverview: 'Volume de Courses',
        weekly: 'Cette semaine',
        monthly: 'Ce mois-ci',
        completionRate: 'Taux de réussite des courses',
        customerSatisfaction: 'Indice de satisfaction client',
        totalRevenue: 'Chiffre d’affaires total',
        monthlyRevenue: 'Revenus du mois',
        avgDistance: 'Distance moyenne',
      },
      auditLogs: {
        title: 'Journal d’Audit',
        subtitle: 'Historique des connexions, modifications tarifaires et actions administratives.',
        action: 'Action',
        actor: 'Utilisateur',
        timestamp: 'Date & Heure',
        details: 'Détails',
        noLogs: 'Aucun journal disponible.',
        noLogsDesc: 'Les activités système et connexions apparaîtront ici.',
      },
      settings: {
        title: 'Paramètres du Profil',
        subtitle: 'Configurez vos informations professionnelles, véhicule et coordonnées.',
        profileSettings: 'Profil Chauffeur',
        driverName: 'Nom affiché',
        phone: 'Numéro d’appel',
        whatsapp: 'Numéro WhatsApp',
        vehicleModel: 'Modèle du véhicule',
        vehiclePlate: 'Numéro de plaque',
        workingHours: 'Horaires d’activité',
        bio: 'Présentation professionnelle',
        saveSettings: 'Enregistrer les paramètres',
        securitySettings: 'Sécurité du compte',
        changePassword: 'Changer de mot de passe',
        settingsUpdated: 'Profil mis à jour avec succès.',
      },
    },
    common: {
      cancel: 'Annuler',
      confirm: 'Confirmer',
      save: 'Enregistrer',
      close: 'Fermer',
      loading: 'Chargement...',
      success: 'Succès',
      error: 'Erreur',
      completed: 'Terminée',
      scheduled: 'Programmée',
      french: 'Français',
      arabic: 'العربية',
      edit: 'Modifier',
      delete: 'Supprimer',
      back: 'Retour',
      search: 'Rechercher',
      viewAll: 'Voir tout',
      currency: 'DA',
      minutes: 'min',
      kilometers: 'km',
    },
  },
  ar: {
    nav: {
      home: 'الرئيسية',
      rides: 'رحلاتي',
      notifications: 'الإشعارات',
      profile: 'الملف الشخصي',
      logout: 'تسجيل الخروج',
      dashboard: 'لوحة التحكم',
      today: 'اليوم',
      history: 'السجل',
      customers: 'الزبائن',
      pricing: 'التسعير',
      announcements: 'الإعلانات والعروض',
      statistics: 'الإحصائيات',
      auditLogs: 'سجل العمليات',
      settings: 'الإعدادات',
      clientTag: 'زبون',
      driverTag: 'سائق',
      language: 'اللغة',
      switchLanguage: 'Français',
    },
    header: {
      welcome: 'مرحباً',
      client: 'الزبون',
      driver: 'السائق',
      available: 'متاح الآن',
      unavailable: 'غير متاح',
    },
    home: {
      tabHome: 'الرئيسية',
      tabFinished: 'الرحلات المكتملة',
      tabScheduled: 'الرحلات المبرمجة',
      tabOffers: 'عروضنا',
      activeRideTitle: 'رحلة جارية',
      activeRideSubtitle: 'اضغط لفتح خريطة التتبع المباشر',
      showRide: 'عرض',
      pendingConfirmation: 'في انتظار تأكيد السائق',
      pending: 'قيد الانتظار',
      pickup: 'نقطة الانطلاق',
      destination: 'الوجهة',
      currentPosition: 'الموقع الحالي',
      notSpecified: 'غير محددة',
      estimatedFare: 'السعر التقديري',
      cancelBooking: 'إلغاء الحجز',
      finishedRidesTitle: 'الرحلات المنتهية',
      noFinishedRides: 'لا توجد رحلات منتهية حتى الآن.',
      scheduledRidesTitle: 'الرحلات المبرمجة',
      noScheduledRides: 'لا توجد رحلات مبرمجة قادمة.',
      plannedOn: 'الموعد المحدد',
      cityRide: 'رحلة داخل المدينة',
      scheduledRide: 'رحلة مبرمجة',
      driverCertified: 'سائق خاص VTC معتمد • برج بوعريريج',
      mainCardTitle: 'سائقك الخاص في برج بوعريريج',
      mainCardSubtitle: 'لكل تنقلاتكم المحلية والمسافات الطويلة:',
      services: {
        city: 'تنقلات داخل المدينة',
        airport: 'نقل وتوصيل إلى المطارات',
        interWilayas: 'رحلات بين الولايات',
        beaches: 'رحلات سياحية إلى الشواطئ',
        tourist: 'زيارة المعالم والمواقع السياحية.',
      },
      vipTitle: 'خدمة راقية ومخصصة',
      vipText: 'تمتع بخدمة مصممة حسب احتياجاتك مع إمكانية حجز السيارة لليوم بالكامل لمرافقتكم وضمان عودتكم بكل راحة وأمان.',
      bookNow: 'احجز الآن',
      ourOffers: 'عروضنا المميزة',
      bookThisOffer: 'حجز هذا العرض',
      bookDriverModalTitle: 'حجز سائقك الخاص VTC',
      carComfortTag: 'Golf 7 — راحة VIP',
      carAcWifiTag: 'مكيف هواء وواي فاي',
      offersFallbackTitle: 'خدمة النقل VIP والرحلات',
      offersFallbackText: 'خدمة متوفرة 7/7 لتنقلاتكم الحضرية، رحلات المطار والرحلات بين مختلف الولايات.',
      currency: 'د.ج',
    },
    history: {
      title: 'سجل الرحلات',
      subtitle: 'عرض ملخص لجميع رحلاتك السابقة والمبرمجة.',
      filterAll: 'الكل',
      filterCompleted: 'المكتملة',
      filterCancelled: 'الملغاة',
      filterScheduled: 'المبرمجة',
      noRides: 'لا توجد رحلات',
      noRidesDesc: 'لم تقم بأي رحلة في هذا القسم حتى الآن.',
      bookFirstRide: 'حجز رحلة جديدة',
      statusCompleted: 'رحلة مكتملة',
      statusCancelled: 'رحلة ملغاة',
      statusInProgress: 'جارية الآن',
      statusDriverArriving: 'السائق في الطريق',
      statusPending: 'قيد الانتظار',
      rideDetails: 'تفاصيل الرحلة',
      rideNumber: 'رحلة رقم',
      date: 'التاريخ والوقت',
      driverInfo: 'معلومات السائق',
      callDriver: 'الاتصال بالسائق',
      rateRide: 'تقييم الرحلة',
      alreadyRated: 'تم تقييم الرحلة',
      ratingTitle: 'رأيك يهمنا',
      ratingSubtitle: 'كيف كانت تجربتك مع السائق زكريا ؟',
      ratingCommentPlaceholder: 'أضف تعليقاً حول تجربتك (اختياري)...',
      submitRating: 'إرسال التقييم',
      cancelRideBtn: 'إلغاء الرحلة',
      distance: 'المسافة المقطوعة',
      duration: 'الوقت المقدر',
      baseFare: 'السعر الأساسي',
      totalPaid: 'المبلغ الإجمالي',
    },
    notifications: {
      title: 'الإشعارات',
      subtitle: 'ابق على اطلاع دائم بحجوزاتك وأحدث العروض والتنبيهات.',
      markAllRead: 'تحديد الكل كمقروء',
      allCaughtUp: 'لقد قرأت جميع الإشعارات !',
      noNotifications: 'لا توجد إشعارات',
      noNotificationsDesc: 'ستصلك هنا تأكيدات الحجوزات والعروض الخاصة.',
      typeRide: 'رحلة',
      typeOffer: 'عرض خاص',
      typeSystem: 'النظام',
      types: {
        'booking:accepted': {
          title: 'تم قبول الحجز',
          message: 'قبل سائقك الرحلة وهو في الطريق إليك !',
        },
        'booking:cancelled': {
          title: 'تم إلغاء الحجز',
          message: 'تم إلغاء حجزك.',
        },
        'booking:driver_arriving': {
          title: 'السائق في الطريق',
          message: 'سائقك في طريقه إلى نقطة الانطلاق.',
        },
        'booking:driver_arrived': {
          title: 'وصل السائق',
          message: 'وصل سائقك إلى نقطة اللقاء !',
        },
        'ride:started': {
          title: 'انطلقت الرحلة',
          message: 'رحلتك انطلقت. رحلة موفقة مع ZAXI !',
        },
        'ride:completed': {
          title: 'اكتملت الرحلة',
          message: 'اكتملت رحلتك. شكراً لاستخدامك ZAXI !',
        },
      },
    },
    profile: {
      title: 'الملف الشخصي',
      subtitle: 'إدارة معلوماتك الشخصية، الأماكن المفضلة وإعدادات الحساب.',
      personalInfo: 'المعلومات الشخصية',
      fullName: 'الاسم الكامل',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      dateOfBirth: 'تاريخ الميلاد',
      editProfile: 'تعديل الملف',
      saveChanges: 'حفظ التعديلات',
      favoritesTitle: 'الأماكن المفضلة',
      favoritesSubtitle: 'احفظ وجهاتك المتكررة (المنزل، العمل...) لسهولة الوصول.',
      addFavorite: 'إضافة مكان مفضل',
      namePlaceholder: 'مثال: المنزل، العمل...',
      addressPlaceholder: 'العنوان الكامل...',
      statsTitle: 'إحصائياتي',
      totalRides: 'الرحلات المنجزة',
      totalSpent: 'إجمالي الإنفاق',
      memberSince: 'عضو منذ',
      securityTitle: 'الأمان وكلمة المرور',
      changePassword: 'تغيير كلمة المرور',
      currentPassword: 'كلمة المرور الحالية',
      newPassword: 'كلمة المرور الجديدة',
      confirmPassword: 'تأكيد كلمة المرور',
    },
    booking: {
      modalTitle: 'حجز سائق خاص VTC',
      instantTab: 'الآن فوراً',
      scheduledTab: 'موعد مبرمج',
      pickupLabel: 'نقطة الانطلاق',
      pickupPlaceholder: 'حدد مكان الانطلاق...',
      detectingGps: 'جاري تحديد موقعك عبر GPS...',
      gpsDetected: 'تم تحديد موقعك الحالي',
      gpsFailed: 'تعذر تحديد الموقع. يرجى إدخال العنوان يدوياً.',
      destinationLabel: 'الوجهة',
      destinationPlaceholder: 'ابحث عن وجهتك أو اختر مدينة...',
      popularDestinations: 'وجهات شائعة',
      favoritesTitle: 'الأماكن المفضلة لديك',
      estimatedFare: 'السعر التقديري',
      estimatedDistance: 'المسافة التقديرية',
      estimatedDuration: 'الوقت المتوقع',
      routeCalculation: 'جاري حساب المسار والتسعيرة...',
      confirmBooking: 'تأكيد الحجز',
      bookingSuccess: 'تم تأكيد حجز الرحلة بنجاح !',
      selectDateTime: 'اختر التاريخ والتوقيت',
      scheduleNotice: 'سيتم إشعار السائق ليكون متواجداً في الموعد المحدد بدقة.',
      cityFlatFareNotice: 'رحلة داخل المدينة بسعر ثابت ومناسب',
      outsideCityFareNotice: 'تسعيرة دقيقة بالكيلومتر للرحلات بين الولايات والمطارات',
    },
    tracking: {
      title: 'تتبع الرحلة المباشر',
      driverOnTheWay: 'السائق زكريا في الطريق إلى موقعك',
      driverArrived: 'وصل السائق زكريا إلى نقطة اللقاء',
      rideInProgress: 'الرحلة جارية نحو وجهتك',
      approaching: 'اقترب الوصول',
      etaMinutes: 'دقيقة متبقية',
      driverVehicle: 'نوع السيارة',
      plateNumber: 'رقم لوحة الترقيم',
      call: 'اتصال هاتف',
      whatsapp: 'واتساب',
      cancelRide: 'إلغاء الرحلة',
      backToHome: 'العودة للرئيسية',
      liveGpsActive: 'إشارة GPS مباشرة',
    },
    auth: {
      loginTitle: 'تسجيل الدخول',
      loginSubtitle: 'سجل دخولك إلى حسابك في منصة ZAXI.',
      phoneLabel: 'رقم الهاتف',
      phonePlaceholder: '0555 12 34 56',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      loginBtn: 'دخول',
      noAccount: 'ليس لديك حساب بعد ؟',
      registerLink: 'إنشاء حساب جديد',
      registerTitle: 'إنشاء حساب جديد',
      registerSubtitle: 'انضم إلى ZAXI واحجز رحلاتك بكل سهولة وأمان.',
      nameLabel: 'الاسم واللقب',
      namePlaceholder: 'مثال: محمد بن علي',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      registerBtn: 'إنشاء الحساب',
      alreadyHaveAccount: 'لديك حساب بالفعل ؟',
      loginLink: 'تسجيل الدخول',
      forgotPasswordLink: 'نسيت كلمة المرور ؟',
      forgotPasswordTitle: 'استرجاع كلمة المرور',
      forgotPasswordSubtitle: 'أدخل رقم هاتفك لإعادة تعيين كلمة المرور.',
      sendResetLink: 'إرسال التعليمات',
      resetPasswordTitle: 'كلمة مرور جديدة',
      resetPasswordSubtitle: 'عيّن كلمة مرور جديدة وقوية لحسابك.',
      welcomeTitle: 'مرحباً بكم في ZAXI',
      welcomeSubtitle: 'خدمتكم الراقية للنقل الخاص VTC في الجزائر.',
      clientAccount: 'فضاء الزبائن',
      driverAccount: 'فضاء السائق',
      getStarted: 'ابدأ الآن',
    },
    driver: {
      dashboard: {
        title: 'لوحة تحكم السائق',
        subtitle: 'متابعة رحلات اليوم، الأرباح وحالة الاتصال المباشر.',
        onlineStatus: 'حالة العمل',
        goOnline: 'متاح للعمل (متصل)',
        goOffline: 'غير متاح (غير متصل)',
        todayEarnings: 'أرباح اليوم',
        todayRides: 'رحلات اليوم',
        pendingRequests: 'طلبات في الانتظار',
        ratingAverage: 'متوسط التقييم',
        activeRideTitle: 'الرحلة النشطة الحالية',
        noActiveRide: 'لا توجد رحلة نشطة في الوقت الحالي.',
        recentRides: 'آخر الرحلات',
        quickActions: 'إجراءات سريعة',
        viewToday: 'عرض رحلات اليوم',
        updatePricing: 'تعديل التسعيرة',
        newOffer: 'نشر عرض جديد',
        completedRides: 'الرحلات المكتملة',
        cancelledRides: 'الرحلات الملغاة',
      },
      today: {
        title: 'رحلات اليوم',
        subtitle: 'إدارة وتتبع الطلبات المباشرة والحجوزات المبرمجة لليوم.',
        noRidesToday: 'لا توجد رحلات مجدولة لليوم.',
        noRidesTodayDesc: 'ستظهر الطلبات الجديدة هنا فوراً.',
        scheduledRides: 'حجوزات مبرمجة',
        instantRides: 'طلبات فورية',
        accept: 'قبول الطلب',
        reject: 'رفض',
        startRide: 'بدء الرحلة',
        completeRide: 'إنهاء الرحلة',
        cancel: 'إلغاء',
        customerPhone: 'هاتف الزبون',
      },
      history: {
        title: 'سجل رحلات السائق',
        subtitle: 'عرض كامل لجميع الرحلات المنجزة مع تفاصيل المداخيل.',
        filterAll: 'جميع الرحلات',
        filterCompleted: 'المكتملة',
        filterCancelled: 'الملغاة',
        dateRange: 'الفترة الزمنية',
        totalRevenue: 'إجمالي المداخيل',
        totalDistance: 'إجمالي الكيلومترات',
        tripDetails: 'تفاصيل المسار',
      },
      customers: {
        title: 'دليل الزبائن',
        subtitle: 'قائمة الزبائن المسجلين وسجل رحلاتهم السابقة.',
        searchPlaceholder: 'بحث بالاسم أو رقم الهاتف...',
        totalCustomers: 'إجمالي الزبائن',
        tripsCount: 'رحلات منجزة',
        lastTrip: 'آخر رحلة',
        contact: 'تواصل',
        noCustomers: 'لا يوجد زبائن حتى الآن.',
      },
      pricing: {
        title: 'إعدادات التسعيرة',
        subtitle: 'تحديد السعر الثابت داخل المدينة والتعريفة الكيلومترية.',
        cityFlatFare: 'السعر الثابت داخل المدينة',
        cityFlatFareDesc: 'تسعيرة موحدة وثابتة لجميع الرحلات داخل برج بوعريريج.',
        outsideRateKm: 'سعر الكيلومتر خارج الولاية',
        outsideRateKmDesc: 'السعر المعتمد لكل كيلومتر للرحلات الطويلة والمطارات.',
        minimumFare: 'أدنى سعر للرحلة',
        savePricing: 'حفظ وتحديث الأسعار',
        pricingSaved: 'تم حفظ التسعيرة الجديدة بنجاح.',
      },
      announcements: {
        title: 'العروض والإعلانات',
        subtitle: 'نشر وتحديث العروض الترويجية والرحلات الخاصة (مطارات، شواطئ، سياحة).',
        createBtn: 'إضافة عرض جديد',
        createTitle: 'إنشاء إعلان ترويجي',
        promoTitle: 'عنوان العرض',
        promoDesc: 'الوصف والتفاصيل',
        promoPrice: 'السعر المقترح (د.ج)',
        promoCategory: 'التصنيف',
        catAirport: 'نقل للمطار',
        catBeach: 'رحلات الشواطئ',
        catTour: 'جولات سياحية',
        catSpecial: 'عرض خاص',
        catOther: 'خدمة أخرى',
        publishBtn: 'نشر العرض',
        deleteBtn: 'حذف',
        noAnnouncements: 'لا توجد عروض منشورة حالياً.',
        noAnnouncementsDesc: 'انشر عروضك الخاصة لجذب المزيد من الزبائن.',
        newAnnouncement: 'إعلان جديد',
        announcementTitle: 'عنوان الإعلان',
        category: 'التصنيف',
        announcementContent: 'وصف العرض',
        publish: 'نشر الإعلان',
      },
      statistics: {
        title: 'الإحصائيات والأداء',
        subtitle: 'تحليل تطور النشاط، المداخيل الشهرية ومعدلات رضا الزبائن.',
        revenueOverview: 'تطور المداخيل',
        tripsOverview: 'عدد الرحلات',
        weekly: 'هذا الأسبوع',
        monthly: 'هذا الشهر',
        completionRate: 'نسبة إتمام الرحلات',
        customerSatisfaction: 'مؤشر رضا الزبائن',
        totalRevenue: 'إجمالي المداخيل',
        monthlyRevenue: 'مداخيل الشهر',
        avgDistance: 'متوسط المسافة',
      },
      auditLogs: {
        title: 'سجل العمليات والأمان',
        subtitle: 'سجل عمليات تسجيل الدخول، تعديلات الأسعار والإجراءات الإدارية.',
        action: 'العملية',
        actor: 'المستخدم',
        timestamp: 'التاريخ والوقت',
        details: 'التفاصيل',
        noLogs: 'لا توجد سجلات متاحة.',
        noLogsDesc: 'ستظهر هنا عمليات النظام وتسجيلات الدخول.',
      },
      settings: {
        title: 'إعدادات الحساب والملف',
        subtitle: 'تعديل بيانات السائق المهنية، تفاصيل السيارة وأوقات العمل.',
        profileSettings: 'ملف السائق',
        driverName: 'الاسم الظاهر',
        phone: 'رقم الهاتف الرئيسي',
        whatsapp: 'رقم الواتساب',
        vehicleModel: 'نوع السيارة',
        vehiclePlate: 'رقم اللوحة',
        workingHours: 'ساعات العمل',
        bio: 'نبذة تعريفية',
        saveSettings: 'حفظ الإعدادات',
        securitySettings: 'أمان الحساب',
        changePassword: 'تغيير كلمة المرور',
        settingsUpdated: 'تم تحديث بيانات الملف بنجاح.',
      },
    },
    common: {
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      save: 'حفظ',
      close: 'إغلاق',
      loading: 'جاري التحميل...',
      success: 'تم بنجاح',
      error: 'حدث خطأ',
      completed: 'مكتملة',
      scheduled: 'مبرمجة',
      french: 'Français',
      arabic: 'العربية',
      edit: 'تعديل',
      delete: 'حذف',
      back: 'رجوع',
      search: 'بحث',
      viewAll: 'عرض الكل',
      currency: 'د.ج',
      minutes: 'دقيقة',
      kilometers: 'كم',
    },
  },
};

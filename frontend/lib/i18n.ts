export type LanguageCode = 'en' | 'hi' | 'mr';

export interface Translations {
  settings: string;
  settingsSubtitle: string;
  saveChanges: string;
  saving: string;
  savedSuccessfully: string;
  resetDefaults: string;
  resetConfirm: string;
  searchSettings: string;
  
  // Section Navigation
  navProfile: string;
  navAppearance: string;
  navAccessibility: string;
  navNotifications: string;
  navLanguage: string;
  navPrivacy: string;
  navAccounts: string;
  navDataStorage: string;
  navSearch: string;
  navPwa: string;
  navHelp: string;
  navAccountMgmt: string;

  // Appearance
  fontFamily: string;
  fontFamilyDesc: string;
  fontDefault: string;
  fontSans: string;
  fontSerif: string;
  fontArial: string;
  fontDyslexic: string;
  textSize: string;
  textSizeDesc: string;
  density: string;
  densityDesc: string;
  densityCompact: string;
  densityStandard: string;
  densityComfortable: string;
  densitySpacious: string;
  theme: string;
  themeDesc: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  livePreview: string;
  livePreviewDesc: string;

  // Accessibility
  highContrast: string;
  highContrastDesc: string;
  reducedMotion: string;
  reducedMotionDesc: string;
  highFocus: string;
  highFocusDesc: string;
  soundEnabled: string;
  soundEnabledDesc: string;
  testSound: string;

  // Notifications
  masterNotif: string;
  masterNotifDesc: string;
  channelInApp: string;
  channelEmail: string;
  channelPush: string;
  pushStatus: string;
  pushEnable: string;
  pushGranted: string;
  pushDenied: string;
  categoryMessages: string;
  categoryAccount: string;
  categorySecurity: string;
  categoryAnnouncements: string;
  categoryUpdates: string;
  categoryReminders: string;
  categoryMarketing: string;

  // Language & Regional
  languageSelect: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;

  // Privacy & Security
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactor: string;
  twoFactorDesc: string;
  activeSessions: string;
  currentDevice: string;

  // Data & Storage
  exportData: string;
  exportDataDesc: string;
  downloadJson: string;
  clearCache: string;
  clearCacheDesc: string;
  clearCacheBtn: string;

  // App & PWA
  pwaInstall: string;
  pwaInstallDesc: string;
  pwaInstalled: string;
  swStatus: string;
  offlineStatus: string;
  testOffline: string;

  // Help & Account
  faqTitle: string;
  contactSupport: string;
  appVersion: string;
  signOut: string;
  signOutAll: string;
  deleteAccount: string;
  deleteAccountWarning: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    settings: "Settings & Personalization",
    settingsSubtitle: "Manage display preferences, notifications, accessibility, and installed app behavior",
    saveChanges: "Save Changes",
    saving: "Saving...",
    savedSuccessfully: "Settings saved successfully",
    resetDefaults: "Reset to Defaults",
    resetConfirm: "Are you sure you want to reset all preferences to default values?",
    searchSettings: "Search all settings & options...",

    navProfile: "Profile & Account",
    navAppearance: "Appearance & Styling",
    navAccessibility: "Accessibility",
    navNotifications: "Notification Center",
    navLanguage: "Language & Regional",
    navPrivacy: "Privacy & Security",
    navAccounts: "Connected Accounts",
    navDataStorage: "Data & Storage",
    navSearch: "Search Preferences",
    navPwa: "Application & PWA",
    navHelp: "Help & Support",
    navAccountMgmt: "Account Management",

    fontFamily: "Typography & Font Family",
    fontFamilyDesc: "Select font face rendered across headers, navigation, assessments, and dialogs",
    fontDefault: "Inter (Default Modern)",
    fontSans: "System Clean Sans",
    fontSerif: "Editorial Serif",
    fontArial: "Standard Arial",
    fontDyslexic: "OpenDyslexic (Dyslexia Friendly)",
    textSize: "Text Scaling",
    textSizeDesc: "Scale overall text size across all pages and mobile viewports",
    density: "Interface Spacing Density",
    densityDesc: "Adjust padding, card margins, and component density",
    densityCompact: "Compact (90%)",
    densityStandard: "Standard (100%)",
    densityComfortable: "Comfortable (110%)",
    densitySpacious: "Spacious (120%)",
    theme: "Color Theme",
    themeDesc: "Switch between Light, Dark, or follow your Operating System preference",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    themeSystem: "System Default",
    livePreview: "Real-time Live Preview",
    livePreviewDesc: "Instant interactive test of your selected typography, colors, and layout scale",

    highContrast: "High Contrast Mode",
    highContrastDesc: "Increases contrast ratios and border definitions for enhanced readability",
    reducedMotion: "Reduced Motion",
    reducedMotionDesc: "Minimizes sliding transitions, smooth floats, and interactive micro-animations",
    highFocus: "Enhanced Focus Rings",
    highFocusDesc: "Displays high-visibility focus borders for full keyboard accessibility",
    soundEnabled: "Interactive Audio Feedback",
    soundEnabledDesc: "Play gentle notification and confirmation chimes on key events",
    testSound: "Play Test Chime",

    masterNotif: "Master Notification Switch",
    masterNotifDesc: "Enable or temporarily pause all non-essential platform communications",
    channelInApp: "In-App Notification Center (Bell)",
    channelEmail: "Email Summaries & Gradebooks",
    channelPush: "Browser & Device Push Notifications",
    pushStatus: "Push Permission Status",
    pushEnable: "Enable Device Push",
    pushGranted: "Permission Granted",
    pushDenied: "Blocked by Browser",
    categoryMessages: "Direct Messages & Student Inquiries",
    categoryAccount: "Account & Login Activity",
    categorySecurity: "Essential Security Alerts (Mandatory)",
    categoryAnnouncements: "Institution & System Announcements",
    categoryUpdates: "New Features & Enhancements",
    categoryReminders: "Exam Deadlines & Proctoring Reminders",
    categoryMarketing: "Promotional & Partner Credits",

    languageSelect: "Display Language",
    timezone: "Regional Timezone",
    dateFormat: "Date Display Format",
    timeFormat: "Clock Time Format",

    changePassword: "Change Password",
    currentPassword: "Old Password",
    newPassword: "New Secure Password",
    confirmPassword: "Confirm New Password",
    twoFactor: "Two-Factor Verification (2FA)",
    twoFactorDesc: "Add a secondary layer of security to your examination access",
    activeSessions: "Active Device Sessions",
    currentDevice: "Current Active Session (This Device)",

    exportData: "Export Personal Archive",
    exportDataDesc: "Download complete machine-readable JSON archive of your profile, submissions, and preferences",
    downloadJson: "Download JSON Bundle",
    clearCache: "Client Cache & Offline Storage",
    clearCacheDesc: "Clear local browser preferences cache and refresh Service Worker caches",
    clearCacheBtn: "Clear Local Cache",

    pwaInstall: "Install Testora Quiz Application",
    pwaInstallDesc: "Install as native standalone desktop or mobile application for instant offline access",
    pwaInstalled: "Installed & Running in Standalone App Mode",
    swStatus: "Service Worker Status",
    offlineStatus: "Offline Network Resilience",
    testOffline: "Simulate Offline Mode",

    faqTitle: "Frequently Asked Questions",
    contactSupport: "Contact Institutional Support",
    appVersion: "Application Release",
    signOut: "Sign Out",
    signOutAll: "Sign Out All Devices",
    deleteAccount: "Deactivate or Delete Account",
    deleteAccountWarning: "Destructive action: Permanently archive profile and revoke all examination credentials."
  },
  hi: {
    settings: "सेटिंग्स और वैयक्तिकरण",
    settingsSubtitle: "डिस्प्ले प्राथमिकताएं, सूचनाएं, सुगमता और इंस्टॉल किए गए ऐप व्यवहार का प्रबंधन करें",
    saveChanges: "परिवर्तन सहेजें",
    saving: "सहेजा जा रहा है...",
    savedSuccessfully: "सेटिंग्स सफलतापूर्वक सहेजी गईं",
    resetDefaults: "डिफ़ॉल्ट पर रीसेट करें",
    resetConfirm: "क्या आप वाकई सभी प्राथमिकताओं को डिफ़ॉल्ट मानों पर रीसेट करना चाहते हैं?",
    searchSettings: "सभी सेटिंग्स और विकल्प खोजें...",

    navProfile: "प्रोफ़ाइल और खाता",
    navAppearance: "दिखावट और स्टाइलिंग",
    navAccessibility: "सुगमता (Accessibility)",
    navNotifications: "सूचना केंद्र",
    navLanguage: "भाषा और क्षेत्रीय",
    navPrivacy: "गोपनीयता और सुरक्षा",
    navAccounts: "जुड़े हुए खाते",
    navDataStorage: "डेटा और स्टोरेज",
    navSearch: "खोज प्राथमिकताएं",
    navPwa: "एप्लिकेशन और PWA",
    navHelp: "सहायता और समर्थन",
    navAccountMgmt: "खाता प्रबंधन",

    fontFamily: "फ़ॉन्ट शैली",
    fontFamilyDesc: "हेडर, नेविगेशन, परीक्षाओं और संवादों में दिखने वाला फ़ॉन्ट चुनें",
    fontDefault: "इंटर (डिफ़ॉल्ट आधुनिक)",
    fontSans: "सिस्टम साफ़ सैन्स",
    fontSerif: "पारंपरिक सेरिफ़",
    fontArial: "मानक एरियल",
    fontDyslexic: "ओपनडिस्लेक्सिक (सुलभ)",
    textSize: "टेक्स्ट का आकार",
    textSizeDesc: "सभी पृष्ठों और मोबाइल स्क्रीन पर टेक्स्ट का आकार समायोजित करें",
    density: "इंटरफ़ेस रिक्ति घनत्व",
    densityDesc: "पैडिंग, कार्ड मार्जिन और घटक घनत्व समायोजित करें",
    densityCompact: "संक्षिप्त (90%)",
    densityStandard: "मानक (100%)",
    densityComfortable: "आरामदायक (110%)",
    densitySpacious: "विशाल (120%)",
    theme: "कलर थीम",
    themeDesc: "लाइट, डार्क या अपने ऑपरेटिंग सिस्टम की पसंद के अनुसार बदलें",
    themeLight: "लाइट मोड",
    themeDark: "डार्क मोड",
    themeSystem: "सिस्टम डिफ़ॉल्ट",
    livePreview: "वास्तविक समय पूर्वावलोकन",
    livePreviewDesc: "आपके द्वारा चुनी गई स्टाइल का तत्काल लाइव टेस्ट",

    highContrast: "उच्च कंट्रास्ट मोड",
    highContrastDesc: "बेहतर पठनीयता के लिए कंट्रास्ट और बॉर्डर स्पष्टता बढ़ाता है",
    reducedMotion: "कम गति (Reduced Motion)",
    reducedMotionDesc: "एनिमेशन और स्लाइडिंग संक्रमण को कम करता है",
    highFocus: "उन्नत फ़ोकस रिंग",
    highFocusDesc: "कीबोर्ड उपयोगकर्ताओं के लिए स्पष्ट फ़ोकस बॉर्डर दिखाता है",
    soundEnabled: "संवादात्मक ध्वनि प्रतिक्रिया",
    soundEnabledDesc: "प्रमुख घटनाओं पर सौम्य सूचना ध्वनि बजाएं",
    testSound: "परीक्षण ध्वनि बजाएं",

    masterNotif: "मास्टर नोटिफिकेशन स्विच",
    masterNotifDesc: "सभी गैर-ज़रूरी प्लेटफ़ॉर्म सूचनाओं को सक्षम या रोकें",
    channelInApp: "इन-ऐप सूचना केंद्र (घंटी)",
    channelEmail: "ईमेल सारांश और ग्रेडबुक",
    channelPush: "ब्राउज़र और डिवाइस पुश सूचनाएं",
    pushStatus: "पुश अनुमति स्थिति",
    pushEnable: "डिवाइस पुश सक्षम करें",
    pushGranted: "अनुमति स्वीकृत",
    pushDenied: "ब्राउज़र द्वारा अवरुद्ध",
    categoryMessages: "प्रत्यक्ष संदेश और छात्र पूछताछ",
    categoryAccount: "खाता और लॉगिन गतिविधि",
    categorySecurity: "आवश्यक सुरक्षा अलर्ट (अनिवार्य)",
    categoryAnnouncements: "संस्थान और सिस्टम घोषणाएं",
    categoryUpdates: "नई सुविधाएं और संवर्द्धन",
    categoryReminders: "परीक्षा समय सीमा और प्रॉक्टरिंग रिमाइंडर",
    categoryMarketing: "प्रचार और भागीदार क्रेडिट",

    languageSelect: "प्रदर्शन भाषा",
    timezone: "समय क्षेत्र (Timezone)",
    dateFormat: "दिनांक प्रारूप",
    timeFormat: "समय प्रारूप (घड़ी)",

    changePassword: "पासवर्ड बदलें",
    currentPassword: "पुराना पासवर्ड",
    newPassword: "नया सुरक्षित पासवर्ड",
    confirmPassword: "नए पासवर्ड की पुष्टि करें",
    twoFactor: "द्वि-चरणीय सत्यापन (2FA)",
    twoFactorDesc: "अपनी परीक्षा पहुंच में सुरक्षा की एक अतिरिक्त परत जोड़ें",
    activeSessions: "सक्रिय डिवाइस सत्र",
    currentDevice: "वर्तमान सक्रिय सत्र (यह उपकरण)",

    exportData: "व्यक्तिगत डेटा निर्यात करें",
    exportDataDesc: "अपनी प्रोफ़ाइल, प्रस्तुतियों और प्राथमिकताओं का पूरा JSON संग्रह डाउनलोड करें",
    downloadJson: "JSON बंडल डाउनलोड करें",
    clearCache: "लोकल कैश और स्टोरेज",
    clearCacheDesc: "ब्राउज़र प्राथमिकता कैश साफ़ करें और सर्विस वर्कर को रीफ़्रेश करें",
    clearCacheBtn: "लोकल कैश साफ़ करें",

    pwaInstall: "टेस्टोरा क्विज़ ऐप इंस्टॉल करें",
    pwaInstallDesc: "त्वरित ऑफ़लाइन पहुंच के लिए स्टैंडअलोन डेस्कटॉप या मोबाइल ऐप के रूप में इंस्टॉल करें",
    pwaInstalled: "स्टैंडअलोन ऐप मोड में इंस्टॉल और सक्रिय",
    swStatus: "सर्विस वर्कर स्थिति",
    offlineStatus: "ऑफ़लाइन नेटवर्क लचीलापन",
    testOffline: "ऑफ़लाइन मोड का परीक्षण करें",

    faqTitle: "अक्सर पूछे जाने वाले प्रश्न (FAQ)",
    contactSupport: "संस्थागत सहायता से संपर्क करें",
    appVersion: "एप्लिकेशन संस्करण",
    signOut: "साइन आउट करें",
    signOutAll: "सभी डिवाइस से साइन आउट करें",
    deleteAccount: "खाता निष्क्रिय या हटाएं",
    deleteAccountWarning: "विनाशकारी कार्रवाई: प्रोफ़ाइल को स्थायी रूप से हटाएं और सभी क्रेडेंशियल रद्द करें।"
  },
  mr: {
    settings: "सेटिंग्ज आणि वैयक्तिकरण",
    settingsSubtitle: "डिस्प्ले प्राधान्ये, सूचना, सुलभता आणि इन्स्टॉल केलेल्या ॲप वर्तन व्यवस्थापित करा",
    saveChanges: "बदल जतन करा",
    saving: "जतन करत आहे...",
    savedSuccessfully: "सेटिंग्ज यशस्वीरित्या जतन केल्या",
    resetDefaults: "डीफॉल्टवर रीसेट करा",
    resetConfirm: "तुम्हाला खरोखर सर्व प्राधान्ये डीफॉल्ट मूल्यांवर रीसेट करायची आहेत का?",
    searchSettings: "सर्व सेटिंग्ज आणि पर्याय शोधा...",

    navProfile: "प्रोफाइल आणि खाते",
    navAppearance: "दिसणे आणि शैली",
    navAccessibility: "सुलभता (Accessibility)",
    navNotifications: "सूचना केंद्र",
    navLanguage: "भाषा आणि प्रादेशिक",
    navPrivacy: "गोपनीयता आणि सुरक्षा",
    navAccounts: "जोडलेली खाती",
    navDataStorage: "डेटा आणि स्टोरेज",
    navSearch: "शोध प्राधान्ये",
    navPwa: "ॲप्लिकेशन आणि PWA",
    navHelp: "मदत आणि समर्थन",
    navAccountMgmt: "खाते व्यवस्थापन",

    fontFamily: "फॉन्ट शैली",
    fontFamilyDesc: "शीर्षके, नेव्हिगेशन, परीक्षा आणि संवादांमध्ये दिसणारा फॉन्ट निवडा",
    fontDefault: "इंटर (डीफॉल्ट आधुनिक)",
    fontSans: "सिस्टम क्लीन सॅन्स",
    fontSerif: "पारंपरिक सेरिफ",
    fontArial: "प्रमाणित एरियल",
    fontDyslexic: "ओपनडिस्लेक्सिक (सुलभ)",
    textSize: "मजकुराचा आकार",
    textSizeDesc: "सर्व पृष्ठे आणि मोबाइल स्क्रीनवर मजकूराचा आकार बदला",
    density: "इंटरफेस अंतर घनता",
    densityDesc: "पॅडिंग, कार्ड मार्जिन आणि घटक घनता समायोजित करा",
    densityCompact: "संक्षिप्त (90%)",
    densityStandard: "प्रमाणित (100%)",
    densityComfortable: "आरामदायी (110%)",
    densitySpacious: "विशाल (120%)",
    theme: "रंग थीम",
    themeDesc: "लाइट, डार्क किंवा ऑपरेटिंग सिस्टमच्या पसंतीनुसार बदला",
    themeLight: "लाइट मोड",
    themeDark: "डार्क मोड",
    themeSystem: "सिस्टम डीफॉल्ट",
    livePreview: "रिअल-टाइम पूर्वावलोकन",
    livePreviewDesc: "आपण निवडलेल्या शैलीची त्वरित थेट चाचणी",

    highContrast: "उच्च कॉन्ट्रास्ट मोड",
    highContrastDesc: "चांगल्या वाचनासाठी कॉन्ट्रास्ट आणि बॉर्डर स्पष्टता वाढवते",
    reducedMotion: "कमी हालचाल (Reduced Motion)",
    reducedMotionDesc: "ॲनिमेशन आणि स्लाइडिंग हालचाली कमी करते",
    highFocus: "सुधारित फोकस रिंग्ज",
    highFocusDesc: "कीबोर्ड वापरकर्त्यांसाठी स्पष्ट फोकस बॉर्डर दाखवते",
    soundEnabled: "संवादी ऑडिओ प्रतिसाद",
    soundEnabledDesc: "महत्त्वाच्या घटनांवर सौम्य सूचना आवाज वाजवा",
    testSound: "चाचणी आवाज वाजवा",

    masterNotif: "मास्टर सूचना स्विच",
    masterNotifDesc: "सर्व अनावश्यक प्लॅटफॉर्म सूचना सक्षम किंवा बंद करा",
    channelInApp: "इन-ॲप सूचना केंद्र (घंटी)",
    channelEmail: "ईमेल सारांश आणि ग्रेडबुक",
    channelPush: "ब्राउझर आणि डिव्हाइस पुश सूचना",
    pushStatus: "पुश परवानगी स्थिती",
    pushEnable: "डिव्हाइस पुश सक्षम करा",
    pushGranted: "परवानगी मंजूर",
    pushDenied: "ब्राउझरद्वारे ब्लॉक केले",
    categoryMessages: "थेट संदेश आणि विद्यार्थी चौकशी",
    categoryAccount: "खाते आणि लॉगिन क्रियाकलाप",
    categorySecurity: "आवश्यक सुरक्षा सूचना (अनिवार्य)",
    categoryAnnouncements: "संस्था आणि सिस्टम घोषणा",
    categoryUpdates: "नवीन वैशिष्ट्ये आणि सुधारणा",
    categoryReminders: "परीक्षा मुदत आणि प्रॉक्टरिंग स्मरणपत्रे",
    categoryMarketing: "प्रचार आणि भागीदार क्रेडिट्स",

    languageSelect: "प्रदर्शन भाषा",
    timezone: "वेळ क्षेत्र (Timezone)",
    dateFormat: "दिनांक स्वरूप",
    timeFormat: "वेळ स्वरूप (घड्याळ)",

    changePassword: "पासवर्ड बदला",
    currentPassword: "जुना पासवर्ड",
    newPassword: "नवीन सुरक्षित पासवर्ड",
    confirmPassword: "नवीन पासवर्डची खात्री करा",
    twoFactor: "द्वि-घटक पडताळणी (2FA)",
    twoFactorDesc: "आपल्या परीक्षा प्रवेशामध्ये सुरक्षेचा अतिरिक्त थर जोडा",
    activeSessions: "सक्रिय डिव्हाइस सत्रे",
    currentDevice: "वर्तमान सक्रिय सत्र (हे डिव्हाइस)",

    exportData: "वैयक्तिक डेटा निर्यात करा",
    exportDataDesc: "आपले प्रोफाईल, सबमिशन आणि प्राधान्यांचे संपूर्ण JSON संग्रह डाउनलोड करा",
    downloadJson: "JSON बंडल डाउनलोड करा",
    clearCache: "स्थानिक कॅशे आणि स्टोरेज",
    clearCacheDesc: "ब्राउझर प्राधान्य कॅशे साफ करा आणि सर्विस वर्कर रीफ्रेश करा",
    clearCacheBtn: "स्थानिक कॅशे साफ करा",

    pwaInstall: "टेस्टोरा क्विझ ॲप इन्स्टॉल करा",
    pwaInstallDesc: "झटपट ऑफलाइन प्रवेशासाठी स्टँडअलोन डेस्कटॉप किंवा मोबाइल ॲप म्हणून इन्स्टॉल करा",
    pwaInstalled: "स्टँडअलोन ॲप मोडमध्ये इन्स्टॉल आणि सक्रिय",
    swStatus: "सर्विस वर्कर स्थिती",
    offlineStatus: "ऑफलाइन नेटवर्क लवचिकता",
    testOffline: "ऑफलाइन मोडची चाचणी घ्या",

    faqTitle: "वारंवार विचारले जाणारे प्रश्न (FAQ)",
    contactSupport: "संस्थात्मक समर्थनाशी संपर्क साधा",
    appVersion: "ॲप्लिकेशन आवृत्ती",
    signOut: "साइन आउट करा",
    signOutAll: "सर्व उपकरणांमधून साइन आउट करा",
    deleteAccount: "खाते निष्क्रिय किंवा हटवा",
    deleteAccountWarning: "विध्वंसक कृती: प्रोफाईल कायमचे हटवा आणि सर्व परीक्षा ओळखपत्रे रद्द करा."
  }
};


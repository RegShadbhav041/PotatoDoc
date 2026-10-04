// In-app language: English ⇄ Nepali.
//
// `t("Some string")` returns the Nepali translation when the active language
// is Nepali, otherwise the original. Untranslated keys fall back to English,
// so switching language can never blank or crash a screen.
//
// The dictionary is keyed by the ENGLISH source string (not an invented id) —
// that keeps JSX readable and makes a missing translation a non-event.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANG_KEY = "potatoDocLanguage";

export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "ne", label: "नेपाली" },
];

// English source string -> नेपाली
const NE = {
  // Bottom navigation / chrome
  Home: "मुख्य पृष्ठ",
  Diagnose: "निदान",
  History: "इतिहास",
  Location: "स्थान",
  Profile: "प्रोफाइल",
  About: "पोटाटोडोबारे",

  // Home
  "Let's keep your potato crop healthy.": "तपाईंको आलोको बाली स्वस्थ राखौं।",
  Farmer: "किसान",
  "Good morning": "शुभ बिहान",
  "Good afternoon": "शुभ दिउँसो",
  "Good evening": "शुभ साँझ",
  "Diagnose. Protect. Grow.": "निदान गर्नुहोस्। जोगाउनुहोस्। बढ्नुहोस्।",
  "Scan a Potato Leaf": "आलोको पात स्क्यान गर्नुहोस्",
  "Upload or capture a leaf image for instant AI diagnosis":
    "तुरुन्तै एआई निदानका लागि पातको तस्बिर अपलोड वा खिच्नुहोस्",
  "Disease Reference": "रोग सम्बन्धी जानकारी",
  Healthy: "स्वस्थ",
  "Uniform green, no lesions": "एकरंगी हरियो, कुनै घाउ छैन",
  "Early Blight": "बिहे ब्लाइट",
  "Target-ring dark lesions": "लक्ष्य-वृत्ताकार गाढा घाउ",
  "Late Blight": "ढिलो ब्लाइट",
  "Water-soaked brown patches": "पानीले भिजेका खैरो धब्बा",
  "Sign in to save your diagnosis history and track your crops over time.":
    "आफ्नो निदान इतिहास सुरक्षित गर्न र बालीको अवस्था ट्र्याक गर्न लगइन गर्नुहोस्।",
  "Sign In": "लगइन",
  "Your diagnoses are backed up": "तपाईंका निदानहरू सुरक्षित छन्",
  "Every scan is saved to your account, so your history stays with you on any device.":
    "हरेक स्क्यान तपाईंको खातामा सुरक्षित हुन्छ, त्यसैले इतिहास कुनै पनि उपकरणमा रहन्छ।",
  "View history": "इतिहास हेर्नुहोस्",
  "Sign out": "लगआउट",

  // Diagnose
  "Diagnose a leaf": "पातको निदान",
  "AI-assisted crop check": "एआई सहयोगी बाली जाँच",
  Model: "मोडेल",
  "Select AI Model": "एआई मोडेल छान्नुहोस्",
  "Ensemble (All Models)": "समूह (सबै मोडेलहरू)",
  "EfficientNet-B0": "इफिसिएन्टनेट-बी०",
  MobileNetV2: "मोबाइलनेट भी२",
  "Small CNN (Lightweight)": "सानो सीएनएन (हल्का)",
  "Best overall accuracy, combines 3 networks":
    "सबैभन्दा राम्रो शुद्धता, तीनवटा नेटवर्क जोडिएको",
  "High precision for early & late blight": "बिहे र ढिलो ब्लाइटका लागि उच्च शुद्धता",
  "Ultra-fast on-device inference": "अति छिटो उपकरणमैको गणना",
  "Minimal resource & offline mode": "न्यूनतम स्रोत र अफलाइन मोड",
  "Add a leaf photo": "पातको फोटो थप्नुहोस्",
  "Take a photo or select one from your gallery":
    "फोटो खिच्नुहोस् वा ग्यालरीबाट छान्नुहोस्",
  Camera: "क्यामेरा",
  Gallery: "ग्यालरी",
  "For the best results": "राम्रो नतिजाका लागि",
  "Keep the entire leaf in focus": "पूरै पात फोकसमा राख्नुहोस्",
  "Use natural light and a plain background": "प्राकृतिक प्रकाश र सादा पृष्ठभूमि प्रयोग गर्नुहोस्",
  "Include both healthy and affected areas":
    "स्वस्थ र प्रभावित दुवै भाग समावेश गर्नुहोस्",
  "Next Image": "अर्को तस्बिर",
  "Save to History": "इतिहासमा सुरक्षित गर्नुहोस्",
  "Saved!": "सुरक्षित भयो!",
  "Connecting...": "जडान हुँदैछ...",
  "Retrying...": "पुनः प्रयास...",
  "Loading models...": "मोडेल लोड हुँदैछ...",
  Ready: "तयार",

  // History
  "Your history": "तपाईंको इतिहास",
  "Your diagnoses": "तपाईंकानिदाहरू",
  Clear: "हटाउनुहोस्",
  "No predictions yet. Diagnose a leaf to build your history.":
    "अहिलेसम्म कुनै पूर्वानुमान छैन। इतिहास बनाउन पातको निदान गर्नुहोस्।",

  // News
  News: "समाचार",
  "NEWS & NOTIFICATION": "समाचार र सूचना",
  "LATEST UPDATE": "ताजा अपडेट",
  Notice: "सूचना",
  "{n} important update is unread": "{n} महत्त्वपूर्ण अपडेट नपढिएको छ",
  "{n} important updates are unread": "{n} महत्त्वपूर्ण अपडेटहरू नपढिएका छन्",
  "Nothing here yet": "यहाँ केही छैन",
  "Super Admin": "सुपर एड्मिन",
  "You're all caught up": "सबै पढिसक्नुभयो",
  "unread update": "नपढिएको सूचना",
  "unread updates": "नपढिएका सूचनाहरू",
  "Mark all read": "सबै पढिएको चिन्ह लगाउनुहोस्",
  All: "सबै",
  Updates: "अपडेटहरू",
  Announcements: "घोषणाहरू",
  "Crop alerts": "बाली चेतावनी",
  "New products": "नयाँ उत्पादनहरू",
  Medicines: "औषधिहरू",
  "New product": "नयाँ उत्पादन",
  Medicine: "औषधि",
  Update: "अपडेट",
  Announcement: "घोषणा",
  "Crop alert": "बाली चेतावनी",
  New: "नयाँ",
  "Nothing here": "यहाँ केही छैन",
  "No notices in this category.": "यो श्रेणीमा कुनै सूचना छैन।",
  "News, announcements and crop alerts will show up here.":
    "समाचार, घोषणा र बाली चेतावनीहरू यहाँ देखिनेछन्।",
  "Loading notices…": "सूचनाहरू लोड हुँदैछन्…",

  // Profile
  "Your PotatoDoc preferences.": "तपाईंका पोटाटोडो प्राथमिकताहरू।",
  PREFERENCES: "प्राथमिकताहरू",
  Pokhara: "पोखरा",
  Appearance: "देखावट",
  "Light mode": "उज्यालो मोड",
  "Dark mode": "गाढा मोड",
  Notifications: "सूचनाहरू",
  "Restock, deals and other updates": "पुनः भण्डार, सोझ र अन्य अपडेटहरू",
  Language: "भाषा",
  "Text and spoken language": "लिखित र बोलिने भाषा",
  "About PotatoDoc": "पोटाटोडोबारे",
  "Privacy, version and disclaimer": "गोपनीयता, संस्करण र अस्वीकरण",
  "Help & Feedback": "सहयोग र प्रतिक्रिया",
  FAQ: "प्रश्नोत्तर",
  Logout: "लगआउट",
  "Sign in to save your diagnosis history and receive crop alerts.":
    "निदान इतिहास सुरक्षित गर्न र बाली चेतावनी पाउन लगइन गर्नुहोस्।",
  Camera: "क्यामेरा",
  Gallery: "ग्यालरी",
  Remove: "हटाउनुहोस्",
  "Permission needed to choose a photo.": "फोटो छान्न अनुमति चाहिन्छ।",

  // Support tickets
  "Report a problem or ask a question": "समस्या रिपोर्ट गर्नुहोस् वा प्रश्न सोध्नुहोस्",
  "Sign in to contact support and track your tickets.":
    "सहयोग टिमसँग सम्पर्क गर्न र आफ्ना टिकटहरू हेर्न लगइन गर्नुहोस्।",
  "New Ticket": "नयाँ टिकट",
  "No tickets yet": "अहिलेसम्म कुनै टिकट छैन",
  "Something wrong in the app? Open a ticket and we will help you fix it.":
    "एपमा केही गडबड छ? टिकट खोल्नुहोस्, हामी सच्याउन मद्दत गर्छौं।",
  "Subject and message are required.": "विषय र सन्देश आवश्यक छन्।",
  "How can we help?": "हामी कसरी सहयोग गर्न सक्छौं?",
  Subject: "विषय",
  Message: "सन्देश",
  "Describe the problem…": "समस्याको विवरण लेख्नुहोस्…",
  "Open Ticket": "टिकट खोल्नुहोस्",
  Cancel: "रद्द गर्नुहोस्",
  Ticket: "टिकट",
  Open: "खुला",
  Resolved: "समाधान भयो",
  "Resolved — sending a message reopens this ticket.":
    "समाधान भयो — सन्देश पठाउँदा टिकट फेरि खुल्छ।",
  "Write a reply…": "जवाफ लेख्नुहोस्…",
  Retry: "पुनः प्रयास",
  messages: "सन्देश",

  // Your details modal
  "Your details": "तपाईंको विवरण",
  "Save your name and email address for a more personal experience.":
    "व्यक्तिगत अनुभवका लागि आफ्नो नाम र इमेल ठेगाना सुरक्षित गर्नुहोस्।",
  "Your name": "तपाईंको नाम",
  "e.g. Salina Kunwar": "जस्तै: सलिना कुँवर",
  "Email address": "इमेल ठेगाना",
  "Save Profile": "प्रोफाइल सुरक्षित गर्नुहोस्",

  // Prediction result
  "Prediction Result": "पूर्वानुमान नतिजा",
  "Per-Class Probabilities": "प्रत्येक वर्गको सम्भाव्यता",
  "Ensemble Members": "समूहका सदस्यहरू",
  Label: "लेबल",
  Confidence: "विश्वास",
  "Unknown Image": "अज्ञात तस्बिर",
  "Suggestions:": "सुझावहरू:",
  "No heatmap available.": "हिटम्याप उपलब्ध छैन।",
  "Explainable AI - Heatmap": "व्याख्यायोग्य एआई – हिटम्याप",
  "Red = high influence on the decision": "रातो = निर्णयमा उच्च प्रभाव",
  "Grad-CAM visualization. Red regions influenced the prediction most.":
    "ग्र्याड-क्याम दृश्यीकरण। रातो क्षेत्रहरूले पूर्वानुमानमा सबैभन्दा बढी प्रभाव पारेका छन्।",
  "Symptoms:": "लक्षणहरू:",
  "Care Tips:": "हेरचाह सुझावहरू:",
  "Treatment & Mitigation:": "उपचार र नियन्त्रण:",
  "About Healthy": "स्वस्थबारे",
  "About Early Blight": "बिहे ब्लाइटबारे",
  "About Late Blight": "ढिलो ब्लाइटबारे",
  "The model is not very confident. Retake the photo with better light and focus, or try another leaf.":
    "मोडेल धेरै आश्वस्त छैन। राम्रो प्रकाश र फोकसमा फेरि फोटो खिच्नुहोस्, वा अर्को पात प्रयोग गर्नुहोस्।",
  "This does not look like a potato leaf the model recognises.":
    "यो मोडेलले चिन्ने आलोको पात जस्तो देखिँदैन।",

  // Location / About
  "Tag where you scan": "जहाँ स्क्यान गर्नुहुन्छ त्यहाँ चिन्ह लगाउनुहोस्",
  "Link each diagnosis to a field location to track how disease pressure moves across your crops over time.":
    "प्रत्येक निदानलाई खेतको स्थानसँग जोड्नुहोस् ताकि समयसँगै बालीमा रोगको दबाब कसरी बढ्छ भनेर ट्र्याक गर्न सकियोस्।",
  "Coming soon": "छिट्टै आउँदैछ",
  "AI-powered potato leaf disease diagnosis. Snap a photo of a leaf and get an instant Early Blight, Late Blight, or Healthy verdict with Grad-CAM heatmaps from an ensemble of trained models.":
    "एआईमा आधारित आलोको पातको रोग निदान। पातको फोटो खिच्नुहोस् र प्रशिक्षित मोडेलहरूको समूहबाट ग्र्याड-क्याम हिटम्यापसहित बिहे ब्लाइट, ढिलो ब्लाइट वा स्वस्थ भनेर तुरुन्तै नतिजा पाउनुहोस्।",

  // Location tag controls
  "GPS auto-tagging": "GPS स्वचालित ट्याग",
  "Attach your coordinates to every saved diagnosis.":
    "प्रत्येक सुरक्षित निदानमा तपाईंको अक्षांश-रेखांश थप्नुहोस्।",
  Accuracy: "सटीकता",
  "Location permission is off. Allow it in Settings to auto-tag scans.":
    "स्थान अनुमति बन्द छ। स्वचालित ट्यागका लागि सेटिङ्मा अनुमति दिनुहोस्।",
  "Open Settings": "सेटिङ्मा खोल्नुहोस्",
  "Refresh fix": "स्थिति ताजा गर्नुहोस्",
  "Field or village name": "खेत वा गाउँको नाम",
  "e.g. Field A, Pokhara": "जस्तै: खेत A, पोखरा",
  "Works without GPS": "GPS बिना पनि काम गर्छ",
  "How tagging works": "ट्याग कसरी काम गर्छ",
  "Every diagnosis you save stores this tag — coordinates and/or the name above. Open it in History to see where and when it was taken, and support staff see the same tag when helping you.":
    "तपाईंले सुरक्षित गर्नुहुने हरेक निदानमा यो ट्याग रहन्छ — निर्देशांक र/वा माथिको नाम। यो कहाँ र कहिले लिइयो भनेर इतिहासमा खोलेर हेर्नुहोस्, र सहयोग स्टाफले पनि मद्दत गर्दा उही ट्याग देख्छन्।",

  // History detail / report modal
  "Diagnosis report": "निदान प्रतिवेदन",
  Result: "नतिजा",
  "Taken on": "खिचिएको मिति",
  "Photo not on this device": "यो उपकरणमा फोटो छैन",
  "No location tag": "स्थान ट्याग छैन",
  "Share report": "प्रतिवेदन साझा गर्नुहोस्",
  "Sharing…": "साझा गर्दै…",

  // Auth
  "Welcome back!": "पुनः स्वागत छ!",
  "Sign in to see your diagnosis history.": "आफ्नो निदान इतिहास हेर्न लगइन गर्नुहोस्।",
  "Sign in to check on your plants.": "आफ्नाबिरुवाको अवस्था जान्न लगइन गर्नुहोस्।",
  "Email or Phone": "इमेल वा फोन",
  "Enter your password": "पासवर्ड लेख्नुहोस्",
  "Remember me": "मलाई सम्झनुहोस्",
  "Please wait…": "कृपया पर्खनुहोस्…",
  "Sign in": "लगइन",
  "New here?": "नयाँ हुनुहुन्छ?",
  "Create an account 👋": "खाता बनाउनुहोस् 👋",
  "Create Account": "खाता बनाउनुहोस्",
  "Join Us !": "हामीसथाम आउनुहोस् !",
  "Create your account in just a tap.": "एक ट्यापमै आफ्नो खाता बनाउनुहोस्।",
  "Full Name": "पूरा नाम",
  "Phone or Email": "फोन वा इमेल",
  "Phone or email": "फोन वा इमेल",
  "Create password": "पासवर्ड बनाउनुहोस्",
  "I agree to the friendly": "म सहमत छु",
  "Terms & Privacy": "सर्त र गोपनीयता",
  "Enter your name.": "आफ्नो नाम लेख्नुहोस्।",
  "Enter your email or phone.": "आफ्नो इमेल वा फोन लेख्नुहोस्।",
  "Enter your email or phone and password.": "आफ्नो इमेल वा फोन र पासवर्ड लेख्नुहोस्।",
  "Password must be at least 8 characters.": "पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ।",
  "Please agree to the Terms & Privacy.": "कृपया सर्त र गोपनीयतामा सहमति दिनुहोस्।",
  "Email or phone": "इमेल वा फोन",
  Password: "पासवर्ड",
  Name: "नाम",
  Continue: "जारी राख्नुहोस्",
  "Don't have an account?": "खाता छैन?",
  "Already have an account?": "पहिले नै खाता छ?",
  "Create account": "खाता बनाउनुहोस्",

  // Location Suitability tab (designer screenshots, 2026-10-02)
  "Location Suitability": "स्थान उपयुक्तता",
  "Potato Growing Analysis for Your Location": "तपाईंको स्थानको आलो उत्पादन विश्लेषण",
  "Analyze My Location": "मेरो स्थान विश्लेषण गर्नुहोस्",
  "Location Analysis": "स्थान विश्लेषण",
  "Using your GPS location, our AI will analyze potato growing suitability based on altitude, temperature, soil type, rainfall, and other agronomic factors.":
    "तपाईंको GPS स्थान प्रयोग गरी हाम्रो AI ले अग्लाइ, तापक्रम, माटोको प्रकार, वर्षा र अन्य कृषि कारकहरूमा आधारित आलो उत्पादनको उपयुक्तता विश्लेषण गर्नेछ।",
  "Altitude analysis (optimal: 800—3000m)": "अग्लाइ विश्लेषण (उपयुक्त: ८००—३००० मिटर)",
  "Temperature estimation": "तापक्रम अनुमान",
  "Rainfall zone classification": "वर्षा क्षेत्र वर्गीकरण",
  "Soil type estimation": "माटोको प्रकार अनुमान",
  "Variety recommendations": "किस्म सिफारिसहरू",
  "Local growing tips": "स्थानीय खेती सुझावहरू",
  Recommendation: "सिफारिस",
  Overview: "अवलोकन",
  Factors: "कारकहरू",
  Varieties: "किस्महरू",
  Tips: "सुझावहरू",
  "Local Challenges": "स्थानीय चुनौतीहरू",
  "Rainfall Zone": "वर्षा क्षेत्र",
  "Suitability Factors": "उपयुक्तता कारकहरू",
  "Tap each factor to expand": "विस्तार गर्न प्रत्येक कारकमा थिच्नुहोस्",
  "Recommended Varieties": "सिफारिस गरिएका किस्महरू",
  "Varieties best adapted to your location": "तपाईंको स्थानका लागि उपयुक्त किस्महरू",
  "Growing Tips": "खेती सुझावहरू",
  Temp: "तापक्रम",
  Season: "मौसम",
  Soil: "माटो",
  Excellent: "उत्कृष्ट",
  Good: "राम्रो",
  Fair: "मध्यम",
  Poor: "कमजोर",
  "Last analyzed": "अन्तिम विश्लेषण:",
  "{n}m altitude": "{n} मिटर उचाइ",
  "Your location": "तपाईंको स्थान",
  "Analyzing your location…": "तपाईंको स्थान विश्लेषण गर्दै…",
  "Location permission is needed to analyze your area.":
    "क्षेत्र विश्लेषण गर्न स्थान अनुमति आवश्यक छ।",
  "Couldn't get a GPS fix. Try again outside.":
    "GPS फिक्स पाउन सकिएन। बाहिर पुनः प्रयास गर्नुहोस्।",
  "Can't reach the server. Check your connection.":
    "सर्भरसम्म पुग्न सकिएन। तपाईंको जडान जाँच गर्नुहोस्।",
  "Something went wrong. Please try again.":
    "केही गडबड भयो। कृपया पुनः प्रयास गर्नुहोस्।",
  // Backend /location/analyze error details (HTTPException detail strings)
  "Invalid coordinates": "अमान्य निर्देशांक",
  "Location service unavailable": "स्थान सेवा उपलब्ध छैन",
  "Location service timeout": "स्थान सेवाको समय सीमा सकियो",
  // Backend analysis strings passed through t() then fmt() (translate once,
  // substitute {placeholders} after — see locationText.fmt).
  // Factor labels
  Altitude: "अग्लाइ",
  "Est. Temperature": "अनुमानित तापक्रम",
  "Est. Soil Type": "अनुमानित माटोको प्रकार",
  "Climate Zone": "जलवायु क्षेत्र",
  // Rainfall / altitude belt names (ZONES in location_rules.py)
  Tropical: "उष्ण",
  "Sub-tropical": "उप-उष्ण",
  "Warm Temperate": "न्यानो शीतोष्ण",
  "Cool Temperate": "चिसो शीतोष्ण",
  "Sub-alpine": "उप-अल्पाइन",
  Alpine: "अल्पाइन",
  // Temperature-regime names (climate_zone) — "Tropical"/"Alpine" share keys above
  Subtropical: "उप-उष्ण",
  Temperate: "शीतोष्ण",
  Cold: "चिसो",
  // Region words for the recommendation {zone} (REGIONS in location_rules.py)
  Terai: "तराई",
  "low hills": "निचला पहाड",
  "mid-hills": "मध्य पहाड",
  "high hills": "उच्च पहाड",
  Himalaya: "हिमाल",
  // USDA texture names + zonal heuristic
  Loam: "लोम माटो",
  "Sandy Loam": "बालुवा लोम माटो",
  "Silt Loam": "सिल्ट लोम माटो",
  "Clay Loam": "चिकनी लोम माटो",
  "Sandy Clay Loam": "बालुवा चिकनी लोम माटो",
  "Loamy Sand": "लोम बालुवा",
  Sand: "बालुवा",
  "Silty Clay Loam": "सिल्ट चिकनी लोम माटो",
  Clay: "चिकनी माटो",
  "Silty Clay": "सिल्ट चिकनी माटो",
  "Sandy Clay": "बालुवा चिकनी माटो",
  Silt: "सिल्ट",
  "Alluvial Sandy Loam": "जलोढ़ बालुवा लोम माटो",
  // Seasons (feasible_seasons)
  "Winter (Oct–Feb)": "जाडो (असोज–फागुन)",
  "Spring (Mar–May)": "वसन्त (चैत–जेठ)",
  "Winter (Oct–Feb) & Spring (Mar–May)":
    "जाडो (असोज–फागुन) र वसन्त (चैत–जेठ)",
  "Off-season": "बाहिरी मौसम",
  // Local challenges
  "Monsoon disease pressure (Jun–Sep)": "मनसुनको रोग दबाब (असार–असोज)",
  "Frost risk at planting or harvest": "रोपाइँ वा कटनीमा पालो जोखिम",
  "Waterlogging on heavy soils": "गाह्रो माटोमा पानी जम्ने",
  "Low rainfall — irrigation needed": "कम वर्षा — सिँचाइ आवश्यक",
  "Heat stress in late crop (Mar–May)": "चरीको ढिलोअवस्थामा तातो तनाव (चैत–जेठ)",
  "Soil too acidic — apply lime before planting":
    "माटो धेरै अम्लीय — रोपाइँअघि चुनो प्रयोग गर्नुहोस्",
  // Growing tips
  "Plant in well-prepared ridges or raised beds for optimal drainage":
    "जलनिकासका लागि राम्रोसँग तयार गरिएका गाँठो वा उचालितबेडमा रोप्नुहोस्",
  "Hill up soil around plants when they reach 20–25cm to prevent greening":
    "बिरुवा २०–२५ सेमी पुगेपछि वरिपरि माटो लगाउनुहोस् — हरियो पारिनबाट जोगाउन",
  "Rotate crops — avoid planting potatoes in the same field for 3+ years":
    "बाली फेर्नुहोस् — ३ वर्षभन्दा बढी एउटै खेतमा आलो नरोप्नुहोस्",
  "Test soil pH (ideal: 5.5–6.5) and adjust with lime or sulfur as needed":
    "माटोको pH परीक्षण गर्नुहोस् (उपयुक्त: ५.५–६.५) र आवश्यक अनुसार चुनो वा सल्फर प्रयोग गर्नुहोस्",
  "In Nepal: plant Khumal varieties for best local adaptation and yield":
    "नेपालमा: राम्रो स्थानीय अनुकूलन र उत्पादनका लागि खुमाल किस्महरू रोप्नुहोस्",
  "Add compost and open drainage channels — heavy soil compacts easily":
    "कम्पोस्ट थप्नुहोस् र जलनिकास खोल्नुहोस् — गाह्रो माटो सजिलै साँघुरिन्छ",
  "Plan drip or furrow irrigation — rainfall alone will not carry the crop":
    "ड्रिप वा फरोवाखालेको सिँचाइ योजना बनाउनुहोस् — वर्षामात्रै पर्याप्त हुँदैन",
  "Watch for late blight in the humid months — remove affected leaves early":
    "आर्द्र महिनाहरूमा ढिलो ब्लाइट हेर्नुहोस् — प्रभावित पातहरू छिटो हटाउनुहोस्",
  "Use well-sprouted seed tubers and mulch to protect against cold nights":
    "राम्रो अंकुरित बीउ कन्द प्रयोग गर्नुहोस् र चिसो रातबाट जोगाउन मल्च गर्नुहोस्",
  "Apply agricultural lime 2–3 weeks before planting to lift pH":
    "pH बढाउन रोपाइँभन्दा २–३ हप्ता अघि कृषि चुनो प्रयोग गर्नुहोस्",
  // Factor why templates (FactorRow: t(why) then fmt() with factor.vars —
  // placeholders stay literal in both languages; source: location_rules.py)
  "{alt} m — potato in Nepal spans 100–4000 m; optimum 800–3000 m":
    "{alt} मिटर — नेपालमा आलो १००–४००० मिटरसम्म फैलिन्छ; उपयुक्त ८००–३००० मिटर",
  "~{temp}°C — tuber initiation prefers a cool 8–20°C":
    "~{temp}°C — कन्द विकासका लागि चिसो ८–२०°C उपयुक्त",
  "{rain} mm typical — Nepal's monsoon delivers most of it Jun–Sep":
    "{rain} मिमी सामान्य — नेपालको मनसुनले अधिकांश वर्षा असार–असोजमै दिन्छ",
  "{texture}, pH {ph} — loam family drains best for tubers":
    "{texture}, pH {ph} — लोम माटो परिवारले कन्दका लागि सबैभन्दा राम्रो जलनिकास गर्छ",
  "{zone} regime — coldest month near {coldest}°C":
    "{zone} जलवायु व्यवस्था — सबैभन्दा चिसो महिना करिब {coldest}°C",
  "Rainfall data unavailable — zone estimated from altitude":
    "वर्षा डाटा उपलब्ध छैन — क्षेत्र अग्लाइबाट अनुमान गरिएको",
  // Recommendation templates (keep {zone} literal — fmt substitutes it after t())
  "Your location is excellent for potato cultivation — typical of Nepal's {zone}. Conditions closely match the ideal agronomic requirements. Focus on disease prevention and variety selection for maximum yield.":
    "तपाईंको स्थान आलो खेतीका लागि उत्कृष्ट छ — नेपालको {zone} को परम्परागत। अवस्थाहरू आदर्श कृषि आवश्यकतासँग मिल्दोजुल्दो छन्। अधिकतम उत्पादनका लागि रोग नियन्त्रण र किस्म छनोटमा ध्यान दिनुहोस्।",
  "Your location suits potato well — conditions are close to Nepal's ideal for {zone}. Manage soil fertility and watch the monsoon for disease pressure.":
    "तपाईंको स्थान आलोका लागि उपयुक्त छ — अवस्थाहरू नेपालको {zone} का लागि आदर्श नजिक छन्। माटोको उर्वरता व्यवस्थापन गर्नुहोस् र रोग दबाबका लागि मनसुनमा ध्यान दिनुहोस्।",
  "Potato can be grown here, but conditions are only moderately suitable in this {zone} zone. Choose tolerant varieties, improve drainage or irrigation, and expect lower yields.":
    "यहाँ आलो उत्पादन गर्न सकिन्छ, तर यस {zone} क्षेत्रमा अवस्था केवल मध्यम उपयुक्त छ। सहनशील किस्महरू छान्नुहोस्, जलनिकास वा सिँचाइ सुधार गर्नुहोस्, र कम उत्पादन अपेक्षा गर्नुहोस्।",
  "This location is poorly suited to potato under natural conditions. Consider another crop, or invest in irrigation, soil amendment and microclimate protection before planting.":
    "यो स्थान प्राकृतिक अवस्थामा आलोका लागि कमजोर छ। अर्को बाली विचार गर्नुहोस्, वा रोपाइँअघि सिँचाइ, माटो सुधार र माइक्रोक्लाइमेट संरक्षणमा लगानी गर्नुहोस्।",

  "Field & location settings": "खेत र स्थान सेटिङहरू",
  "GPS auto-tagging and field label": "GPS स्वचालित ट्याग र खेतको नाम",
};

const LangContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (source) => source,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(LANG_KEY)
      .then((v) => {
        if (alive && (v === "en" || v === "ne")) setLangState(v);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setLang = useCallback((next) => {
    const value = next === "ne" ? "ne" : "en";
    setLangState(value);
    AsyncStorage.setItem(LANG_KEY, value).catch(() => {});
  }, []);

  const t = useCallback(
    (source) => {
      if (lang !== "ne" || typeof source !== "string") return source;
      return NE[source] || source;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Shorthand for the translator: `const t = useT();` */
export function useT() {
  return useContext(LangContext).t;
}

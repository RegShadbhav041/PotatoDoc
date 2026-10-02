import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n";
import {
  analyzePotatoSuitability,
  getRatingColor,
  getRatingEmoji,
  type LocationSuitabilityResult,
  type SuitabilityFactor,
} from "@/lib/location-suitability";

// ─── Rating Label ─────────────────────────────────────────────────────────────
function getRatingLabel(rating: string, lang: "en" | "ne"): string {
  const labels: Record<string, { en: string; ne: string }> = {
    excellent: { en: "Excellent", ne: "उत्कृष्ट" },
    good: { en: "Good", ne: "राम्रो" },
    moderate: { en: "Moderate", ne: "मध्यम" },
    poor: { en: "Poor", ne: "कमजोर" },
    not_suitable: { en: "Not Suitable", ne: "अनुपयुक्त" },
  };
  return labels[rating]?.[lang] ?? rating;
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, rating }: { score: number; rating: string }) {
  const color = getRatingColor(rating as any);
  const emoji = getRatingEmoji(rating as any);
  return (
    <View style={[styles.scoreRing, { borderColor: color }]}>
      <Text style={styles.scoreEmoji}>{emoji}</Text>
      <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
      <Text style={styles.scoreLabel}>/100</Text>
    </View>
  );
}

// ─── Factor Card ──────────────────────────────────────────────────────────────
function FactorCard({ factor, lang }: { factor: SuitabilityFactor; lang: "en" | "ne" }) {
  const [expanded, setExpanded] = useState(false);
  const color = getRatingColor(factor.rating);
  const name = lang === "ne" ? factor.nameNe : factor.name;
  const value = lang === "ne" ? factor.valueNe : factor.value;
  const explanation = lang === "ne" ? factor.explanationNe : factor.explanation;

  return (
    <TouchableOpacity style={styles.factorCard} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
      <View style={styles.factorHeader}>
        <Text style={styles.factorIcon}>{factor.icon}</Text>
        <View style={styles.factorInfo}>
          <Text style={styles.factorName}>{name}</Text>
          <Text style={[styles.factorValue, { color }]}>{value}</Text>
        </View>
        <View style={styles.factorScoreContainer}>
          <View style={[styles.factorScoreBadge, { backgroundColor: color + "20", borderColor: color }]}>
            <Text style={[styles.factorScore, { color }]}>{factor.score}</Text>
          </View>
          <Text style={styles.expandIcon}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </View>
      {/* Score Bar */}
      <View style={styles.factorBarBg}>
        <View style={[styles.factorBarFill, { width: `${factor.score}%` as any, backgroundColor: color }]} />
      </View>
      {/* Expanded Explanation */}
      {expanded && (
        <Text style={styles.factorExplanation}>{explanation}</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LocationScreen() {
  const router = useRouter();
  const { language: lang, t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LocationSuitabilityResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "factors" | "varieties" | "tips">("overview");

  const analyzeLocation = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          lang === "ne" ? "अनुमति अस्वीकार" : "Permission Denied",
          lang === "ne"
            ? "स्थान पहुँच अस्वीकार गरियो। कृपया सेटिङहरूमा स्थान अनुमति सक्षम गर्नुहोस्।"
            : "Location access was denied. Please enable location permission in Settings.",
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude, altitude } = location.coords;
      const altitudeM = altitude ?? 0;

      const suitability = analyzePotatoSuitability(latitude, longitude, altitudeM);
      setResult(suitability);
    } catch (err) {
      Alert.alert(
        lang === "ne" ? "त्रुटि" : "Error",
        lang === "ne"
          ? "स्थान प्राप्त गर्न असमर्थ। कृपया पुनः प्रयास गर्नुहोस्।"
          : "Unable to get location. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const tabs = [
    { key: "overview", label: lang === "ne" ? "अवलोकन" : "Overview" },
    { key: "factors", label: lang === "ne" ? "कारकहरू" : "Factors" },
    { key: "varieties", label: lang === "ne" ? "किस्महरू" : "Varieties" },
    { key: "tips", label: lang === "ne" ? "सुझावहरू" : "Tips" },
  ] as const;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← {lang === "ne" ? "फिर्ता" : "Back"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{lang === "ne" ? "स्थान उपयुक्तता" : "Location Suitability"}</Text>
          <Text style={styles.subtitle}>
            {lang === "ne"
              ? "तपाईंको स्थानमा आलु खेती विश्लेषण"
              : "Potato Growing Analysis for Your Location"}
          </Text>
        </View>

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
          onPress={analyzeLocation}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.analyzeBtnText}>
              📍 {lang === "ne" ? "मेरो स्थान विश्लेषण गर्नुहोस्" : "Analyze My Location"}
            </Text>
          )}
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {lang === "ne" ? "GPS स्थान प्राप्त गर्दै..." : "Getting GPS location..."}
            </Text>
            <Text style={styles.loadingSubtext}>
              {lang === "ne"
                ? "उचाइ, जलवायु र माटोको प्रकार विश्लेषण गर्दै..."
                : "Analyzing altitude, climate & soil type..."}
            </Text>
          </View>
        )}

        {/* Results */}
        {result && (
          <View style={styles.resultsContainer}>
            {/* Score Card */}
            <View style={styles.scoreCard}>
              <ScoreRing score={result.overallScore} rating={result.overallRating} />
              <View style={styles.scoreInfo}>
                <Text style={styles.ratingLabel}>
                  {getRatingLabel(result.overallRating, lang)}
                </Text>
                <Text style={styles.locationText}>
                  📍 {result.locationName}
                </Text>
                <Text style={styles.altitudeText}>
                  ⛰️ {result.altitude.toFixed(0)}m {lang === "ne" ? "उचाइ" : "altitude"}
                </Text>
                <Text style={styles.coordsText}>
                  {result.latitude.toFixed(4)}°, {result.longitude.toFixed(4)}°
                </Text>
              </View>
            </View>

            {/* Recommendation Banner */}
            <View style={[styles.recBanner, { borderLeftColor: getRatingColor(result.overallRating) }]}>
              <Text style={styles.recTitle}>
                {lang === "ne" ? "सिफारिस" : "Recommendation"}
              </Text>
              <Text style={styles.recText}>
                {lang === "ne" ? result.recommendationNe : result.recommendation}
              </Text>
            </View>

            {/* Quick Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statChipIcon}>🌡️</Text>
                <Text style={styles.statChipLabel}>{lang === "ne" ? "तापमान" : "Temp"}</Text>
                <Text style={styles.statChipValue}>{result.estimatedTemperature.split(" ")[0]}</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statChipIcon}>🌱</Text>
                <Text style={styles.statChipLabel}>{lang === "ne" ? "मौसम" : "Season"}</Text>
                <Text style={styles.statChipValue} numberOfLines={2}>
                  {lang === "ne" ? result.growingSeasonNe : result.growingSeason}
                </Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statChipIcon}>🪨</Text>
                <Text style={styles.statChipLabel}>{lang === "ne" ? "माटो" : "Soil"}</Text>
                <Text style={styles.statChipValue} numberOfLines={2}>
                  {lang === "ne" ? result.soilTypeNe : result.soilType}
                </Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <View style={styles.tabContent}>
                {/* Challenges */}
                <Text style={styles.sectionTitle}>
                  ⚠️ {lang === "ne" ? "स्थानीय चुनौतीहरू" : "Local Challenges"}
                </Text>
                {(lang === "ne" ? result.localChallengesNe : result.localChallenges).map((c, i) => (
                  <View key={i} style={styles.challengeItem}>
                    <Text style={styles.challengeBullet}>•</Text>
                    <Text style={styles.challengeText}>{c}</Text>
                  </View>
                ))}
                {/* Rainfall */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🌧️ {lang === "ne" ? "वर्षा क्षेत्र" : "Rainfall Zone"}</Text>
                  <Text style={styles.infoValue}>
                    {lang === "ne" ? result.rainfallZoneNe : result.rainfallZone}
                  </Text>
                </View>
              </View>
            )}

            {activeTab === "factors" && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>
                  📊 {lang === "ne" ? "उपयुक्तता कारकहरू" : "Suitability Factors"}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {lang === "ne" ? "विस्तारको लागि ट्याप गर्नुहोस्" : "Tap each factor to expand"}
                </Text>
                {result.factors.map((factor, i) => (
                  <FactorCard key={i} factor={factor} lang={lang} />
                ))}
              </View>
            )}

            {activeTab === "varieties" && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>
                  🥔 {lang === "ne" ? "सिफारिस गरिएका किस्महरू" : "Recommended Varieties"}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {lang === "ne"
                    ? "तपाईंको स्थानको लागि उपयुक्त किस्महरू"
                    : "Varieties best adapted to your location"}
                </Text>
                {(lang === "ne" ? result.recommendedVarietiesNe : result.recommendedVarieties).map((v, i) => (
                  <View key={i} style={styles.varietyItem}>
                    <View style={styles.varietyBadge}>
                      <Text style={styles.varietyNumber}>{i + 1}</Text>
                    </View>
                    <Text style={styles.varietyName}>{v}</Text>
                  </View>
                ))}
              </View>
            )}

            {activeTab === "tips" && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>
                  💡 {lang === "ne" ? "खेती सुझावहरू" : "Growing Tips"}
                </Text>
                {(lang === "ne" ? result.growingTipsNe : result.growingTips).map((tip, i) => (
                  <View key={i} style={styles.tipItem}>
                    <Text style={styles.tipIcon}>✓</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>
              {lang === "ne" ? "स्थान विश्लेषण" : "Location Analysis"}
            </Text>
            <Text style={styles.emptyText}>
              {lang === "ne"
                ? "तपाईंको GPS स्थान प्रयोग गरेर हाम्रो AI ले उचाइ, तापमान, माटोको प्रकार, वर्षा र अन्य कृषि कारकहरूको आधारमा आलु खेतीको उपयुक्तता विश्लेषण गर्नेछ।"
                : "Using your GPS location, our AI will analyze potato growing suitability based on altitude, temperature, soil type, rainfall, and other agronomic factors."}
            </Text>
            <View style={styles.featureList}>
              {[
                { icon: "⛰️", en: "Altitude analysis (optimal: 800–3000m)", ne: "उचाइ विश्लेषण (इष्टतम: ८००–३०००मि)" },
                { icon: "🌡️", en: "Temperature estimation", ne: "तापमान अनुमान" },
                { icon: "🌧️", en: "Rainfall zone classification", ne: "वर्षा क्षेत्र वर्गीकरण" },
                { icon: "🪨", en: "Soil type estimation", ne: "माटोको प्रकार अनुमान" },
                { icon: "🥔", en: "Variety recommendations", ne: "किस्म सिफारिसहरू" },
                { icon: "💡", en: "Local growing tips", ne: "स्थानीय खेती सुझावहरू" },
              ].map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureText}>{lang === "ne" ? f.ne : f.en}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 12 },
  backBtnText: { fontSize: 15, color: "#2E7D32", fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#1B5E20", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#558B2F" },

  analyzeBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  loadingContainer: { alignItems: "center", paddingVertical: 24 },
  loadingText: { fontSize: 15, fontWeight: "600", color: "#2E7D32", marginBottom: 6 },
  loadingSubtext: { fontSize: 13, color: "#558B2F", textAlign: "center" },

  resultsContainer: { gap: 12 },

  scoreCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  scoreRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F8E9",
  },
  scoreEmoji: { fontSize: 18, marginBottom: 2 },
  scoreNumber: { fontSize: 22, fontWeight: "900" },
  scoreLabel: { fontSize: 11, color: "#666" },
  scoreInfo: { flex: 1, gap: 4 },
  ratingLabel: { fontSize: 18, fontWeight: "800", color: "#1B5E20" },
  locationText: { fontSize: 13, color: "#333" },
  altitudeText: { fontSize: 13, color: "#558B2F" },
  coordsText: { fontSize: 11, color: "#999" },

  recBanner: {
    backgroundColor: "#F9FBE7",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  recTitle: { fontSize: 13, fontWeight: "700", color: "#333", marginBottom: 6 },
  recText: { fontSize: 13, color: "#444", lineHeight: 20 },

  statsRow: { flexDirection: "row", gap: 8 },
  statChip: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8F5E9",
    gap: 3,
  },
  statChipIcon: { fontSize: 18 },
  statChipLabel: { fontSize: 10, color: "#888", fontWeight: "600" },
  statChipValue: { fontSize: 11, color: "#1B5E20", fontWeight: "700", textAlign: "center" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F1F8E9",
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9,
  },
  tabActive: { backgroundColor: "#2E7D32" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#558B2F" },
  tabTextActive: { color: "#fff" },

  tabContent: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1B5E20", marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: "#888", marginBottom: 8 },

  challengeItem: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  challengeBullet: { fontSize: 16, color: "#E65100", marginTop: 1 },
  challengeText: { flex: 1, fontSize: 13, color: "#333", lineHeight: 19 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    marginTop: 4,
  },
  infoLabel: { fontSize: 13, color: "#555", fontWeight: "600" },
  infoValue: { fontSize: 13, color: "#2E7D32", fontWeight: "700" },

  factorCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    gap: 8,
  },
  factorHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  factorIcon: { fontSize: 22 },
  factorInfo: { flex: 1 },
  factorName: { fontSize: 13, fontWeight: "700", color: "#333" },
  factorValue: { fontSize: 12, fontWeight: "600" },
  factorScoreContainer: { alignItems: "center", gap: 4 },
  factorScoreBadge: {
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  factorScore: { fontSize: 14, fontWeight: "800" },
  expandIcon: { fontSize: 10, color: "#999" },
  factorBarBg: {
    height: 5,
    backgroundColor: "#E8F5E9",
    borderRadius: 3,
    overflow: "hidden",
  },
  factorBarFill: { height: 5, borderRadius: 3 },
  factorExplanation: {
    fontSize: 12,
    color: "#555",
    lineHeight: 18,
    backgroundColor: "#F9FBE7",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },

  varietyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  varietyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  varietyNumber: { color: "#fff", fontSize: 13, fontWeight: "700" },
  varietyName: { fontSize: 14, fontWeight: "600", color: "#1B5E20" },

  tipItem: { flexDirection: "row", gap: 10, paddingVertical: 6 },
  tipIcon: { fontSize: 14, color: "#2E7D32", fontWeight: "700", marginTop: 1 },
  tipText: { flex: 1, fontSize: 13, color: "#333", lineHeight: 19 },

  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1B5E20" },
  emptyText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 320,
  },
  featureList: { width: "100%", gap: 8, marginTop: 8 },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F1F8E9",
    borderRadius: 10,
    padding: 10,
  },
  featureIcon: { fontSize: 18 },
  featureText: { fontSize: 13, color: "#2E7D32", fontWeight: "500" },
});

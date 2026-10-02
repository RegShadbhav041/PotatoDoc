// Location Suitability tab — exact replica of the designer screenshots.
// GPS + GET + cache live in useLocationAnalysis(); tagger UI moved to Profile.
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../theme";
import { useT } from "../i18n";
import { relativeTime } from "../utils/relativeTime";
import { fmt } from "../utils/locationText";
import { useLocationAnalysis } from "../hooks/useLocationAnalysis";
import ScoreCard from "../components/location/ScoreCard";
import FactorRow from "../components/location/FactorRow";
import SegTabs from "../components/location/SegTabs";

const TABS = ["Overview", "Factors", "Varieties", "Tips"];

const FACTOR_ICONS = {
  altitude: "⛰️",
  temp: "🌡️",
  rainfall: "🌧️",
  soil: "🪨",
  climate: "🌍",
};

const FEATURES = [
  "⛰️",
  "🌡️",
  "🌧️",
  "🪨",
  "🥔",
  "💡",
];
const FEATURE_ROWS = [
  "Altitude analysis (optimal: 800—3000m)",
  "Temperature estimation",
  "Rainfall zone classification",
  "Soil type estimation",
  "Variety recommendations",
  "Local growing tips",
];

const makeStyles = (C) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.pageGreen },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
    title: {
      fontSize: 27,
      lineHeight: 33,
      fontWeight: "900",
      color: C.primaryDark,
      letterSpacing: -0.5,
    },
    sub: {
      fontSize: 15.5,
      fontWeight: "700",
      color: C.healthyText,
      marginTop: 4,
      marginBottom: 16,
    },
    analyzeBtn: {
      backgroundColor: C.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 16,
    },
    analyzeText: { fontSize: 17, fontWeight: "900", color: "#FFFFFF" },
    banner: {
      backgroundColor: C.lateBg || C.card,
      borderWidth: 1,
      borderColor: C.lateBorder || C.cardBorder,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    bannerText: { fontSize: 13.5, fontWeight: "700", color: C.lateText || C.ink },
    retryBtn: {
      marginTop: 8,
      alignSelf: "flex-start",
      backgroundColor: C.primary,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    retryText: { fontSize: 13.5, fontWeight: "800", color: "#FFFFFF" },
    stale: {
      fontSize: 12.5,
      fontWeight: "700",
      color: C.gray,
      marginBottom: 12,
    },
    loadingBox: { alignItems: "center", paddingVertical: 40 },
    loadingText: { fontSize: 14, fontWeight: "700", color: C.gray, marginTop: 10 },
    idle: { alignItems: "center" },
    mapEmoji: { fontSize: 56, marginTop: 24 },
    idleTitle: {
      fontSize: 24,
      fontWeight: "900",
      color: C.primaryDark,
      marginTop: 14,
    },
    idleBody: {
      fontSize: 15.5,
      lineHeight: 24,
      fontWeight: "600",
      color: C.gray,
      textAlign: "center",
      marginTop: 12,
      marginBottom: 22,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.healthyBg,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 15,
      marginBottom: 10,
      width: "100%",
    },
    featureEmoji: { fontSize: 20 },
    featureText: { fontSize: 15, fontWeight: "800", color: C.healthyText, flex: 1 },
    recCard: {
      backgroundColor: C.healthyBg,
      borderLeftWidth: 4,
      borderLeftColor: C.primary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 14,
    },
    recTitle: { fontSize: 16, fontWeight: "900", color: C.ink, marginBottom: 8 },
    recBody: {
      fontSize: 15,
      lineHeight: 23,
      fontWeight: "600",
      color: C.text,
    },
    chips: { flexDirection: "row", gap: 10, marginBottom: 14 },
    chip: {
      flex: 1,
      backgroundColor: C.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingVertical: 14,
      alignItems: "center",
    },
    chipEmoji: { fontSize: 22 },
    chipLabel: { fontSize: 13.5, fontWeight: "700", color: C.gray, marginTop: 6 },
    chipValue: {
      fontSize: 15,
      fontWeight: "900",
      color: C.healthyText,
      marginTop: 4,
      textAlign: "center",
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: C.primaryDark,
      marginBottom: 4,
    },
    sectionSub: {
      fontSize: 14,
      fontWeight: "600",
      color: C.gray,
      marginBottom: 14,
    },
    challenge: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
      alignItems: "flex-start",
    },
    dot: { fontSize: 18, lineHeight: 22, color: C.unknownOrange },
    challengeText: { flex: 1, fontSize: 15, fontWeight: "600", color: C.ink, lineHeight: 22 },
    zoneCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      marginTop: 4,
    },
    zoneLabel: { flex: 1, fontSize: 15, fontWeight: "800", color: C.ink },
    zoneValue: { fontSize: 15, fontWeight: "900", color: C.healthyText },
    varietyCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      marginBottom: 10,
    },
    num: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: C.primary,
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "900",
      textAlign: "center",
      lineHeight: 34,
      overflow: "hidden",
    },
    varietyName: { fontSize: 16, fontWeight: "900", color: C.healthyText },
    tipRow: { flexDirection: "row", gap: 10, marginBottom: 16, alignItems: "flex-start" },
    check: { fontSize: 17, lineHeight: 23, color: C.healthyText, fontWeight: "900" },
    tipText: { flex: 1, fontSize: 15.5, lineHeight: 23, fontWeight: "600", color: C.ink },
  });

export default function LocationScreen() {
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);
  const { status, data, analyzedAt, stale, error, analyze } = useLocationAnalysis();
  const [tab, setTab] = useState("Overview");
  const [openFactor, setOpenFactor] = useState(null);

  const loading = status === "loading";

  const renderIdle = () => (
    <View style={s.idle}>
      <Text style={s.mapEmoji}>🗺️</Text>
      <Text style={s.idleTitle}>{t("Location Analysis")}</Text>
      <Text style={s.idleBody}>
        {t(
          "Using your GPS location, our AI will analyze potato growing suitability based on altitude, temperature, soil type, rainfall, and other agronomic factors."
        )}
      </Text>
      {FEATURE_ROWS.map((row, i) => (
        <View key={row} style={s.featureRow}>
          <Text style={s.featureEmoji}>{FEATURES[i]}</Text>
          <Text style={s.featureText}>{t(row)}</Text>
        </View>
      ))}
    </View>
  );

  const renderOverview = () => (
    <View>
      <Text style={s.sectionTitle}>⚠️ {t("Local Challenges")}</Text>
      {(data.challenges || []).map((item) => (
        <View key={item} style={s.challenge}>
          <Text style={s.dot}>•</Text>
          <Text style={s.challengeText}>{t(item)}</Text>
        </View>
      ))}
      <View style={s.zoneCard}>
        <Text style={s.zoneLabel}>🌧️ {t("Rainfall Zone")}</Text>
        <Text style={s.zoneValue}>{t(data.rainfall_zone)}</Text>
      </View>
    </View>
  );

  const renderFactors = () => (
    <View>
      <Text style={s.sectionTitle}>📊 {t("Suitability Factors")}</Text>
      <Text style={s.sectionSub}>{t("Tap each factor to expand")}</Text>
      {(data.factors || []).map((factor, i) => (
        <FactorRow
          key={factor.key}
          factor={factor}
          icon={FACTOR_ICONS[factor.key] || "❓"}
          expanded={openFactor === i}
          onToggle={() => setOpenFactor(openFactor === i ? null : i)}
          t={t}
        />
      ))}
    </View>
  );

  const renderVarieties = () => (
    <View>
      <Text style={s.sectionTitle}>🥔 {t("Recommended Varieties")}</Text>
      <Text style={s.sectionSub}>
        {t("Varieties best adapted to your location")}
      </Text>
      {(data.varieties || []).map((name, i) => (
        <View key={name} style={s.varietyCard}>
          <Text style={s.num}>{i + 1}</Text>
          <Text style={s.varietyName}>{t(name)}</Text>
        </View>
      ))}
    </View>
  );

  const renderTips = () => (
    <View>
      <Text style={s.sectionTitle}>💡 {t("Growing Tips")}</Text>
      <View style={{ height: 8 }} />
      {(data.tips || []).map((item) => (
        <View key={item} style={s.tipRow}>
          <Text style={s.check}>✓</Text>
          <Text style={s.tipText}>{t(item)}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>{t("Location Suitability")}</Text>
        <Text style={s.sub}>
          {t("Potato Growing Analysis for Your Location")}
        </Text>

        <Pressable style={s.analyzeBtn} onPress={analyze} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.analyzeText}>📍 {t("Analyze My Location")}</Text>
          )}
        </Pressable>

        {error && (
          <View style={s.banner}>
            <Text style={s.bannerText}>{t(error)}</Text>
            <Pressable style={s.retryBtn} onPress={analyze} disabled={loading}>
              <Text style={s.retryText}>{t("Retry")}</Text>
            </Pressable>
          </View>
        )}

        {stale && analyzedAt && (
          <Text style={s.stale}>
            {t("Last analyzed")} {relativeTime(analyzedAt)}
          </Text>
        )}

        {data ? (
          <>
            <ScoreCard data={data} t={t} />
            <View style={s.recCard}>
              <Text style={s.recTitle}>{t("Recommendation")}</Text>
              <Text style={s.recBody}>
                {fmt(t(data.recommendation), {
                  zone: data.region || data.rainfall_zone,
                })}
              </Text>
            </View>
            <View style={s.chips}>
              <View style={s.chip}>
                <Text style={s.chipEmoji}>🌡️</Text>
                <Text style={s.chipLabel}>{t("Temp")}</Text>
                <Text style={s.chipValue}>~{data.summary.temp_c}°C</Text>
              </View>
              <View style={s.chip}>
                <Text style={s.chipEmoji}>🌱</Text>
                <Text style={s.chipLabel}>{t("Season")}</Text>
                <Text style={s.chipValue} numberOfLines={2}>
                  {t(data.summary.season)}
                </Text>
              </View>
              <View style={s.chip}>
                <Text style={s.chipEmoji}>🪨</Text>
                <Text style={s.chipLabel}>{t("Soil")}</Text>
                <Text style={s.chipValue}>{t(data.summary.soil)}</Text>
              </View>
            </View>

            <SegTabs
              tabs={TABS.map((x) => t(x))}
              active={t(tab)}
              onChange={(label) =>
                setTab(TABS.find((x) => t(x) === label) || tab)
              }
            />
            {tab === "Overview" && renderOverview()}
            {tab === "Factors" && renderFactors()}
            {tab === "Varieties" && renderVarieties()}
            {tab === "Tips" && renderTips()}
          </>
        ) : loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loadingText}>{t("Analyzing your location…")}</Text>
          </View>
        ) : (
          renderIdle()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

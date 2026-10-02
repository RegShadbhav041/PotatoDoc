// Location tab — turn field tagging on and see what a diagnosis will store.
//
// Two independent, optional tags (see useLocationTag):
//   • GPS auto-tagging: foreground coordinates captured on every save.
//   • A field/village label that works even with no permission.
// Everything shown here is exactly what History and the superadmin panel
// will display next to a diagnosis.
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "../theme";
import { useT } from "../i18n";
import { relativeTime } from "../utils/relativeTime";

const makeStyles = (C) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.page },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
    title: {
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "800",
      color: C.ink,
      letterSpacing: -0.2,
    },
    sub: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
      color: C.gray,
      marginTop: 2,
      marginBottom: 14,
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      marginBottom: 12,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: C.leafBg,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
    cardBody: {
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: "500",
      color: C.gray,
      marginTop: 2,
    },
    fixBox: {
      marginTop: 12,
      backgroundColor: C.page,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 10,
      padding: 10,
    },
    fixText: {
      fontSize: 13,
      fontWeight: "700",
      color: C.ink,
      fontVariant: ["tabular-nums"],
    },
    fixMeta: { fontSize: 12, fontWeight: "500", color: C.gray, marginTop: 3 },
    hint: {
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: "600",
      color: C.earlyText || "#FFB74D",
      marginTop: 10,
    },
    smallBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.page,
      borderRadius: 10,
      paddingVertical: 9,
      paddingHorizontal: 12,
      alignSelf: "flex-start",
    },
    smallBtnText: { fontSize: 13, fontWeight: "800", color: C.ink },
    label: {
      fontSize: 13,
      fontWeight: "800",
      color: C.ink,
      marginBottom: 8,
    },
    input: {
      backgroundColor: C.page,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 12 : 9,
      fontSize: 14,
      fontWeight: "500",
      color: C.ink,
    },
    howTitle: { fontSize: 13.5, fontWeight: "800", color: C.ink, marginBottom: 6 },
    howBody: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "500",
      color: C.gray,
    },
    pill: {
      marginTop: 10,
      alignSelf: "flex-start",
      fontSize: 11.5,
      fontWeight: "800",
      color: C.primary,
      backgroundColor: C.healthyBg,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      overflow: "hidden",
    },
  });

export default function LocationScreen({ tag }) {
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);
  const [toggling, setToggling] = useState(false);

  // Defensive: renders a stub if the hook was not wired (keeps the tab safe).
  if (!tag) {
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <View style={s.scroll}>
          <Text style={s.title}>{t("Location")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { enabled, label, coords, updatedAt, permission, busy } = tag;

  const onToggle = async (value) => {
    setToggling(true);
    try {
      await tag.setEnabled(value);
    } finally {
      setToggling(false);
    }
  };

  const onRefresh = async () => {
    await tag.refresh();
  };

  const denied = permission === "denied" && !enabled;

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>{t("Location")}</Text>
        <Text style={s.sub}>{t("Tag where you scan")}</Text>

        {/* --- GPS --- */}
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.iconWrap}>
              <MaterialIcons name="gps-fixed" size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{t("GPS auto-tagging")}</Text>
              <Text style={s.cardBody}>
                {t("Attach your coordinates to every saved diagnosis.")}
              </Text>
            </View>
            <Switch
              value={!!enabled}
              onValueChange={onToggle}
              disabled={toggling || busy}
              trackColor={{ false: C.cardBorder, true: C.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {enabled && coords && (
            <View style={s.fixBox}>
              <Text style={s.fixText}>
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </Text>
              <Text style={s.fixMeta}>
                {t("Accuracy")}: ±{Math.round(coords.accuracy || 0)} m
                {updatedAt ? ` · ${relativeTime(updatedAt)}` : ""}
              </Text>
            </View>
          )}

          {denied && (
            <>
              <Text style={s.hint}>
                {t("Location permission is off. Allow it in Settings to auto-tag scans.")}
              </Text>
              <Pressable style={s.smallBtn} onPress={() => Linking.openSettings()}>
                <MaterialIcons name="settings" size={15} color={C.ink} />
                <Text style={s.smallBtnText}>{t("Open Settings")}</Text>
              </Pressable>
            </>
          )}

          {enabled && (
            <Pressable style={s.smallBtn} onPress={onRefresh} disabled={busy}>
              {busy ? (
                <ActivityIndicator size="small" color={C.primary} />
              ) : (
                <MaterialIcons name="my-location" size={15} color={C.ink} />
              )}
              <Text style={s.smallBtnText}>{t("Refresh fix")}</Text>
            </Pressable>
          )}
        </View>

        {/* --- Manual label --- */}
        <View style={s.card}>
          <Text style={s.label}>{t("Field or village name")}</Text>
          <TextInput
            style={s.input}
            value={label || ""}
            onChangeText={tag.setLabel}
            placeholder={t("e.g. Field A, Pokhara")}
            placeholderTextColor={C.gray}
            maxLength={80}
          />
          <Text style={s.pill}>{t("Works without GPS")}</Text>
        </View>

        {/* --- How it works --- */}
        <View style={s.card}>
          <Text style={s.howTitle}>{t("How tagging works")}</Text>
          <Text style={s.howBody}>
            {t(
              "Every diagnosis you save stores this tag — coordinates and/or the name above. Open it in History to see where and when it was taken, and support staff see the same tag when helping you."
            )}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

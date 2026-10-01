import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "../theme";
import { useT } from "../i18n";

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
      marginBottom: 12,
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 17,
      alignItems: "center",
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: C.leafBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: C.ink,
      marginBottom: 6,
      textAlign: "center",
    },
    cardBody: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
      color: C.gray,
      textAlign: "center",
    },
    badge: {
      marginTop: 14,
      fontSize: 12,
      fontWeight: "700",
      color: C.primary,
      backgroundColor: C.healthyBg,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: "hidden",
    },
  });

export default function LocationScreen() {
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>{t("Location")}</Text>
        <View style={s.card}>
          <View style={s.iconWrap}>
            <MaterialIcons name="location-on" size={28} color={C.primary} />
          </View>
          <Text style={s.cardTitle}>{t("Tag where you scan")}</Text>
          <Text style={s.cardBody}>
            {t(
              "Link each diagnosis to a field location to track how disease pressure moves across your crops over time."
            )}
          </Text>
          <Text style={s.badge}>{t("Coming soon")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

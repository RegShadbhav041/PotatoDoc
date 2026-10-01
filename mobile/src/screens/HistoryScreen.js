import React, { useMemo } from "react";
import { View, ScrollView, Image, Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "../theme";
import { useT } from "../i18n";
import { classColors } from "../constants/colors";

const makeStyles = (C) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.pageGreen },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    titleWrap: { flexDirection: "row", alignItems: "baseline" },
    title: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "800",
      color: C.ink,
      letterSpacing: -0.4,
    },
    titleDot: { color: C.primary },
    bellBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    bellBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: C.bellBadge,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: C.pageGreen,
    },
    bellBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },

    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    sectionLabel: { fontSize: 14, fontWeight: "800", color: C.ink },
    clearBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    clearText: { fontSize: 13.5, fontWeight: "700", color: C.ink },

    empty: { alignItems: "center", paddingTop: 60, gap: 12 },
    emptyText: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
      color: C.gray,
      textAlign: "center",
      paddingHorizontal: 40,
    },

    card: {
      flexDirection: "row",
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 12,
      marginBottom: 10,
      alignItems: "center",
      gap: 12,
    },
    thumb: { width: 54, height: 54, borderRadius: 12 },
    thumbPlaceholder: {
      backgroundColor: C.healthyBg,
      alignItems: "center",
      justifyContent: "center",
    },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 15.5, lineHeight: 20, fontWeight: "800" },
    cardConfidence: { fontWeight: "800" },
    cardMeta: { fontSize: 12, lineHeight: 16, color: C.gray, fontWeight: "500" },
  });

/** "Your history." headline + notification bell (mockup, 2026-10-01). */
function HistoryHeader({ s, t, C, onOpenNews, unread = 0 }) {
  return (
    <View style={s.header}>
      <View style={s.titleWrap}>
        <Text style={s.title}>
          {t("Your history")}
          <Text style={s.titleDot}>.</Text>
        </Text>
      </View>
      <Pressable style={s.bellBtn} onPress={onOpenNews} hitSlop={8}>
        <MaterialIcons name="notifications-none" size={20} color={C.ink} />
        {unread > 0 && (
          <View style={s.bellBadge}>
            <Text style={s.bellBadgeText}>{unread > 9 ? "9+" : unread}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function confidence(item) {
  const raw = Number(item.confidence) || 0;
  const pct = raw <= 1 ? raw * 100 : raw;
  return `${pct.toFixed(1)}%`;
}

export default function HistoryScreen({ history, onClear, onOpenNews, unread = 0 }) {
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);
  const colors = useMemo(() => classColors(C), [C]);

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <HistoryHeader s={s} t={t} C={C} onOpenNews={onOpenNews} unread={unread} />

        {history.length === 0 ? (
          <View style={s.empty}>
            <MaterialIcons name="history" size={48} color={C.gray} />
            <Text style={s.emptyText}>
              {t("No predictions yet. Diagnose a leaf to build your history.")}
            </Text>
          </View>
        ) : (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>{t("Sample diagnoses")}</Text>
              <Pressable style={s.clearBtn} onPress={onClear} hitSlop={8}>
                <MaterialIcons name="delete-outline" size={16} color={C.ink} />
                <Text style={s.clearText}>{t("Clear")}</Text>
              </Pressable>
            </View>

            {history.map((item) => {
              // `class` / `model` come from the API contract — never translated.
              const color = colors[item.class] || C.gray;
              return (
                <View key={item.id} style={s.card}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={s.thumb} />
                  ) : (
                    <View style={[s.thumb, s.thumbPlaceholder]}>
                      <MaterialIcons name="eco" size={22} color={C.primary} />
                    </View>
                  )}
                  <View style={s.cardBody}>
                    <Text style={[s.cardTitle, { color }]}>
                      {item.class}{"  "}
                      <Text style={[s.cardConfidence, { color }]}>
                        {confidence(item)}
                      </Text>
                    </Text>
                    <Text style={s.cardMeta}>{item.model}</Text>
                    <Text style={s.cardMeta}>{item.timestamp}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

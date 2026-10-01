import React from "react";
import { View, ScrollView, Image, Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, CLASS_COLORS } from "../constants/colors";

/** "Your history." headline + notification bell (mockup, 2026-10-01). */
function HistoryHeader({ onOpenNews, unread = 0 }) {
  return (
    <View style={s.header}>
      <Text style={s.title}>
        Your history<Text style={s.titleDot}>.</Text>
      </Text>
      <Pressable style={s.bellBtn} onPress={onOpenNews} hitSlop={8}>
        <MaterialIcons name="notifications-none" size={20} color={COLORS.ink} />
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
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <HistoryHeader onOpenNews={onOpenNews} unread={unread} />

        {history.length === 0 ? (
          <View style={s.empty}>
            <MaterialIcons name="history" size={48} color={COLORS.gray} />
            <Text style={s.emptyText}>
              No predictions yet. Diagnose a leaf to build your history.
            </Text>
          </View>
        ) : (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>Sample diagnoses</Text>
              <Pressable style={s.clearBtn} onPress={onClear} hitSlop={8}>
                <MaterialIcons name="delete-outline" size={16} color={COLORS.ink} />
                <Text style={s.clearText}>Clear</Text>
              </Pressable>
            </View>

            {history.map((item) => {
              const color = CLASS_COLORS[item.class] || COLORS.gray;
              return (
                <View key={item.id} style={s.card}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={s.thumb} />
                  ) : (
                    <View style={[s.thumb, s.thumbPlaceholder]}>
                      <MaterialIcons name="eco" size={22} color={COLORS.primary} />
                    </View>
                  )}
                  <View style={s.cardBody}>
                    <Text style={[s.cardTitle, { color }]}>
                      {item.class}{"  "}
                      <Text style={[s.cardConfidence, { color }]}>{confidence(item)}</Text>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.pageGreen },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: COLORS.ink,
    letterSpacing: -0.4,
  },
  titleDot: { color: COLORS.primary },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
    backgroundColor: COLORS.bellBadge,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.pageGreen,
  },
  bellBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: COLORS.ink },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  clearText: { fontSize: 13.5, fontWeight: "700", color: COLORS.ink },

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: COLORS.gray,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1EBDA",
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    gap: 12,
  },
  thumb: { width: 54, height: 54, borderRadius: 12 },
  thumbPlaceholder: {
    backgroundColor: COLORS.healthyBg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15.5, lineHeight: 20, fontWeight: "800" },
  cardConfidence: { fontWeight: "800" },
  cardMeta: { fontSize: 12, lineHeight: 16, color: COLORS.gray, fontWeight: "500" },
});

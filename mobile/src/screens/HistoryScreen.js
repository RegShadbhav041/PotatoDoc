import React from "react";
import { View, ScrollView, Image, Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, CLASS_COLORS } from "../constants/colors";

export default function HistoryScreen({ history, onClear }) {
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.headRow}>
          <Text style={s.title}>History</Text>
          {history.length > 0 && (
            <Pressable onPress={onClear} hitSlop={8}>
              <Text style={s.clear}>Clear</Text>
            </Pressable>
          )}
        </View>

        {history.length === 0 ? (
          <View style={s.empty}>
            <MaterialIcons name="history" size={48} color={COLORS.gray} />
            <Text style={s.emptyText}>No predictions yet. Diagnose a leaf to build your history.</Text>
          </View>
        ) : (
          history.map((item) => {
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
                    {item.class} ·{" "}
                    {((item.confidence <= 1 ? item.confidence * 100 : item.confidence) || 0).toFixed(1)}%
                  </Text>
                  <Text style={s.cardMeta}>{item.model}</Text>
                  <Text style={s.cardMeta}>{item.timestamp}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.page },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  clear: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    gap: 12,
  },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  thumbPlaceholder: {
    backgroundColor: COLORS.healthyBg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  cardMeta: { fontSize: 12, lineHeight: 16, color: COLORS.gray },
});

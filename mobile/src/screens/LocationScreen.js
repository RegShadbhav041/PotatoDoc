import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

export default function LocationScreen() {
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Location</Text>
        <View style={s.card}>
          <View style={s.iconWrap}>
            <MaterialIcons name="location-on" size={28} color={COLORS.primary} />
          </View>
          <Text style={s.cardTitle}>Tag where you scan</Text>
          <Text style={s.cardBody}>
            Link each diagnosis to a field location to track how disease pressure moves across your
            crops over time.
          </Text>
          <Text style={s.badge}>Coming soon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.page },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  title: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.ink,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 17,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.leafBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 6,
    textAlign: "center",
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: COLORS.gray,
    textAlign: "center",
  },
  badge: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    backgroundColor: COLORS.healthyBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
});

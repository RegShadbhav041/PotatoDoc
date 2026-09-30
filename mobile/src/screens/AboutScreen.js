import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

export default function AboutScreen() {
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>About</Text>
        <View style={s.card}>
          <View style={s.logoWrap}>
            <Text style={s.logo}>🌿</Text>
          </View>
          <Text style={s.appName}>PotatoDoc</Text>
          <Text style={s.tagline}>Diagnose. Protect. Grow.</Text>
          <Text style={s.version}>Version 1.0.0</Text>
          <Text style={s.body}>
            AI-powered potato leaf disease diagnosis. Snap a photo of a leaf and get an instant
            Early Blight, Late Blight, or Healthy verdict with Grad-CAM heatmaps from an ensemble of
            trained models.
          </Text>
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
    padding: 24,
    alignItems: "center",
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: COLORS.leafBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logo: { fontSize: 34 },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
    marginTop: 2,
  },
  version: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.gray,
    marginTop: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 14,
  },
});

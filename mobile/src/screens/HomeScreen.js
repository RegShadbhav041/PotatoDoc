import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "../constants/colors";

function Chevron() {
  return (
    <Svg width={8} height={11.5} viewBox="0 0 8 11.5" style={s.chevron}>
      <Path
        d="M1 1 L7 5.75 L1 10.5"
        stroke="#C1D8C2"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DiseaseCard({ emoji, title, desc, bg, border, titleColor }) {
  return (
    <View style={[s.dCard, { backgroundColor: bg, borderColor: border }]}>
      <Text style={s.dEmoji}>{emoji}</Text>
      <Text style={[s.dTitle, { color: titleColor }]}>{title}</Text>
      <Text style={s.dDesc}>{desc}</Text>
    </View>
  );
}

export default function HomeScreen({ user, onScan, onSignIn, onSignOut }) {
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <View style={s.flex}>
            <Text style={s.title}>PotatoDoc</Text>
            <Text style={s.subtitle}>Diagnose. Protect. Grow.</Text>
          </View>
          <View style={s.leafBtn}>
            <Image source={require("../../assets/icon.png")} style={s.leafLogo} />
          </View>
        </View>

        <Pressable style={s.scanCard} onPress={onScan}>
          <Text style={s.scanEmoji}>🔬</Text>
          <View style={s.scanTextWrap}>
            <Text style={s.scanTitle}>Scan a Potato Leaf</Text>
            <Text style={s.scanSub}>
              Upload or capture a leaf image for instant AI diagnosis
            </Text>
          </View>
          <Chevron />
        </Pressable>

        <Text style={s.sectionTitle}>Disease Reference</Text>
        <View style={s.cardsRow}>
          <DiseaseCard
            emoji="✅"
            title="Healthy"
            desc="Uniform green, no lesions"
            bg={COLORS.healthyBg}
            border={COLORS.healthyBorder}
            titleColor={COLORS.healthyText}
          />
          <DiseaseCard
            emoji="⚠️"
            title="Early Blight"
            desc="Target-ring dark lesions"
            bg={COLORS.earlyBg}
            border={COLORS.earlyBorder}
            titleColor={COLORS.earlyText}
          />
          <DiseaseCard
            emoji="🚨"
            title="Late Blight"
            desc="Water-soaked brown patches"
            bg={COLORS.lateBg}
            border={COLORS.lateBorder}
            titleColor={COLORS.lateText}
          />
        </View>

        {user ? (
          <View style={s.signinCard}>
            <View style={s.accountRow}>
              <View style={s.accountAvatar}>
                <Text style={s.accountAvatarText}>
                  {(user.name || "?").trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={s.flex}>
                <Text style={s.accountName}>{user.name || "Farmer"}</Text>
                <Text style={s.accountContact} numberOfLines={1}>
                  {user.contact}
                </Text>
              </View>
            </View>
            <Pressable style={s.signoutBtn} onPress={onSignOut}>
              <Text style={s.signoutBtnText}>Sign out</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.signinCard}>
            <Text style={s.signinText}>
              Sign in to save your diagnosis history and track your crops over time.
            </Text>
            <Pressable style={s.signinBtn} onPress={onSignIn}>
              <Text style={s.signinBtnText}>Sign In</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.page },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  title: {
    fontSize: 30,
    lineHeight: 40,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
    color: COLORS.gray,
  },
  leafBtn: {
    width: 33,
    height: 33,
    borderRadius: 10,
    backgroundColor: COLORS.leafBg,
    alignItems: "center",
    justifyContent: "center",
  },
  leafLogo: { width: 27, height: 27 },

  scanCard: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 17,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  scanEmoji: { fontSize: 38, lineHeight: 46 },
  scanTextWrap: { flex: 1, marginLeft: 12 },
  scanTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  scanSub: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500",
    color: COLORS.scanSub,
    marginTop: 3,
  },
  chevron: { marginLeft: 12, marginRight: 2 },

  sectionTitle: {
    marginTop: 24,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  cardsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  dCard: {
    flex: 1,
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  dEmoji: { fontSize: 27, lineHeight: 29 },
  dTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  dDesc: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "400",
    color: COLORS.gray,
    marginTop: 4,
    textAlign: "center",
  },

  signinCard: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: "center",
  },
  signinText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: COLORS.gray,
    textAlign: "center",
  },
  signinBtn: {
    marginTop: 10,
    width: 95,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  signinBtnText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 12,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  accountAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  accountName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: COLORS.ink,
  },
  accountContact: {
    fontSize: 13,
    lineHeight: 17,
    color: COLORS.gray,
    marginTop: 2,
  },
  signoutBtn: {
    marginTop: 14,
    alignSelf: "stretch",
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.page,
    alignItems: "center",
    justifyContent: "center",
  },
  signoutBtnText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
});

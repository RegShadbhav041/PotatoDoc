import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "../theme";
import { useT } from "../i18n";
import { greeting } from "../utils/relativeTime";

function Chevron({ s }) {
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

function DiseaseCard({ s, t, emoji, title, desc, bg, border, titleColor }) {
  return (
    <View style={[s.dCard, { backgroundColor: bg, borderColor: border }]}>
      <Text style={s.dEmoji}>{emoji}</Text>
      <Text style={[s.dTitle, { color: titleColor }]}>{t(title)}</Text>
      <Text style={s.dDesc}>{t(desc)}</Text>
    </View>
  );
}

const makeStyles = (C) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.page },
    flex: { flex: 1 },
    scroll: { paddingHorizontal: 16, paddingBottom: 24 },

    header: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 16,
      gap: 10,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
    avatarLogo: { width: 44, height: 44 },
    avatarImg: { width: 44, height: 44, borderRadius: 22 },
    brand: {
      flex: 1,
      fontSize: 21,
      lineHeight: 27,
      fontWeight: "800",
      color: C.ink,
      letterSpacing: -0.3,
    },
    bellBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
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
      borderColor: C.page,
    },
    bellBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },

    greetRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 18,
      gap: 12,
    },
    greetWrap: { flex: 1 },
    greetLine: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "800",
      color: C.ink,
      letterSpacing: -0.4,
    },
    greetSub: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
      color: C.gray,
      marginTop: 3,
    },
    locChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: C.leafBg,
      borderWidth: 1,
      borderColor: C.healthyBorder,
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    locChipText: { fontSize: 12.5, fontWeight: "800", color: C.primaryDark },

    scanCard: {
      marginTop: 20,
      backgroundColor: C.primary,
      borderRadius: 17,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    scanIcon: {
      width: 46,
      height: 46,
      borderRadius: 13,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
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
      color: C.scanSub,
      marginTop: 3,
    },
    chevron: { marginLeft: 12, marginRight: 2 },

    sectionTitle: {
      marginTop: 24,
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "800",
      color: C.ink,
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
      color: C.gray,
      marginTop: 4,
      textAlign: "center",
    },

    signinCard: {
      marginTop: 24,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      alignItems: "center",
    },
    signinText: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      color: C.gray,
      textAlign: "center",
    },
    signinBtn: {
      marginTop: 10,
      width: 95,
      height: 40,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    signinBtnText: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "700",
      color: "#FFFFFF",
    },

    savedIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.leafBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    savedTitle: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "800",
      color: C.ink,
      textAlign: "center",
    },
    savedBtnRow: {
      flexDirection: "row",
      gap: 10,
      alignSelf: "stretch",
      marginTop: 14,
    },
    savedBtnPrimary: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    savedBtnPrimaryText: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    signoutBtn: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.page,
      alignItems: "center",
      justifyContent: "center",
    },
    signoutBtnText: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "700",
      color: C.primary,
    },
  });

export default function HomeScreen({
  user,
  unread = 0,
  onScan,
  onSignIn,
  onSignOut,
  onOpenNews,
  onOpenLocation,
  onOpenHistory,
}) {
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);

  const name = user?.name || t("Farmer");
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand header: avatar + name + bell badge */}
        <View style={s.header}>
          <View style={s.avatar}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={s.avatarImg} />
            ) : user ? (
              <Text style={s.avatarText}>
                {name.trim().charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Image source={require("../../assets/icon.png")} style={s.avatarLogo} />
            )}
          </View>
          <Text style={s.brand} numberOfLines={1}>
            PotatoDoc
          </Text>
          <Pressable style={s.bellBtn} onPress={onOpenNews} hitSlop={8}>
            <MaterialIcons name="notifications-none" size={20} color={C.ink} />
            {unread > 0 && (
              <View style={s.bellBadge}>
                <Text style={s.bellBadgeText}>{unread > 9 ? "9+" : unread}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Greeting + location chip */}
        <View style={s.greetRow}>
          <View style={s.greetWrap}>
            <Text style={s.greetLine} numberOfLines={1}>
              {t(greeting())}, {name}
            </Text>
            <Text style={s.greetSub}>
              {t("Let's keep your potato crop healthy.")}
            </Text>
          </View>
          <Pressable style={s.locChip} onPress={onOpenLocation} hitSlop={6}>
            <MaterialIcons name="location-on" size={14} color={C.primaryDark} />
            <Text style={s.locChipText}>{t("Pokhara")}</Text>
          </Pressable>
        </View>

        <Pressable style={s.scanCard} onPress={onScan}>
          <View style={s.scanIcon}>
            <MaterialIcons name="document-scanner" size={26} color={C.primaryDark} />
          </View>
          <View style={s.scanTextWrap}>
            <Text style={s.scanTitle}>{t("Scan a Potato Leaf")}</Text>
            <Text style={s.scanSub}>
              {t("Upload or capture a leaf image for instant AI diagnosis")}
            </Text>
          </View>
          <Chevron s={s} />
        </Pressable>

        <Text style={s.sectionTitle}>{t("Disease Reference")}</Text>
        <View style={s.cardsRow}>
          <DiseaseCard
            s={s}
            t={t}
            emoji="✅"
            title="Healthy"
            desc="Uniform green, no lesions"
            bg={C.healthyBg}
            border={C.healthyBorder}
            titleColor={C.healthyText}
          />
          <DiseaseCard
            s={s}
            t={t}
            emoji="⚠️"
            title="Early Blight"
            desc="Target-ring dark lesions"
            bg={C.earlyBg}
            border={C.earlyBorder}
            titleColor={C.earlyText}
          />
          <DiseaseCard
            s={s}
            t={t}
            emoji="🚨"
            title="Late Blight"
            desc="Water-soaked brown patches"
            bg={C.lateBg}
            border={C.lateBorder}
            titleColor={C.lateText}
          />
        </View>

        {user ? (
          <View style={s.signinCard}>
            <View style={s.savedIcon}>
              <MaterialIcons name="cloud-done" size={22} color={C.primaryDark} />
            </View>
            <Text style={s.savedTitle}>{t("Your diagnoses are backed up")}</Text>
            <Text style={s.signinText}>
              {t(
                "Every scan is saved to your account, so your history stays with you on any device."
              )}
            </Text>
            <View style={s.savedBtnRow}>
              <Pressable style={s.savedBtnPrimary} onPress={onOpenHistory}>
                <Text style={s.savedBtnPrimaryText}>{t("View history")}</Text>
              </Pressable>
              <Pressable style={s.signoutBtn} onPress={onSignOut}>
                <Text style={s.signoutBtnText}>{t("Sign out")}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={s.signinCard}>
            <Text style={s.signinText}>
              {t(
                "Sign in to save your diagnosis history and track your crops over time."
              )}
            </Text>
            <Pressable style={s.signinBtn} onPress={onSignIn}>
              <Text style={s.signinBtnText}>{t("Sign In")}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../theme";
import { useT } from "../i18n";

// Copy follows the designer's "diagnosis" mockup (2026-10-01).
const TIPS = [
  "Keep the entire leaf in focus",
  "Use natural light and a plain background",
  "Include both healthy and affected areas",
];

const makeStyles = (C) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 16, paddingTop: 16 },
    dropzone: {
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: C.healthyBorder,
      borderRadius: 16,
      paddingVertical: 22,
      paddingHorizontal: 16,
      alignItems: "center",
      backgroundColor: C.card,
    },
    dropTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "800",
      color: C.ink,
      marginTop: 10,
    },
    dropSub: {
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: "500",
      color: C.gray,
      marginTop: 3,
      textAlign: "center",
    },
    btnRow: { flexDirection: "row", gap: 10, marginTop: 14, alignSelf: "stretch" },
    btnPrimary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      height: 42,
      borderRadius: 11,
      backgroundColor: C.primary,
    },
    btnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
    btnOutline: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      height: 42,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: C.primary,
      backgroundColor: "transparent",
    },
    btnOutlineText: { fontSize: 14, fontWeight: "700", color: C.primaryDark },

    tips: {
      marginTop: 16,
      backgroundColor: C.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
    },
    tipsHead: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 },
    tipsTitle: { fontSize: 14.5, lineHeight: 19, fontWeight: "800", color: C.ink },
    tipRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
    tipText: {
      flex: 1,
      fontSize: 13.5,
      lineHeight: 18,
      fontWeight: "500",
      color: C.ink,
    },
  });

export default function ImagePickerSection({ onCamera, onGallery }) {
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={s.wrap}>
      <View style={s.dropzone}>
        <MaterialCommunityIcons name="image-outline" size={34} color={C.ink} />
        <Text style={s.dropTitle}>{t("Add a leaf photo")}</Text>
        <Text style={s.dropSub}>{t("Take a photo or select one from your gallery")}</Text>

        <View style={s.btnRow}>
          <Pressable style={s.btnPrimary} onPress={onCamera}>
            <MaterialIcons name="photo-camera" size={17} color="#FFFFFF" />
            <Text style={s.btnPrimaryText}>{t("Camera")}</Text>
          </Pressable>
          <Pressable style={s.btnOutline} onPress={onGallery}>
            <MaterialIcons name="image" size={17} color={C.primaryDark} />
            <Text style={s.btnOutlineText}>{t("Gallery")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={s.tips}>
        <View style={s.tipsHead}>
          <MaterialIcons name="auto-awesome" size={16} color={C.primary} />
          <Text style={s.tipsTitle}>{t("For the best results")}</Text>
        </View>
        {TIPS.map((tip) => (
          <View key={tip} style={s.tipRow}>
            <MaterialIcons name="check" size={16} color={C.primary} />
            <Text style={s.tipText}>{t(tip)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

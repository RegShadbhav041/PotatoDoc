// One suitability factor: icon, label/value, score badge, bar, tap-to-expand why.
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "../../theme";
import { fmt } from "../../utils/locationText";

export default function FactorRow({ factor, icon, expanded, onToggle, t }) {
  const C = useColors();
  const s = StyleSheet.create({
    card: {
      backgroundColor: C.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      marginBottom: 10,
    },
    head: { flexDirection: "row", alignItems: "center", gap: 12 },
    icon: { fontSize: 26 },
    labels: { flex: 1 },
    label: { fontSize: 15, fontWeight: "800", color: C.ink },
    value: { fontSize: 14, fontWeight: "800", color: C.healthyText, marginTop: 2 },
    right: { alignItems: "center" },
    badge: {
      borderWidth: 1.5,
      borderColor: C.healthyBorder,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 3,
      backgroundColor: C.card,
    },
    badgeText: { fontSize: 15, fontWeight: "900", color: C.healthyText },
    caret: { fontSize: 11, color: C.gray, marginTop: 2 },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: C.leafBg,
      marginTop: 12,
      overflow: "hidden",
    },
    fill: { height: 8, borderRadius: 4, backgroundColor: C.primary },
    why: {
      fontSize: 12.5,
      lineHeight: 18,
      fontWeight: "500",
      color: C.gray,
      marginTop: 10,
    },
  });
  return (
    <Pressable style={s.card} onPress={onToggle}>
      <View style={s.head}>
        <Text style={s.icon}>{icon}</Text>
        <View style={s.labels}>
          <Text style={s.label}>{t(factor.label)}</Text>
          <Text style={s.value}>{t(factor.value)}</Text>
        </View>
        <View style={s.right}>
          <View style={s.badge}>
            <Text style={s.badgeText}>{factor.score}</Text>
          </View>
          <MaterialIcons
            name={expanded ? "expand-less" : "expand-more"}
            size={18}
            color={C.gray}
          />
        </View>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${factor.score}%` }]} />
      </View>
      {expanded && <Text style={s.why}>{fmt(t(factor.why), factor.vars)}</Text>}
    </Pressable>
  );
}

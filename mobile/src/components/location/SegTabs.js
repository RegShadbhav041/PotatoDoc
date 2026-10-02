// Segmented control: Overview · Factors · Varieties · Tips (designer tabs).
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "../../theme";

export default function SegTabs({ tabs, active, onChange }) {
  const C = useColors();
  const s = StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: C.leafBg,
      borderRadius: 12,
      padding: 4,
      marginBottom: 14,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 9,
    },
    tabActive: { backgroundColor: C.primary },
    label: { fontSize: 13.5, fontWeight: "800", color: C.primary },
    labelActive: { color: "#FFFFFF" },
  });
  return (
    <View style={s.track}>
      {tabs.map((label) => {
        const isActive = label === active;
        return (
          <Pressable
            key={label}
            style={[s.tab, isActive && s.tabActive]}
            onPress={() => onChange(label)}
          >
            <Text style={[s.label, isActive && s.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

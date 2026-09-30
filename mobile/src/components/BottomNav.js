import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

const TABS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "diagnose", label: "Diagnose", icon: "eco" },
  { id: "history", label: "History", icon: "history" },
  { id: "location", label: "Location", icon: "location-on" },
  { id: "about", label: "About", icon: "info" },
];

export default function BottomNav({ active, onChange }) {
  return (
    <View style={s.nav}>
      {TABS.map((t) => {
        const on = active === t.id;
        const color = on ? COLORS.primary : COLORS.gray;
        return (
          <Pressable key={t.id} style={s.tab} onPress={() => onChange(t.id)}>
            <MaterialIcons name={t.icon} size={24} color={color} />
            <Text style={[s.label, { color }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  nav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: COLORS.navBorder,
    paddingTop: 16,
    paddingBottom: 10,
  },
  tab: { flex: 1, alignItems: "center" },
  label: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "500",
  },
});

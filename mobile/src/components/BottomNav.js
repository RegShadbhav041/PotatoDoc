import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

const TABS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "diagnose", label: "Diagnose", icon: "eco" },
  { id: "history", label: "History", icon: "history" },
  { id: "location", label: "Location", icon: "location-on" },
  { id: "profile", label: "Profile", icon: "person" },
];

export default function BottomNav({ active, onChange, dark = false }) {
  // Edge-to-edge Android (Expo SDK 54+): the system nav bar (back/home/recents)
  // overlays the app, so the tab row must clear the bottom inset itself.
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        s.nav,
        dark && { backgroundColor: COLORS.darkPage, borderTopColor: COLORS.darkLine },
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      {TABS.map((t) => {
        const on = active === t.id;
        const color = on
          ? dark
            ? COLORS.darkText
            : COLORS.primary
          : dark
          ? COLORS.darkMuted
          : COLORS.gray;
        return (
          <Pressable key={t.id} style={[s.tab, on && dark && s.tabOnDark]} onPress={() => onChange(t.id)}>
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
  tabOnDark: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    paddingVertical: 4,
    marginVertical: -4,
  },
  label: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "500",
  },
});

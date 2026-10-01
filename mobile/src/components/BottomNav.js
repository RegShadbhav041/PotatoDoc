import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../theme";
import { useT } from "../i18n";

const TABS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "diagnose", label: "Diagnose", icon: "eco" },
  { id: "history", label: "History", icon: "history" },
  { id: "location", label: "Location", icon: "location-on" },
  { id: "profile", label: "Profile", icon: "person" },
];

const makeStyles = (C) =>
  StyleSheet.create({
    nav: {
      flexDirection: "row",
      backgroundColor: C.card,
      borderTopWidth: 1,
      borderTopColor: C.navBorder,
      paddingTop: 16,
    },
    tab: { flex: 1, alignItems: "center" },
    tabOn: {
      backgroundColor: C.leafBg,
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

export default function BottomNav({ active, onChange }) {
  // Edge-to-edge Android (Expo SDK 54+): the system nav bar (back/home/recents)
  // overlays the app, so the tab row must clear the bottom inset itself.
  const insets = useSafeAreaInsets();
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <View
      style={[s.nav, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      {TABS.map((tab) => {
        const on = active === tab.id;
        const color = on ? C.primary : C.gray;
        return (
          <Pressable
            key={tab.id}
            style={[s.tab, on && s.tabOn]}
            onPress={() => onChange(tab.id)}
          >
            <MaterialIcons name={tab.icon} size={24} color={color} />
            <Text style={[s.label, { color }]}>{t(tab.label)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

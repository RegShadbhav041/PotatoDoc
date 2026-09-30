import React from "react";
import { Appbar } from "react-native-paper";
import { COLORS } from "../constants/colors";

export default function Header({ onOpenHistory }) {
  return (
    <Appbar.Header style={{ backgroundColor: COLORS.primary }}>
      <Appbar.Content title="PotatoDoc" subtitle="Potato Leaf Disease Detector" color="#fff" />
      <Appbar.Action icon="history" color="#fff" onPress={onOpenHistory} />
    </Appbar.Header>
  );
}

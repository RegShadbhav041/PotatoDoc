import React from "react";
import { View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

export default function LoadingIndicator({ heatmapPhase }) {
  return (
    <View style={{ padding: 24, alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 12 }}>{heatmapPhase ? "Computing heatmap..." : "Processing..."}</Text>
    </View>
  );
}

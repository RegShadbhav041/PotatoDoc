import React, { useState } from "react";
import { View } from "react-native";
import { Button, Menu, Text } from "react-native-paper";

export default function ModelPicker({ models, modelNames, selectedModel, onSelect }) {
  const [visible, setVisible] = useState(false);

  const displayName =
    selectedModel === "ensemble"
      ? "Ensemble (All Models)"
      : modelNames[selectedModel] || selectedModel;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <Text style={{ marginBottom: 6, fontWeight: "600" }}>Model</Text>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button mode="outlined" onPress={() => setVisible(true)}>
            {displayName}
          </Button>
        }
      >
        <Menu.Item
          onPress={() => {
            onSelect("ensemble");
            setVisible(false);
          }}
          title="Ensemble (All Models)"
        />
        {models
          .filter((id) => id !== "ensemble")
          .map((id) => (
            <Menu.Item
              key={id}
              onPress={() => {
                onSelect(id);
                setVisible(false);
              }}
              title={modelNames[id] || id}
            />
          ))}
      </Menu>
    </View>
  );
}

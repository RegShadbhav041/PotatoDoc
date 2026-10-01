import React, { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

// Copy exactly as written in the designer's "models" mockup (2026-10-01).
const DESCRIPTIONS = {
  ensemble: "Best overall accuracy, combines 3 networks",
  efficientnetb0: "High precision for early & late blight",
  mobilenetv2: "Ultra-fast on-device inference",
  small_cnn: "Minimal resource & offline mode",
};

// Mockup order: Ensemble, EfficientNet-B0, MobileNetV2, Small CNN.
const ORDER = ["ensemble", "efficientnetb0", "mobilenetv2", "small_cnn"];

export default function ModelPicker({
  models = [],
  modelNames = {},
  selectedModel,
  onSelect,
}) {
  const [visible, setVisible] = useState(false);

  const ordered = [
    ...ORDER.filter((id) => models.includes(id)),
    ...models.filter((id) => !ORDER.includes(id)),
  ];

  const displayName =
    selectedModel === "ensemble"
      ? "Ensemble (All Models)"
      : modelNames[selectedModel] || selectedModel;

  const choose = (id) => {
    onSelect(id);
    setVisible(false);
  };

  return (
    <View style={s.wrap}>
      <Text style={s.label}>Model</Text>

      <Pressable style={s.selector} onPress={() => setVisible(true)}>
        <Text style={s.selectorText} numberOfLines={1}>
          {displayName}
        </Text>
        <MaterialIcons name="expand-more" size={22} color={COLORS.ink} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={s.backdrop} onPress={() => setVisible(false)}>
          {/* Stop taps inside the sheet from closing it. */}
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Select AI Model</Text>

            {ordered.map((id) => {
              const on = id === selectedModel;
              const desc = DESCRIPTIONS[id];
              return (
                <Pressable
                  key={id}
                  style={[s.option, on && s.optionOn]}
                  onPress={() => choose(id)}
                >
                  <View style={s.optionText}>
                    <Text style={s.optionTitle}>
                      {id === "ensemble" ? "Ensemble (All Models)" : modelNames[id] || id}
                    </Text>
                    {!!desc && <Text style={s.optionDesc}>{desc}</Text>}
                  </View>
                  {on ? (
                    <View style={s.check}>
                      <MaterialIcons name="check" size={14} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={s.radio} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 18 },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.ink,
    marginBottom: 10,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 16,
    height: 52,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
    marginRight: 8,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#F7F9F3",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.ink,
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.ink,
    marginBottom: 12,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F2EF",
    borderWidth: 1,
    borderColor: "#E3E5DF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  optionOn: { borderColor: COLORS.primary },
  optionText: { flex: 1, marginRight: 10 },
  optionTitle: { fontSize: 14.5, lineHeight: 19, fontWeight: "800", color: COLORS.ink },
  optionDesc: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: "500",
    color: COLORS.gray,
    marginTop: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#B9BDB4",
    backgroundColor: "#FFFFFF",
  },
});

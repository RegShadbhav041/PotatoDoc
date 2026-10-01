import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "../theme";

const makeStyles = (C) =>
  StyleSheet.create({
    wrap: { marginTop: 14 },
    label: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700",
      color: C.ink,
      marginBottom: 6,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.authField,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 14,
      height: 50,
      gap: 10,
    },
    input: { flex: 1, fontSize: 15, color: C.ink, paddingVertical: 0 },
  });

export default function AuthField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secure = false,
  autoCapitalize = "none",
}) {
  const [hidden, setHidden] = useState(secure);
  const C = useColors();
  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        <MaterialIcons name={icon} size={18} color={C.gray} />
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9AA79B"
          secureTextEntry={hidden}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <MaterialIcons
              name={hidden ? "visibility-off" : "visibility"}
              size={18}
              color={C.gray}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

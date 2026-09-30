import React from "react";
import { View, FlatList } from "react-native";
import { Modal, Portal, Text, Button, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

export default function HistoryModal({ visible, onClose, history, onClear }) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.box}>
        <Text style={styles.title}>History</Text>
        {history.length === 0 ? (
          <Text>No predictions yet...</Text>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider />}
            renderItem={({ item }) => {
              const healthy = item.class === "Healthy";
              return (
                <View style={styles.row}>
                  <MaterialCommunityIcons
                    name={healthy ? "leaf" : "alert"}
                    size={24}
                    color={healthy ? COLORS.healthy : COLORS.cameraBrown}
                  />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={{ fontWeight: "700" }}>
                      {item.class} ({((item.confidence <= 1 ? item.confidence * 100 : item.confidence) || 0).toFixed(1)}%)
                    </Text>
                    <Text style={{ color: COLORS.textLight, fontSize: 12 }}>
                      {item.model} · {item.timestamp}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
        <View style={styles.actions}>
          {history.length > 0 && <Button onPress={onClear}>Clear</Button>}
          <Button mode="contained" onPress={onClose}>
            Close
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = {
  box: { backgroundColor: "#fff", margin: 20, padding: 16, borderRadius: 12, maxHeight: "80%" },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, gap: 8 },
};

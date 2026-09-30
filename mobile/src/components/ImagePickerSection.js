import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

export default function ImagePickerSection({ onCamera, onGallery }) {
  return (
    <View style={{ padding: 16 }}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.item} onPress={onCamera}>
          <View style={[styles.circle, { backgroundColor: COLORS.cameraBrown }]}>
            <MaterialCommunityIcons name="camera" size={30} color="#fff" />
          </View>
          <Text>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={onGallery}>
          <View style={[styles.circle, { backgroundColor: COLORS.galleryGreen }]}>
            <MaterialCommunityIcons name="image" size={30} color="#fff" />
          </View>
          <Text>Gallery</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ textAlign: "center", marginTop: 8, color: COLORS.textLight }}>
        Take a photo or choose from gallery
      </Text>
      <Card style={{ marginTop: 12 }}>
        <Card.Content>
          <Text style={{ fontWeight: "700", marginBottom: 4 }}>Tips for Good Photos</Text>
          <Text>- Entire leaf in focus{"\n"}- Natural light, plain background{"\n"}- Include healthy + diseased parts</Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-evenly", marginTop: 4 },
  item: { alignItems: "center", gap: 6 },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});

import React, { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

// Copy follows the designer's "profile dark mode" + "detail profile" mockups
// (2026-10-01).
const SECTION_LABEL = { color: COLORS.darkMuted, fontSize: 11, letterSpacing: 1.1 };

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function IconTile({ name }) {
  return (
    <View style={s.tile}>
      <MaterialIcons name={name} size={17} color={COLORS.darkText} />
    </View>
  );
}

function Toggle({ value, onChange }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: "#3A3F38", true: COLORS.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#3A3F38"
    />
  );
}

function DetailsModal({ visible, user, onClose, onSave, saving, error }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  // Seed the fields each time the sheet opens (mockup: email prefilled).
  React.useEffect(() => {
    if (visible) {
      setName(user?.name || "");
      setContact(user?.contact || "");
    }
  }, [visible, user]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalBackdrop}>
        <View style={s.modalCard}>
          <Pressable style={s.modalClose} onPress={onClose} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={COLORS.ink} />
          </Pressable>

          <View style={s.modalAvatar}>
            <Text style={s.modalAvatarText}>{initials(name || user?.name)}</Text>
          </View>

          <Text style={s.modalTitle}>Your details</Text>
          <Text style={s.modalSub}>
            Save your name and email address for a more personal experience.
          </Text>

          <Text style={s.inputLabel}>Your name</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Salina Kunwar"
            placeholderTextColor="#9AA19A"
            autoCapitalize="words"
          />

          <Text style={s.inputLabel}>Email address</Text>
          <TextInput
            style={s.input}
            value={contact}
            onChangeText={setContact}
            placeholder="you@example.com"
            placeholderTextColor="#9AA19A"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {!!error && <Text style={s.modalError}>{error}</Text>}

          <Pressable
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={() => onSave({ name, contact })}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={s.saveBtnText}>Save Profile</Text>
                <MaterialIcons name="arrow-forward" size={17} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen({
  user,
  unread = 0,
  onSignIn,
  onSignOut,
  onOpenNews,
  onOpenAbout,
  onSaveProfile,
}) {
  const [lightMode, setLightMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("English");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSave = async (values) => {
    if (!onSaveProfile) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveProfile(values);
      setEditing(false);
    } catch (e) {
      setSaveError(
        e?.response?.data?.detail || e?.message || "Could not save your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.flex}>
            <Text style={s.title}>Profile</Text>
            <Text style={s.subtitle}>Your PotatoDoc preferences.</Text>
          </View>
          <Pressable style={s.bellBtn} onPress={onOpenNews} hitSlop={8}>
            <MaterialIcons name="notifications-none" size={20} color={COLORS.darkText} />
            {unread > 0 && (
              <View style={s.bellBadge}>
                <Text style={s.bellBadgeText}>{unread > 9 ? "9+" : unread}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {user ? (
          <>
            <View style={s.card}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials(user.name)}</Text>
              </View>
              <View style={s.flex}>
                <Text style={s.name}>{user.name || "Farmer"}</Text>
                <Text style={s.contact} numberOfLines={1}>
                  {user.contact}
                </Text>
                <View style={s.locationRow}>
                  <MaterialIcons name="location-on" size={13} color={COLORS.darkMuted} />
                  <Text style={s.locationText}>Pokhara</Text>
                </View>
              </View>
              <Pressable style={s.editBtn} onPress={() => setEditing(true)} hitSlop={8}>
                <MaterialIcons name="edit" size={16} color={COLORS.darkText} />
              </Pressable>
            </View>

            <Text style={[s.sectionLabel, SECTION_LABEL]}>PREFERENCES</Text>

            <View style={s.row}>
              <IconTile name="light-mode" />
              <View style={s.flex}>
                <Text style={s.rowLabel}>Appearance</Text>
                <Text style={s.rowSub}>{lightMode ? "Light mode" : "Dark mode"}</Text>
              </View>
              <Toggle value={lightMode} onChange={setLightMode} />
            </View>

            <View style={s.row}>
              <IconTile name="notifications" />
              <View style={s.flex}>
                <Text style={s.rowLabel}>Notifications</Text>
                <Text style={s.rowSub}>Restock, deals and other updates</Text>
              </View>
              <Toggle value={notifications} onChange={setNotifications} />
            </View>

            <View style={s.row}>
              <IconTile name="translate" />
              <View style={s.flex}>
                <Text style={s.rowLabel}>Language</Text>
                <Text style={s.rowSub}>Text and spoken language</Text>
              </View>
              <View style={s.segment}>
                {["English", "Hindi"].map((lang) => {
                  const on = language === lang;
                  return (
                    <Pressable
                      key={lang}
                      style={[s.segmentItem, on && s.segmentItemOn]}
                      onPress={() => setLanguage(lang)}
                    >
                      <Text style={[s.segmentText, on && s.segmentTextOn]}>{lang}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Text style={[s.sectionLabel, s.sectionBrand]}>PotatoDoc</Text>

            <Pressable style={s.row} onPress={onOpenAbout}>
              <IconTile name="info-outline" />
              <View style={s.flex}>
                <Text style={s.rowLabel}>About PotatoDoc</Text>
                <Text style={s.rowSub}>Privacy, version and disclaimer</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.darkMuted} />
            </Pressable>

            <View style={s.row}>
              <IconTile name="help-outline" />
              <View style={s.flex}>
                <Text style={s.rowLabel}>Help &amp; Feedback</Text>
              </View>
              <View style={s.faqChip}>
                <Text style={s.faqChipText}>FAQ</Text>
              </View>
            </View>

            <Pressable style={s.logoutBtn} onPress={onSignOut}>
              <MaterialIcons name="logout" size={18} color="#FFFFFF" />
              <Text style={s.logoutText}>Logout</Text>
            </Pressable>
          </>
        ) : (
          <View style={s.card}>
            <Text style={s.signedOutText}>
              Sign in to save your diagnosis history and receive crop alerts.
            </Text>
            <Pressable style={s.signoutBtn} onPress={onSignIn}>
              <Text style={s.signoutBtnText}>Sign In</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <DetailsModal
        visible={editing}
        user={user}
        onClose={() => {
          setEditing(false);
          setSaveError(null);
        }}
        onSave={handleSave}
        saving={saving}
        error={saveError}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.darkPage },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: COLORS.darkText,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: COLORS.darkMuted,
    marginTop: 2,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkLine,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.bellBadge,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.darkPage,
  },
  bellBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkLine,
    padding: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  name: {
    fontSize: 16.5,
    lineHeight: 21,
    fontWeight: "800",
    color: COLORS.darkText,
  },
  contact: { fontSize: 12.5, lineHeight: 17, color: COLORS.darkMuted, marginTop: 1 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  locationText: { fontSize: 12, fontWeight: "600", color: COLORS.darkMuted },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.darkTile,
    borderWidth: 1,
    borderColor: COLORS.darkLine,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 22,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionBrand: { color: COLORS.darkText, fontSize: 13, letterSpacing: 0 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.darkCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.darkLine,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.darkTile,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 14.5, lineHeight: 19, fontWeight: "800", color: COLORS.darkText },
  rowSub: { fontSize: 11.5, lineHeight: 15, fontWeight: "500", color: COLORS.darkMuted, marginTop: 1 },

  segment: {
    flexDirection: "row",
    backgroundColor: COLORS.darkTile,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentItemOn: { backgroundColor: COLORS.primary },
  segmentText: { fontSize: 12.5, fontWeight: "700", color: COLORS.darkMuted },
  segmentTextOn: { color: "#FFFFFF" },

  faqChip: {
    backgroundColor: COLORS.darkTile,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  faqChipText: { fontSize: 11.5, fontWeight: "800", color: COLORS.darkText },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    marginTop: 14,
  },
  logoutText: { fontSize: 15.5, fontWeight: "800", color: "#FFFFFF" },

  signedOutText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: COLORS.darkMuted,
    textAlign: "center",
    paddingVertical: 6,
  },
  signoutBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  signoutBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  /* ---- "Your details" modal ---- */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 12, 10, 0.65)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    position: "relative",
    backgroundColor: "#E7F1DE",
    borderRadius: 22,
    padding: 22,
    paddingTop: 40,
  },
  modalClose: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalAvatarText: { fontSize: 19, fontWeight: "800", color: "#FFFFFF" },
  modalTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    color: "#12301C",
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: "#4B6350",
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#12301C",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C9DCC4",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14.5,
    color: "#12301C",
    marginBottom: 14,
  },
  modalError: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B3261E",
    marginBottom: 10,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#14532D",
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 15.5, fontWeight: "800", color: "#FFFFFF" },
});

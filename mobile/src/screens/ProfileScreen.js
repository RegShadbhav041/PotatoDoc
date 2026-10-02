import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  Image,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors, useTheme } from "../theme";
import { LANGUAGES, useLang, useT } from "../i18n";
import * as ImagePicker from "expo-image-picker";
import { authErrorMessage } from "../hooks/useAuth";

// Layout follows the designer's "profile" + "profile dark mode" mockups
// (2026-10-01); the palette decides which one you see.
const makeStyles = (C) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.pageGreen },
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
      color: C.ink,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
      color: C.gray,
      marginTop: 2,
    },
    bellBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
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
      backgroundColor: C.bellBadge,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: C.pageGreen,
    },
    bellBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },

    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
    avatarImg: { width: 50, height: 50, borderRadius: 25 },
    name: {
      fontSize: 16.5,
      lineHeight: 21,
      fontWeight: "800",
      color: C.ink,
    },
    contact: { fontSize: 12.5, lineHeight: 17, color: C.gray, marginTop: 1 },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
    locationText: { fontSize: 12, fontWeight: "600", color: C.gray },
    editBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: C.leafBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },

    sectionLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.1,
      color: C.gray,
      marginTop: 22,
      marginBottom: 10,
      marginLeft: 4,
    },
    sectionBrand: { color: C.ink, fontSize: 13, letterSpacing: 0 },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 12,
      paddingVertical: 11,
      marginBottom: 10,
    },
    tile: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: C.leafBg,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: { fontSize: 14.5, lineHeight: 19, fontWeight: "800", color: C.ink },
    rowSub: {
      fontSize: 11.5,
      lineHeight: 15,
      fontWeight: "500",
      color: C.gray,
      marginTop: 1,
    },

    segment: {
      flexDirection: "row",
      backgroundColor: C.leafBg,
      borderRadius: 10,
      padding: 3,
      gap: 3,
    },
    segmentItem: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    segmentItemOn: { backgroundColor: C.primary },
    segmentText: { fontSize: 12.5, fontWeight: "700", color: C.gray },
    segmentTextOn: { color: "#FFFFFF" },

    faqChip: {
      backgroundColor: C.leafBg,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    faqChipText: { fontSize: 11.5, fontWeight: "800", color: C.ink },

    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 48,
      borderRadius: 12,
      backgroundColor: C.danger,
      marginTop: 14,
    },
    logoutText: { fontSize: 15.5, fontWeight: "800", color: "#FFFFFF" },

    signedOutCard: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
    },
    signedOutText: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      color: C.gray,
      textAlign: "center",
      paddingVertical: 6,
    },
    signoutBtn: {
      height: 44,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
    },
    signoutBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

    /* ---- "Your details" modal — follows its mockup in both themes ---- */
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
      backgroundColor: "#2E7D32",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    modalAvatarText: { fontSize: 19, fontWeight: "800", color: "#FFFFFF" },
    modalAvatarImg: { width: 54, height: 54, borderRadius: 27 },
    photoActions: { flexDirection: "row", gap: 8, marginBottom: 14 },
    photoBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      height: 40,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#C9DCC4",
    },
    photoBtnText: { fontSize: 13, fontWeight: "700", color: "#12301C" },
    photoBtnDanger: { backgroundColor: "#FDECEC", borderColor: "#F5C6C6" },
    photoBtnDangerText: { color: "#B3261E" },
    photoBusy: { opacity: 0.6 },
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

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function IconTile({ s, C, name }) {
  return (
    <View style={s.tile}>
      <MaterialIcons name={name} size={17} color={C.ink} />
    </View>
  );
}

function Toggle({ value, onChange, C }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: C.cardBorder, true: C.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={C.cardBorder}
    />
  );
}

function DetailsModal({
  s,
  t,
  visible,
  user,
  onClose,
  onSave,
  saving,
  error,
  photoBusy,
  photoError,
  onPickGallery,
  onPickCamera,
  onRemovePhoto,
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  // Seed the fields each time the sheet opens (mockup: email prefilled).
  useEffect(() => {
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
            <MaterialIcons name="close" size={18} color="#12301C" />
          </Pressable>

          <Pressable
            style={[s.modalAvatar, photoBusy && s.photoBusy]}
            onPress={onPickGallery}
            disabled={photoBusy}
          >
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={s.modalAvatarImg} />
            ) : (
              <Text style={s.modalAvatarText}>{initials(name || user?.name)}</Text>
            )}
          </Pressable>

          <View style={s.photoActions}>
            <Pressable style={s.photoBtn} onPress={onPickCamera} disabled={photoBusy}>
              <MaterialIcons name="photo-camera" size={15} color="#12301C" />
              <Text style={s.photoBtnText}>{t("Camera")}</Text>
            </Pressable>
            <Pressable style={s.photoBtn} onPress={onPickGallery} disabled={photoBusy}>
              <MaterialIcons name="image" size={15} color="#12301C" />
              <Text style={s.photoBtnText}>{t("Gallery")}</Text>
            </Pressable>
            {!!user?.photo && (
              <Pressable
                style={[s.photoBtn, s.photoBtnDanger]}
                onPress={onRemovePhoto}
                disabled={photoBusy}
              >
                <MaterialIcons name="delete-outline" size={15} color="#B3261E" />
                <Text style={[s.photoBtnText, s.photoBtnDangerText]}>{t("Remove")}</Text>
              </Pressable>
            )}
          </View>
          {!!photoError && <Text style={s.modalError}>{photoError}</Text>}

          <Text style={s.modalTitle}>{t("Your details")}</Text>
          <Text style={s.modalSub}>
            {t("Save your name and email address for a more personal experience.")}
          </Text>

          <Text style={s.inputLabel}>{t("Your name")}</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder={t("e.g. Salina Kunwar")}
            placeholderTextColor="#9AA19A"
            autoCapitalize="words"
          />

          <Text style={s.inputLabel}>{t("Email address")}</Text>
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
                <Text style={s.saveBtnText}>{t("Save Profile")}</Text>
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
  onUploadPhoto,
  onRemovePhoto,
}) {
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);
  const { mode, toggleMode } = useTheme();
  const { lang, setLang } = useLang();

  const [notifications, setNotifications] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const isLight = mode === "light";

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

  const pickAndUpload = async (fromCamera) => {
    if (!onUploadPhoto) return;
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setPhotoError(t("Permission needed to choose a photo."));
        return;
      }
      const opts = { allowsEditing: true, aspect: [1, 1], quality: 0.8 };
      const res = fromCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets?.[0]?.uri) return;
      setPhotoBusy(true);
      setPhotoError(null);
      await onUploadPhoto(res.assets[0].uri);
    } catch (e) {
      setPhotoError(authErrorMessage(e));
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!onRemovePhoto) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      await onRemovePhoto();
    } catch (e) {
      setPhotoError(authErrorMessage(e));
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.flex}>
            <Text style={s.title}>{t("Profile")}</Text>
            <Text style={s.subtitle}>{t("Your PotatoDoc preferences.")}</Text>
          </View>
          <Pressable style={s.bellBtn} onPress={onOpenNews} hitSlop={8}>
            <MaterialIcons name="notifications-none" size={20} color={C.ink} />
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
                {user.photo ? (
                  <Image source={{ uri: user.photo }} style={s.avatarImg} />
                ) : (
                  <Text style={s.avatarText}>{initials(user.name)}</Text>
                )}
              </View>
              <View style={s.flex}>
                <Text style={s.name}>{user.name || t("Farmer")}</Text>
                <Text style={s.contact} numberOfLines={1}>
                  {user.contact}
                </Text>
                <View style={s.locationRow}>
                  <MaterialIcons name="location-on" size={13} color={C.gray} />
                  <Text style={s.locationText}>{t("Pokhara")}</Text>
                </View>
              </View>
              <Pressable style={s.editBtn} onPress={() => setEditing(true)} hitSlop={8}>
                <MaterialIcons name="edit" size={16} color={C.ink} />
              </Pressable>
            </View>

            <Text style={s.sectionLabel}>{t("PREFERENCES")}</Text>

            {/* Appearance drives the whole app's palette. */}
            <View style={s.row}>
              <IconTile s={s} C={C} name="light-mode" />
              <View style={s.flex}>
                <Text style={s.rowLabel}>{t("Appearance")}</Text>
                <Text style={s.rowSub}>{t(isLight ? "Light mode" : "Dark mode")}</Text>
              </View>
              <Toggle value={isLight} onChange={toggleMode} C={C} />
            </View>

            <View style={s.row}>
              <IconTile s={s} C={C} name="notifications" />
              <View style={s.flex}>
                <Text style={s.rowLabel}>{t("Notifications")}</Text>
                <Text style={s.rowSub}>{t("Restock, deals and other updates")}</Text>
              </View>
              <Toggle value={notifications} onChange={setNotifications} C={C} />
            </View>

            {/* Language: English ⇄ नेपाली, applied app-wide. */}
            <View style={s.row}>
              <IconTile s={s} C={C} name="translate" />
              <View style={s.flex}>
                <Text style={s.rowLabel}>{t("Language")}</Text>
                <Text style={s.rowSub}>{t("Text and spoken language")}</Text>
              </View>
              <View style={s.segment}>
                {LANGUAGES.map((item) => {
                  const on = lang === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      style={[s.segmentItem, on && s.segmentItemOn]}
                      onPress={() => setLang(item.id)}
                    >
                      <Text style={[s.segmentText, on && s.segmentTextOn]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Text style={[s.sectionLabel, s.sectionBrand]}>PotatoDoc</Text>

            <Pressable style={s.row} onPress={onOpenAbout}>
              <IconTile s={s} C={C} name="info-outline" />
              <View style={s.flex}>
                <Text style={s.rowLabel}>{t("About PotatoDoc")}</Text>
                <Text style={s.rowSub}>{t("Privacy, version and disclaimer")}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.gray} />
            </Pressable>

            <View style={s.row}>
              <IconTile s={s} C={C} name="help-outline" />
              <View style={s.flex}>
                <Text style={s.rowLabel}>{t("Help & Feedback")}</Text>
              </View>
              <View style={s.faqChip}>
                <Text style={s.faqChipText}>{t("FAQ")}</Text>
              </View>
            </View>

            <Pressable style={s.logoutBtn} onPress={onSignOut}>
              <MaterialIcons name="logout" size={18} color="#FFFFFF" />
              <Text style={s.logoutText}>{t("Logout")}</Text>
            </Pressable>
          </>
        ) : (
          <View style={s.signedOutCard}>
            <Text style={s.signedOutText}>
              {t("Sign in to save your diagnosis history and receive crop alerts.")}
            </Text>
            <Pressable style={s.signoutBtn} onPress={onSignIn}>
              <Text style={s.signoutBtnText}>{t("Sign In")}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <DetailsModal
        s={s}
        t={t}
        visible={editing}
        user={user}
        onClose={() => {
          setEditing(false);
          setSaveError(null);
          setPhotoError(null);
        }}
        onSave={handleSave}
        saving={saving}
        error={saveError}
        photoBusy={photoBusy}
        photoError={photoError}
        onPickGallery={() => pickAndUpload(false)}
        onPickCamera={() => pickAndUpload(true)}
        onRemovePhoto={handleRemovePhoto}
      />
    </SafeAreaView>
  );
}

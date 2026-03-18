import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { isAdminAuthenticated } from "./userStore";
import { adminApi, AdminUserItem } from "../services/api";

export default function AdminUserDetails() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigation.replace("AdminLogin");
    }
  }, [navigation]);

  const [user, setUser] = useState<AdminUserItem | undefined>(route.params?.user);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");

  const title = user?.username ?? "User";

  const openEditModal = () => {
    if (!user) return;
    setEditEmail(user.email);
    setEditUsername(user.username);
    setEditOpen(true);
  };

  const cancelEditing = () => {
    if (!user) return;
    setEditEmail(user.email);
    setEditUsername(user.username);
    setEditOpen(false);
  };

  const handleSave = async () => {
    if (!user) return;
    const fields: { email?: string; username?: string } = {};
    if (editEmail.trim() && editEmail.trim() !== user.email)
      fields.email = editEmail.trim();
    if (editUsername.trim() && editUsername.trim() !== user.username)
      fields.username = editUsername.trim();
    if (Object.keys(fields).length === 0) {
      setEditOpen(false);
      return;
    }
    try {
      setSaving(true);
      const updated = await adminApi.updateUser(user.id, fields);
      setUser(updated);
      setEditEmail(updated.email);
      setEditUsername(updated.username);
      setEditOpen(false);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.screen}>
          <Text style={{ padding: 16 }}>No user data.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const rows = [
    { k: "id", v: user.id },
    { k: "email", v: user.email },
    { k: "username", v: user.username },
    { k: "role", v: user.role },
    {
      k: "created_at",
      v: user.created_at
        ? new Date(user.created_at).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
    },
    { k: "password_hash", v: user.password_hash ?? "—" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{title}</Text>

          <TouchableOpacity onPress={openEditModal} style={styles.headerRight}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>User</Text>
          <View style={styles.card}>
            {rows.map((x, idx) => (
              <View key={x.k} style={[styles.kvRowStack, idx !== 0 && styles.kvBorder]}>
                <Text style={styles.k}>{x.k}</Text>
                <Text style={styles.vWrap}>{x.v}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>

        <Modal transparent visible={editOpen} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={cancelEditing}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Edit User</Text>

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                value={editUsername}
                onChangeText={setEditUsername}
                style={styles.input}
                placeholder="Username"
                autoCapitalize="none"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditing} disabled={saving}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7fb" },
  screen: { flex: 1 },

  header: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  headerLeft: { width: 44 },
  backArrow: { fontSize: 26, fontWeight: "600" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700" },
  headerRight: { width: 60, alignItems: "flex-end" },
  editText: { color: "#1e88e5", fontWeight: "900" },

  content: { padding: 16 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
    color: "#0b1220",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    overflow: "hidden",
    marginBottom: 16,
  },

  kvRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  kvRowStack: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "column",
    gap: 4,
  },
  kvBorder: { borderTopWidth: 1, borderTopColor: "#eef2f7" },

  k: { color: "#6b7280", fontWeight: "900" },
  v: { color: "#0b1220", fontWeight: "900" },
  vWrap: { color: "#0b1220", fontWeight: "900", fontFamily: "monospace", fontSize: 13 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
    color: "#0b1220",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginTop: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#111827",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    color: "#111827",
    fontWeight: "900",
  },

  saveBtn: {
    flex: 1,
    backgroundColor: "#1e88e5",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "900" },
});
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { isAdminAuthenticated } from "./userStore";
import { adminApi, AdminUserItem } from "../services/api";

export default function AdminUsers() {
  const navigation = useNavigation<any>();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigation.replace("AdminLogin");
      return;
    }
    loadUsers();
  }, [navigation, loadUsers]);

  useFocusEffect(
    useCallback(() => {
      if (!isAdminAuthenticated()) {
        return;
      }
      loadUsers();
    }, [loadUsers])
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
    );
  }, [q, users]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>All Users</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search username"
            placeholderTextColor="#9aa3af"
            style={styles.search}
          />

          
          <View style={styles.listBox}>
            {loading && (
              <View style={styles.emptyRow}>
                <ActivityIndicator color="#1e88e5" />
              </View>
            )}

            {!loading && error && (
              <View style={styles.emptyRow}>
                <Text style={[styles.emptyText, { color: "#e53935" }]}>{error}</Text>
              </View>
            )}

            {!loading && !error && filtered.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={styles.row}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("AdminUserDetails", { user: u })
                }
              >
                <View>
                  <Text style={styles.rowText}>{u.username}</Text>
                  <Text style={styles.rowSub}>{u.email}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}

            {!loading && !error && filtered.length === 0 && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No users found.</Text>
              </View>
            )}
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
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
  headerLeft: { width: 44, height: 36, justifyContent: "center" },
  backArrow: { fontSize: 26, color: "#111827", fontWeight: "600" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#111827" },
  headerRight: { width: 44 },

  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  search: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 12,
  },

  listBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    overflow: "hidden",
  },

  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: { fontSize: 16, fontWeight: "800", color: "#0b1220" },
  rowSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  chevron: { fontSize: 26, color: "#9aa6b2", paddingLeft: 12 },

  emptyRow: { paddingVertical: 18, paddingHorizontal: 16 },
  emptyText: { color: "#6b7280", fontWeight: "800" },
});

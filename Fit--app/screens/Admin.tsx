import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { isAdminAuthenticated } from "./userStore";

export default function Admin() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigation.replace("AdminLogin");
    }
  }, [navigation]);

  const actions = [
    "View all users Details",
    "Manage workout templates",
    "View app-wide statistics",
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />

          <Text style={styles.headerTitle}>Admin</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Actions */}
          <Text style={styles.sectionTitle}>Admin / System Manager</Text>

          {actions.map((x) => {
            if (x === "View all users Details") {
              return (
                <TouchableOpacity
                  key={x}
                  style={styles.actionRow}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("AdminUsers")}
                >
                  <Text style={styles.actionText}>{x}</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            }

            if (x === "Manage workout templates") {
              return (
                <TouchableOpacity
                  key={x}
                  style={styles.actionRow}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("AdminWorkoutTemplates")}
                >
                  <Text style={styles.actionText}>{x}</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            }

            if (x === "View app-wide statistics") {
              return (
                <TouchableOpacity
                  key={x}
                  style={styles.actionRow}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("AdminStatistics")}
                >
                  <Text style={styles.actionText}>{x}</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            }

            return (
              <View key={x} style={styles.actionRow}>
                <Text style={styles.actionText}>{x}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => navigation.replace("AdminLogin")}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
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
  headerLeft: { width: 44, height: 36 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#111827" },
  headerRight: { width: 44 },

  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  sectionTitle: {
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "900",
    color: "#0b1220",
  },

  actionRow: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  actionText: { fontSize: 16, fontWeight: "800", color: "#0b1220" },

  chevron: { fontSize: 26, color: "#9aa6b2", paddingLeft: 12 },

  logoutBtn: {
    marginTop: 20,
    backgroundColor: "#ef4444",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
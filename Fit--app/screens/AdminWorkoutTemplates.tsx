import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { isAdminAuthenticated } from "./userStore";
import { globalTemplatesApi, GlobalTemplate } from "../services/api";

function shortTargetMuscle(label: string): string {
  const map: Record<string, string> = {
    "Chest": "C",
    "Back": "B",
    "Shoulder": "S",
    "Bicep / Back": "Bi/B",
    "Chest / Tricep": "C/Tri",
    "Shoulder / Abs": "S/Abs",
    "Chest / Back / Shoulder / Bicep / Tricep": "UB (C/B/S/Bi/Tri)",
    "Chest / Shoulder / Tricep": "Push (C/S/Tri)",
    "Back / Bicep / Shoulder": "Pull (B/Bi/S)",
  };
  return map[label] ?? label;
}

export default function AdminWorkoutTemplates() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigation.replace("AdminLogin");
    }
  }, [navigation]);

  const [templates, setTemplates] = useState<GlobalTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await globalTemplatesApi.getAll();
      setTemplates(data);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTemplates();
    }, [fetchTemplates])
  );

  const handleRemove = (id: string) => {
    Alert.alert("Remove template", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await globalTemplatesApi.delete(id);
            setTemplates((prev) => prev.filter((t) => t.id !== id));
          } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : "Failed to remove.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerLeft}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Manage workout templates</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.pageTitle}>Workout templates</Text>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AddWorkoutTemplate")}
          >
            <Text style={styles.addBtnText}>+ Add new template</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#0b1220" />
          ) : templates.length === 0 ? (
            <Text style={styles.emptyText}>No templates yet. Add one above.</Text>
          ) : (
            templates.map((p) => (
              <View key={p.id} style={styles.programCard}>
                <TouchableOpacity
                  style={styles.cardTop}
                  onPress={() =>
                    navigation.navigate("Program", {
                      programId: p.id,
                      title: p.name,
                      subtitle: String(p.exercises.length),
                      targetMuscle: p.target_muscle,
                      exercises: p.exercises,
                    })
                  }
                >
                  <View style={styles.programThumb}>
                    <Text style={styles.programThumbText} numberOfLines={1} ellipsizeMode="tail">
                      {shortTargetMuscle(p.target_muscle)}
                    </Text>
                  </View>

                  <View style={styles.programInfo}>
                    <Text style={styles.programTitle}>{p.name}</Text>
                    <Text style={styles.programSub}>{p.exercises.length} exercise</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(p.id)}
                >
                  <Text style={styles.removeBtnText}>Remove template</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

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

  headerLeft: { width: 44, height: 36, justifyContent: "center" },
  backArrow: { fontSize: 26, color: "#111827", fontWeight: "600" },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  headerRight: { width: 44 },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 16,
  },

  addBtn: {
    backgroundColor: "#0b1220",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },

  addBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  programCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d9dee7",
    padding: 12,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: "row",
  },

  programThumb: {
    width: 116,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#f1f3f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    paddingHorizontal: 8,
  },

  programThumbText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2583e8",
    textAlign: "center",
  },

  programInfo: {
    flex: 1,
    justifyContent: "center",
  },

  programTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },

  programSub: {
    marginTop: 6,
    color: "#6b7280",
    fontWeight: "800",
    fontSize: 13,
  },

  removeBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },

  removeBtnText: {
    color: "#ef4444",
    fontWeight: "800",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "600",
  },
});
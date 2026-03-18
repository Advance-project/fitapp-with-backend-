import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAdminAuthenticated } from "./userStore";
import { globalTemplatesApi } from "../services/api";
import type { ExerciseItem } from "../App";

const ADMIN_TEMPLATE_DRAFT_KEY = "admin_template_draft_v1";

export default function AddWorkoutTemplate() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigation.replace("AdminLogin");
    }
  }, [navigation]);

  const [title, setTitle] = useState(route.params?.title ?? "");
  const [targetMuscle, setTargetMuscle] = useState(route.params?.targetMuscle ?? "Chest");
  const [selectedExercises, setSelectedExercises] = useState<ExerciseItem[]>(
    route.params?.selectedExercises ?? []
  );
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Restore unfinished admin template draft so values survive navigation hops.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ADMIN_TEMPLATE_DRAFT_KEY);
        if (!active || !raw) return;
        const draft = JSON.parse(raw) as {
          title?: string;
          targetMuscle?: string;
          selectedExercises?: ExerciseItem[];
        };

        if (route.params?.title === undefined && typeof draft.title === "string") {
          setTitle(draft.title);
        }
        if (
          route.params?.targetMuscle === undefined &&
          typeof draft.targetMuscle === "string"
        ) {
          setTargetMuscle(draft.targetMuscle);
        }
        if (
          route.params?.selectedExercises === undefined &&
          Array.isArray(draft.selectedExercises)
        ) {
          setSelectedExercises(draft.selectedExercises);
        }
      } catch {
        // Ignore draft parse/storage issues and proceed with in-memory state.
      } finally {
        if (active) setIsDraftLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Sync state from route params whenever they change (e.g., when returning from AddExercise)
  useEffect(() => {
    if (route.params?.title !== undefined) {
      setTitle(route.params.title);
    }
    if (route.params?.targetMuscle !== undefined) {
      setTargetMuscle(route.params.targetMuscle);
    }
    if (route.params?.selectedExercises !== undefined) {
      setSelectedExercises(route.params.selectedExercises);
    }
  }, [
    route.params?.title,
    route.params?.targetMuscle,
    route.params?.selectedExercises,
  ]);

  useEffect(() => {
    if (!isDraftLoaded) return;
    AsyncStorage.setItem(
      ADMIN_TEMPLATE_DRAFT_KEY,
      JSON.stringify({ title, targetMuscle, selectedExercises })
    ).catch(() => {
      // Best-effort persistence only.
    });
  }, [title, targetMuscle, selectedExercises, isDraftLoaded]);

  const openAddExercise = () => {
    navigation.navigate("AddExercise", {
      existingExercises: selectedExercises,
      returnTo: "AddWorkoutTemplate",
      title,
      targetMuscle,
    } as never);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a template title.");
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert("No exercises", "Please add at least one exercise.");
      return;
    }

    setSaving(true);
    try {
      await globalTemplatesApi.create({
        name: title.trim(),
        target_muscle: targetMuscle,
        exercises: selectedExercises.map(({ id, name, muscle }) => ({ id, name, muscle })),
      });
      await AsyncStorage.removeItem(ADMIN_TEMPLATE_DRAFT_KEY);
      navigation.reset({
        index: 1,
        routes: [
          { name: "Admin" },
          { name: "AdminWorkoutTemplates", params: { refreshAt: Date.now() } },
        ],
      });
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to save template.");
    } finally {
      setSaving(false);
    }
  };

  const targetMuscleOptions = [
    "Chest",
    "Back",
    "Shoulder",
    "Bicep",
    "Tricep",
    "Legs",
    "Abs",
    "Chest / Back / Shoulder / Bicep / Tricep",
    "Chest / Shoulder / Tricep",
    "Back / Bicep / Shoulder",
    "Bicep / Back",
    "Chest / Tricep",
    "Shoulder / Abs",
    "Cardio",
  ];

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

          <Text style={styles.headerTitle}>Add new template</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>

          <Text style={styles.label}>Template title</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Beginner Upper Body"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Target muscles</Text>
          <View style={styles.optionRow}>
            {targetMuscleOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.optionBtn,
                  targetMuscle === item && styles.optionBtnActive,
                ]}
                onPress={() => setTargetMuscle(item)}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    targetMuscle === item && styles.optionBtnTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Exercises ({selectedExercises.length} selected)</Text>

          {selectedExercises.length > 0 && (
            <View style={styles.exerciseList}>
              {selectedExercises.map((ex) => (
                <View key={ex.id} style={styles.exerciseRow}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseMuscle}>{ex.muscle}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addExerciseBtn} onPress={openAddExercise}>
            <Text style={styles.addExerciseBtnText}>
              {selectedExercises.length === 0 ? "+ Add exercises" : "Edit exercises"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save template</Text>
            )}
          </TouchableOpacity>

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
    paddingTop: 18,
    paddingBottom: 20,
  },

  label: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0b1220",
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9dee7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
  },

  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },

  optionBtn: {
    borderWidth: 1,
    borderColor: "#d9dee7",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    marginBottom: 10,
  },

  optionBtnActive: {
    backgroundColor: "#0b1220",
    borderColor: "#0b1220",
  },

  optionBtnText: {
    color: "#0b1220",
    fontWeight: "700",
    fontSize: 14,
  },

  optionBtnTextActive: {
    color: "#fff",
  },

  exerciseList: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d9dee7",
    marginBottom: 10,
    overflow: "hidden",
  },

  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  exerciseName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },

  exerciseMuscle: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },

  addExerciseBtn: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 8,
  },

  addExerciseBtnText: {
    color: "#0b1220",
    fontWeight: "800",
    fontSize: 15,
  },

  saveBtn: {
    marginTop: 16,
    backgroundColor: "#0b1220",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },

  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
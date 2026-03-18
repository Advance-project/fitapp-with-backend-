import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, ExerciseItem } from "../App";
import { exerciseApi, filterApi } from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = {
  key: string;
  name: string;
  params?: { existingExercises?: ExerciseItem[]; returnTo?: string; title?: string; targetMuscle?: string };
};

type ExerciseCatalogItem = ExerciseItem & {
  equipment: string;
};

const DEFAULT_EQUIPMENT_OPTIONS = ["All Equipment", "None", "Barbell", "Dumbbell", "Machine"];
const DEFAULT_MUSCLE_OPTIONS = [
  "All Muscles",
  "Chest",
  "Biceps",
  "Triceps",
  "Shoulders",
  "Back",
  "Abs",
  "Legs",
  "Cardio",
];

export default function AddExercise() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const isTemplateEditMode = route.params?.returnTo === "AddWorkoutTemplate";

  const [query, setQuery] = useState("");
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([]);

  
  const existingExercises = route.params?.existingExercises ?? [];
  const existingIds = useMemo(
    () => new Set(existingExercises.map((e) => e.id)),
    [existingExercises]
  );

  
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>(DEFAULT_EQUIPMENT_OPTIONS);
  const [muscleOptions, setMuscleOptions] = useState<string[]>(DEFAULT_MUSCLE_OPTIONS);
  const [equipment, setEquipment] = useState<string>("All Equipment");
  const [muscleFilter, setMuscleFilter] = useState<string>("All Muscles");

  const [equipmentSheetOpen, setEquipmentSheetOpen] = useState(false);
  const [muscleSheetOpen, setMuscleSheetOpen] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [data, exerciseRows] = await Promise.all([
          filterApi.getOptions(),
          exerciseApi.getAll(),
        ]);
        if (!active) return;

        setExercises(exerciseRows);

        if (data.equipment_options.length > 0) {
          setEquipmentOptions(data.equipment_options);
          if (!data.equipment_options.includes(equipment)) {
            setEquipment("All Equipment");
          }
        }
        if (data.muscle_options.length > 0) {
          setMuscleOptions(data.muscle_options);
          if (!data.muscle_options.includes(muscleFilter)) {
            setMuscleFilter("All Muscles");
          }
        }
      } catch {
        // Keep fallback options when backend is unavailable.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    isTemplateEditMode ? new Set(existingIds) : new Set()
  );

  useEffect(() => {
    if (isTemplateEditMode) {
      setSelectedIds(new Set(existingIds));
    }
  }, [isTemplateEditMode, existingIds]);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allEquipmentSelected = equipment === "All Equipment";
    const allMusclesSelected = muscleFilter === "All Muscles";

    if (allEquipmentSelected && allMusclesSelected && !q) {
      return exercises;
    }

    let list = exercises;

    
    if (!allMusclesSelected) {
      list = list.filter((x) => x.muscle === muscleFilter);
    }

    if (!allEquipmentSelected) {
      list = list.filter((x) => x.equipment === equipment);
    }

    

    if (!q) return list;

    return list.filter(
      (x) => x.name.toLowerCase().includes(q) || x.muscle.toLowerCase().includes(q)
    );
  }, [query, muscleFilter, equipment, exercises]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selectedIds.size;
  const hasSelectionChanged = useMemo(() => {
    if (!isTemplateEditMode) {
      return selectedIds.size > 0;
    }
    if (selectedIds.size !== existingIds.size) {
      return true;
    }
    for (const id of selectedIds) {
      if (!existingIds.has(id)) {
        return true;
      }
    }
    return false;
  }, [isTemplateEditMode, selectedIds, existingIds]);

  const addSelectedToWorkout = () => {
    const selectedExercises: ExerciseItem[] = exercises
      .filter((e) => selectedIds.has(e.id))
      .map(({ id, name, muscle }) => ({ id, name, muscle }));

    const returnTo = route.params?.returnTo;
    if (returnTo === "AddWorkoutTemplate") {
      navigation.navigate({
        name: "AddWorkoutTemplate" as never,
        params: {
          selectedExercises,
          title: route.params?.title,
          targetMuscle: route.params?.targetMuscle,
        } as never,
        merge: true,
      } as never);
    } else {
      navigation.navigate({
        name: "LogWorkout" as never,
        params: { selectedExercises } as never,
        merge: true,
      } as never);
    }

    setSelectedIds(new Set());
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        
        <View style={styles.topBar}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Text style={styles.topBarLink}>Cancel</Text>
  </TouchableOpacity>

  <Text style={styles.topBarTitle}>Add Exercise</Text>

  <View style={{ width: 60 }} />
</View>

        
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Search exercise"
            value={query}
            onChangeText={setQuery}
            style={styles.search}
            placeholderTextColor="#9aa3af"
          />
        </View>

        
        <View style={styles.filtersRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.filterBtn}
            onPress={() => setEquipmentSheetOpen(true)}
          >
            <Text style={styles.filterText}>{equipment}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.filterBtn}
            onPress={() => setMuscleSheetOpen(true)}
          >
            <Text style={styles.filterText}>{muscleFilter}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingBottom: selectedCount > 0 ? 120 : 24,
          }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);

            return (
              <TouchableOpacity
                style={[
                  styles.row,
                  isSelected && styles.rowSelected,
                ]}
                onPress={() => toggleSelect(item.id)}
                activeOpacity={0.85}
              >
                {isSelected ? (
                  <View style={styles.selectedBar} />
                ) : (
                  <View style={styles.selectedBarGhost} />
                )}

                <View style={styles.thumb}>
                  <Text style={styles.thumbText}>🏋️</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowSub}>{item.muscle} · {item.equipment}</Text>
                </View>

                <View
                  style={[
                    styles.rightIcon,
                    isSelected && styles.rightIconSelected,
                  ]}
                >
                  {isSelected ? (
                    <Text
                      style={[
                        styles.rightIconCheck,
                        isSelected && styles.rightIconCheckSelected,
                      ]}
                    >
                      ✓
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Bottom blue button */}
        {hasSelectionChanged && (
          <View style={styles.bottomBarWrap}>
            <TouchableOpacity
              style={styles.bottomBarBtn}
              onPress={addSelectedToWorkout}
              activeOpacity={0.9}
            >
              <Text style={styles.bottomBarText}>
                {isTemplateEditMode
                  ? `Save selection (${selectedCount})`
                  : `Add ${selectedCount} ${selectedCount === 1 ? "exercise" : "exercises"}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        
        <Modal transparent visible={equipmentSheetOpen} animationType="fade">
          <Pressable
            style={styles.sheetOverlay}
            onPress={() => setEquipmentSheetOpen(false)}
          >
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Equipment</Text>

              {equipmentOptions.map((opt) => {
                const active = opt === equipment;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.sheetRow}
                    onPress={() => {
                      setEquipment(opt);
                      setEquipmentSheetOpen(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.sheetRowText}>{opt}</Text>
                    <Text style={styles.sheetRowRight}>{active ? "✓" : ""}</Text>
                  </TouchableOpacity>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>

       
        <Modal transparent visible={muscleSheetOpen} animationType="fade">
          <Pressable
            style={styles.sheetOverlay}
            onPress={() => setMuscleSheetOpen(false)}
          >
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Muscle Group</Text>

              {muscleOptions.map((opt) => {
                const active = opt === muscleFilter;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.sheetRow}
                    onPress={() => {
                      setMuscleFilter(opt);
                      setMuscleSheetOpen(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.sheetRowText}>{opt}</Text>
                    <Text style={styles.sheetRowRight}>{active ? "✓" : ""}</Text>
                  </TouchableOpacity>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  screen: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  topBarTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  topBarLink: { fontSize: 17, color: "#1976d2", fontWeight: "500" },

  searchWrap: { paddingHorizontal: 18, paddingTop: 14 },
  search: {
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#111827",
  },

  filtersRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
  },
  filterBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  filterText: { fontSize: 16, fontWeight: "600", color: "#111827" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  rowSelected: { backgroundColor: "#fbfdff" },
  selectedBar: {
    width: 6,
    height: 54,
    borderRadius: 6,
    backgroundColor: "#1e88e5",
    marginRight: 8,
  },
  selectedBarGhost: {
    width: 6,
    height: 54,
    borderRadius: 6,
    backgroundColor: "transparent",
    marginRight: 8,
  },

  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbText: { fontSize: 20 },

  rowTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  rowSub: { marginTop: 4, fontSize: 15, color: "#a2abb8" },

  rightIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#111827",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  rightIconSelected: {
    backgroundColor: "#1e88e5",
    borderColor: "#1e88e5",
  },
  rightIconCheck: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "800",
  },
  rightIconCheckSelected: {
    color: "#fff",
  },

  sep: { height: 1, backgroundColor: "#eef2f7", marginLeft: 18 },

  bottomBarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  bottomBarBtn: {
    backgroundColor: "#1e88e5",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  bottomBarText: { color: "#fff", fontSize: 18, fontWeight: "800" },

  
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 18,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 54,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d1d5db",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    paddingVertical: 10,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  sheetRowText: { fontSize: 18, color: "#111827", fontWeight: "600" },
  sheetRowRight: { fontSize: 20, color: "#1e88e5", fontWeight: "900" },
});

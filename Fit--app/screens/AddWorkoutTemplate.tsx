import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { isAdminAuthenticated } from "./userStore";

export default function AddWorkoutTemplate() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigation.replace("AdminLogin");
    }
  }, [navigation]);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("3");
  const [targetMuscle, setTargetMuscle] = useState("Bicep");

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter template title.");
      return;
    }

    if (!subtitle.trim()) {
      Alert.alert("Missing number", "Please enter no of exercise.");
      return;
    }

    const newTemplate = {
      id: `template_${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || "3",
      targetMuscle,
    };

    if (route.params?.onSaveTemplate) {
      route.params.onSaveTemplate(newTemplate);
    } else {
      navigation.goBack();
    }
  };

  const targetMuscleOptions = [
    "Bicep",
    "Tricep",
    "Back",
    "Chest",
    "Shoulder",
    "Legs",
    "Abs",
    "Bicep / Back",
    "Chest / Tricep",
    "Shoulder / Back",
    "Back / Bicep / Tricep",
    "Chest / Shoulder / Tricep",
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

          <Text style={styles.label}>No of exercise</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: 3"
            value={subtitle}
            onChangeText={setSubtitle}
            keyboardType="numeric"
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

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>Save template</Text>
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

  saveBtn: {
    marginTop: 24,
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
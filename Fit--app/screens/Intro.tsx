import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Intro() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2000); 

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      
      <Text style={styles.mainText}>Fit</Text>

     
      <Text style={styles.subText}>
        for better lifestyle{"\n"}
        and mental health.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  
  mainText: {
    fontSize: 64,
    fontWeight: "800",
    color: "#FFD400",
    textAlign: "center",
    marginBottom: 16,
  },

  
  subText: {
    fontSize: 22,
    fontWeight: "400",
    color: "#FFD400",
    textAlign: "center",
    lineHeight: 32,
  },
});

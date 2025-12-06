import { useState, useEffect, useRef } from 'react';
import { View, Button, StyleSheet, Alert, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Device from 'expo-device';
import { db as firestoreDb } from './firebase';
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import db from './localDb';

const NORMAL_MIN = 4;
const NORMAL_MAX = 7;

const SensorRecorder = ({ userId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentValue, setCurrentValue] = useState(0);
  const [intervalSec, setIntervalSec] = useState(10);
  const intervalRef = useRef(null);
  const fake_device = "smart watch"; 
  const fake_os = 12;

  const generateGlucoseLevel = () => (Math.random() * 7 + 3).toFixed(2);

  const saveToSQLite = (value) => {
    const timestamp = new Date().toISOString();
    try {
      db.runSync(
        "INSERT INTO sensor_data (user_id, glucose, timestamp, synced, device_model) VALUES (?, ?, ?, ?, ?)",
        [userId, value, timestamp, 0, Device.modelName]
      );
      
      console.log("✅ Запис збережено в SQLite:", value);
    } catch (error) {
      console.error("❌ Помилка збереження в SQLite:", error);
    }
  };

  
  const syncWithFirebase = async () => {
    const rows = db.getAllSync(
      "SELECT * FROM sensor_data WHERE synced = 0 AND user_id = ?",
      [userId]
    );
    

    for (const row of rows) {
      try {
        
        const minutePrefix = row.timestamp.slice(0, 16); 

        const q = query(
          collection(firestoreDb, "sensor_data"),
          where("user_id", "==", row.user_id),
          where("timestamp", ">=", minutePrefix + ":00"),
          where("timestamp", "<=", minutePrefix + ":59")
        );

        const snapshot = await getDocs(q);
        const isDuplicate = snapshot.size > 0;

        console.log("Відправляю у Firestore:", row);
        
        await addDoc(collection(firestoreDb, "sensor_data"), {
          glucose: row.glucose,
          timestamp: row.timestamp,
          user_id: row.user_id,
          device_model: Device.modelName,
          os_version: Device.osVersion,
          is_duplicate: isDuplicate,
        });

        
        db.runSync("UPDATE sensor_data SET synced = 1 WHERE id = ?", [row.id]);
      } catch (error) {
        console.error("❌ Sync error:", error);
      }
    }
  };


  const onNewValueGenerated = async (value) => {
    saveToSQLite(value);
    syncWithFirebase(); 

    if (value < NORMAL_MIN || value > NORMAL_MAX) {
      Alert.alert("Попередження!", `Рівень глюкози поза нормою: ${value} mmol/L`);
    }
  };

  const startRecording = () => {
    if (isRecording) return;
    setIsRecording(true);

    const firstValue = generateGlucoseLevel();
    setCurrentValue(firstValue);
    onNewValueGenerated(firstValue);

    intervalRef.current = setInterval(() => {
      const value = generateGlucoseLevel();
      setCurrentValue(value);
      onNewValueGenerated(value);
    }, intervalSec * 1000);
  };

  const stopRecording = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRecording(false);
  };

  const clearHistory = () => {
    db.runSync("DELETE FROM sensor_data WHERE user_id = ?", [userId]);
    setCurrentValue(0);
    Alert.alert("Очищено", "Історія локальних вимірів видалена");
  };

  useEffect(() => () => intervalRef.current && clearInterval(intervalRef.current), []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Глюкометр</Text>
      <Text style={styles.text}>
        Поточний рівень глюкози: <Text style={styles.value}>{currentValue} mmol/L</Text>
      </Text>

      <Text style={{ marginBottom: 5 }}>Інтервал запису (секунди):</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={intervalSec} onValueChange={setIntervalSec} style={styles.picker}>
          {[5, 10, 15, 30, 60].map(i => <Picker.Item key={i} label={`${i}`} value={i} />)}
        </Picker>
      </View>

      <Button title={isRecording ? "Зупинити запис" : "Почати запис"}
              onPress={isRecording ? stopRecording : startRecording}
              color={isRecording ? "#c0392b" : "#27ae60"} />

      <View style={{ marginTop: 10 }}>
        <Button title="Очистити історію" onPress={clearHistory} color="#e67e22" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", borderRadius: 10, margin: 20, alignItems: "center", marginTop: "12%" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  text: { marginVertical: 10, fontSize: 16 },
  value: { fontWeight: "bold", color: "#2980b9" },
  pickerContainer: { borderWidth: 1, borderColor: "#2980b9", borderRadius: 8, width: 120, height: 55, justifyContent: "center", marginBottom: 10 },
  picker: { width: "100%", height: "100%", color: "#2980b9" },
});

export default SensorRecorder;

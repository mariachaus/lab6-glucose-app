import { useEffect, useState } from 'react';
import { FlatList, Text, View, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import db from './localDb';

const NORMAL_MIN = 4;
const NORMAL_MAX = 7;


const DEVICE_COLORS = [
  '#2980b9', '#8e44ad', '#16a085', '#d35400', '#2c3e50', '#e67e22', '#27ae60'
];

const SensorDataList = ({ userId }) => {
  const [sensorData, setSensorData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0 });
  const [timeRange, setTimeRange] = useState('day');
  const [devices, setDevices] = useState([]);                
  const [selectedDevices, setSelectedDevices] = useState([]); 

  const formatLocalDateTime = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  };

  const loadSensorData = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      let timeCondition = '';

      if (timeRange === 'hour') {
        timeCondition = `WHERE timestamp >= '${formatLocalDateTime(new Date(now.getTime() - 60 * 60 * 1000))}'`;
      } else if (timeRange === 'day') {
        timeCondition = `WHERE timestamp >= '${formatLocalDateTime(new Date(now.getTime() - 24 * 60 * 60 * 1000))}'`;
      } else if (timeRange === 'week') {
        timeCondition = `WHERE timestamp >= '${formatLocalDateTime(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))}'`;
      }

      const query = `
        SELECT * FROM sensor_data
        ${timeCondition} AND user_id = ?
        ORDER BY timestamp ASC
      `;
      const localData = await db.getAllAsync(query, [userId]);
      setSensorData(localData);

      const uniqueDevices = [...new Set(localData.map(i => i.device_model))];
      setDevices(uniqueDevices);

      if (selectedDevices.length === 0) setSelectedDevices(uniqueDevices);

      if (localData.length > 0) {
        const values = localData.map(item => item.glucose);
        const min = Math.min(...values).toFixed(2);
        const max = Math.max(...values).toFixed(2);
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
        setStats({ min, max, avg });
      } else setStats({ min: 0, max: 0, avg: 0 });

    } catch (err) {
      console.error("SQLite load error", err);
    }
    setIsLoading(false);
  };

  useEffect(() => { loadSensorData(); }, [timeRange]);
  useEffect(() => { loadSensorData(); }, []);

  if (isLoading) return <ActivityIndicator size="large" color="#0000ff" />;

   const labels = sensorData.map(item => new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));


   const getDeviceColor = (device) => {
    const index = devices.indexOf(device); 
    return DEVICE_COLORS[index % DEVICE_COLORS.length];
  };

  const datasets = selectedDevices.map((device) => {
  const color = getDeviceColor(device);
  return {
    data: labels.map(label => {
      const point = sensorData.find(
        item =>
          item.device_model === device &&
          new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) === label
      );
      return point ? point.glucose : null;
    }),
    color: () => color,
    strokeWidth: 2
  };
});

  const chartData = {
    labels,
    datasets: [
      ...datasets,
      { data: sensorData.map(() => NORMAL_MIN), color: () => `rgba(46,204,113,0.4)` },
      { data: sensorData.map(() => NORMAL_MAX), color: () => `rgba(46,204,113,0.4)` }
    ]
  };

  const toggleDevice = (device) => {
    setSelectedDevices(prev =>
      prev.includes(device)
        ? prev.filter(d => d !== device)
        : [...prev, device]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filterContainer}>
        {['hour', 'day', 'week'].map(range => (
          <TouchableOpacity
            key={range}
            onPress={() => setTimeRange(range)}
            style={[styles.filterButton, timeRange === range && styles.filterButtonActive]}
          >
            <Text style={timeRange === range ? styles.filterTextActive : styles.filterText}>
              {range === 'hour' ? 'Остання година' : range === 'day' ? 'День' : 'Тиждень'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Вибір пристроїв */}
      <ScrollView horizontal style={styles.deviceContainer}>
        {devices.map((device, i) => (
          <TouchableOpacity
            key={device}
            onPress={() => toggleDevice(device)}
            style={[
              styles.deviceButton,
              { borderColor: DEVICE_COLORS[i % DEVICE_COLORS.length] },
              selectedDevices.includes(device) && {
                backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length]
              }
            ]}
          >
            <Text style={selectedDevices.includes(device) ? styles.deviceTextActive : styles.deviceText}>
              {device}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.statsContainer}>
              <Text>Min: {stats.min} | Max: {stats.max} | Avg: {stats.avg} mmol/L</Text>
            </View>

            {sensorData.length > 0 && (
              <ScrollView horizontal>
                <LineChart
                  data={chartData}
                  width={Math.max(sensorData.length * 90, 350)}
                  height={230}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',    
                    backgroundGradientTo: '#fff', 
                    decimalPlaces: 2,
                    color: opacity => `rgba(0,0,0,${opacity})`,
                    labelColor: opacity => `rgba(0,0,0,${opacity})`,
                    propsForBackgroundLines: {
                      strokeWidth: 2 
                    },
                    fillShadowGradientFromOpacity: 0, 
                    fillShadowGradientToOpacity: 0,  
                    useShadowColorFromDataset: false  
                  }}
                  bezier
                  style={{ 
                    borderRadius: 16,
                    paddingRight: 45 
                  }}
                />
              </ScrollView>
            )}
          </>
        }
        data={[...sensorData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))}
        keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleString()} ({item.device_model})
            </Text>
            <Text style={[
              styles.value,
              (item.glucose > NORMAL_MAX || item.glucose < NORMAL_MIN) && { color: '#c0392b', fontWeight: 'bold' }
            ]}>
              {item.glucose} mmol/L
            </Text>
          </View>
        )}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  filterButton: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#2980b9' },
  filterButtonActive: { backgroundColor: '#2980b9' },
  filterText: { color: '#b4b4b4ff' },
  filterTextActive: { color: '#fff' },
  statsContainer: { padding: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },

  deviceContainer: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 5, paddingBottom: 12, height: 'auto'  },
  deviceButton: { height: 38, padding: 6, borderWidth: 1, borderRadius: 10, marginRight: 6 },
  deviceText: { fontWeight: '600', color: '#b4b4b4ff' },
  deviceTextActive: { fontWeight: '600', color: '#fff' },

  itemContainer: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  timestamp: { fontWeight: 'bold', fontSize: 14, marginBottom: 3 },
  value: { fontSize: 16, color: '#2980b9' }
});

export default SensorDataList;

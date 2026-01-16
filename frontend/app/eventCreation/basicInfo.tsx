import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
  Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Event Types
const TAG_OPTIONS = ['Activities at MTC Office', 'Outings', 'Nature Walks', 'Gym and Dance', 'Reading'];

export default function CreateEventScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const currDate = new Date();
  currDate.setHours(currDate.getHours() + 8);
  const currDatePlusTwoHours = new Date();
  currDatePlusTwoHours.setHours(currDatePlusTwoHours.getHours() + 10);
  const [startDate, setStartDate] = useState(currDate);
  const [endDate, setEndDate] = useState(currDatePlusTwoHours);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [participants, setParticipants] = useState('');
  const [volunteers, setVolunteers] = useState('');
  const [noCap, setNoCap] = useState(false);
  const [noNeed, setNoNeed] = useState(false);
  const [tag, setTag] = useState(TAG_OPTIONS[0]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date, isStart = true) => {
    if (Platform.OS === 'android') {
      if (isStart) setShowStartPicker(false);
      else setShowEndPicker(false);
    }

    if (selectedDate) {
      if (isStart) setStartDate(selectedDate);
      else setEndDate(selectedDate);
    }
  };

  const showPicker = (type: 'date' | 'time', isStart: boolean) => {
    setMode(type);
    if (isStart) setShowStartPicker(true);
    else setShowEndPicker(true);
  };

  const toLocalISOString = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
        date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        ' ' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds())
    );
  };

  const handleNext = () => {
    if (!title || !location || !startDate || !endDate || !tag) {
      Alert.alert("Missing Fields", "Please fill in all required information.");
      return;
    }

    const finalParticipants = noCap ? null : (participants ? parseInt(participants) : null);
    const finalVolunteers = noNeed ? 0 : (volunteers ? parseInt(volunteers) : 0);

    router.push({
      pathname: '/eventCreation/specificInfo',
      params: { 
        basicInfo: JSON.stringify({
        title, 
        location, 
        startTime: toLocalISOString(startDate), 
        endTime: toLocalISOString(endDate),
        totalSlots: finalParticipants,
        volunteers: finalVolunteers,
        tag
        }) 
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create New Event</Text>
        <Text style={styles.headerSubtitle}>Fill in event details</Text>
      </View>
      
      <View style={styles.divider} />

      <View style={styles.formContainer}>
        
        {/* 1. EVENT TITLE */}
        <Text style={styles.label}>Event Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter event name"
          value={title}
          onChangeText={setTitle}
        />

        {/* 2. LOCATION */}
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. MTC Office"
          value={location}
          onChangeText={setLocation}
        />

        {/* 3. START DATETIME */}
        <Text style={styles.label}>Start Date & Time</Text>
        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => showPicker('date', true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => showPicker('time', true)}
          >
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.dateText}>
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. END DATETIME */}
        <Text style={styles.label}>End Date & Time</Text>
        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => showPicker('date', false)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => showPicker('time', false)}
          >
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.dateText}>
              {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hidden Date Pickers (Rendered conditionally) */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode={mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => onDateChange(e, d, true)}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode={mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => onDateChange(e, d, false)}
          />
        )}

        {/* 5. PARTICIPANTS */}
        <Text style={styles.label}>Total Participants Allowed</Text>
        <View style={styles.rowCentered}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }, noCap && styles.disabledInput]}
            placeholder="e.g. 20"
            keyboardType="numeric"
            value={participants}
            onChangeText={setParticipants}
            editable={!noCap}
          />
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>No Cap</Text>
            <Switch
              value={noCap}
              onValueChange={setNoCap}
              trackColor={{ false: "#767577", true: "#10B981" }}
            />
          </View>
        </View>

        {/* 6. VOLUNTEERS */}
        <Text style={styles.label}>Total Volunteers Needed</Text>
        <View style={styles.rowCentered}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }, noNeed && styles.disabledInput]}
            placeholder="e.g. 5"
            keyboardType="numeric"
            value={volunteers}
            onChangeText={setVolunteers}
            editable={!noNeed}
          />
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>No Need</Text>
            <Switch
              value={noNeed}
              onValueChange={setNoNeed}
              trackColor={{ false: "#767577", true: "#10B981" }}
            />
          </View>
        </View>

        {/* 7. TAG */}
        <Text style={styles.label}>Category Tag</Text>
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setShowTagDropdown(!showTagDropdown)}
        >
          <Text style={styles.dropdownText}>{tag}</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        
        {showTagDropdown && (
          <View style={styles.dropdownList}>
            {TAG_OPTIONS.map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.dropdownItem}
                onPress={() => {
                  setTag(option);
                  setShowTagDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, tag === option && styles.activeDropdownItem]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* NEXT BUTTON */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleNext}>
          <Text style={styles.submitBtnText}>Next</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#002147',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 15,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#374151',
  },
  switchContainer: {
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 10,
    marginBottom: 4,
    color: '#666',
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownList: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  activeDropdownItem: {
    color: '#002147',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#002147',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
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
import { useTranslation } from 'react-i18next';

// Event Types
const TAG_OPTIONS = [
  { value: 'Activities at MTC Office', labelKey: 'eventCreation.tagActivities' },
  { value: 'Outings', labelKey: 'eventCreation.tagOutings' },
  { value: 'Nature Walks', labelKey: 'eventCreation.tagNatureWalks' },
  { value: 'Gym and Dance', labelKey: 'eventCreation.tagGymDance' },
  { value: 'Reading', labelKey: 'eventCreation.tagReading' },
];

export default function CreateEventScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
  const [isWheelchairAccessible, setIsWheelchairAccessible] = useState(false);
  const [tag, setTag] = useState(TAG_OPTIONS[0].value);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date, isStart = true) => {
    // Close picker on both platforms after selection
    if (isStart) setShowStartPicker(false);
    else setShowEndPicker(false);

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
      Alert.alert(t('eventCreation.missingFields'), t('eventCreation.fillRequired'));
      return;
    }

    // Validate start and end datetime
    if (endDate <= startDate) {
      Alert.alert(t('eventCreation.invalidDateTime'), t('eventCreation.endAfterStart'));
      return;
    }

    const currDate = new Date();
    if (currDate > startDate) {
      Alert.alert(t('eventCreation.invalidDateTime'), t('eventCreation.pastEvent'));
      return;
    }

    const finalParticipants = noCap ? null : (participants ? parseInt(participants) : null);
    const finalVolunteers = noNeed ? null : (volunteers ? parseInt(volunteers) : null);

    router.push({
      pathname: '/eventCreation/specificInfo',
      params: { 
        basicInfo: JSON.stringify({
        title, 
        location, 
        startTime: toLocalISOString(startDate), 
        endTime: toLocalISOString(endDate),
        participantSlots: finalParticipants,
        volunteerSlots: finalVolunteers,
        wheelchairAccessible: isWheelchairAccessible,
        tag
        }) 
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color='#002C5E' />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('eventCreation.createNewEvent')}</Text>
          <Text style={styles.headerSubtitle}>{t('eventCreation.fillDetails')}</Text>
        </View>        
      </View>
      
      <View style={styles.divider} />

      <View style={styles.formContainer}>
        
        {/* 1. EVENT TITLE */}
        <Text style={styles.label}>{t('eventCreation.eventTitle')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('eventCreation.eventTitlePlaceholder')}
          value={title}
          onChangeText={setTitle}
        />

        {/* 2. LOCATION */}
        <Text style={styles.label}>{t('eventCreation.location')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('eventCreation.locationPlaceholder')}
          value={location}
          onChangeText={setLocation}
        />

        {/* 3. START DATETIME */}
        <Text style={styles.label}>{t('eventCreation.startDateTime')}</Text>
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
        <Text style={styles.label}>{t('eventCreation.endDateTime')}</Text>
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
        <Text style={styles.label}>{t('eventCreation.totalParticipants')}</Text>
        <View style={styles.rowCentered}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }, noCap && styles.disabledInput]}
            placeholder={t('eventCreation.participantsPlaceholder')}
            keyboardType="numeric"
            value={participants}
            onChangeText={setParticipants}
            editable={!noCap}
          />
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>{t('eventCreation.noCap')}</Text>
            <Switch
              value={noCap}
              onValueChange={setNoCap}
              trackColor={{ false: "#767577", true: "#10B981" }}
            />
          </View>
        </View>

        {/* 6. VOLUNTEERS */}
        <Text style={styles.label}>{t('eventCreation.totalVolunteers')}</Text>
        <View style={styles.rowCentered}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }, noNeed && styles.disabledInput]}
            placeholder={t('eventCreation.volunteersPlaceholder')}
            keyboardType="numeric"
            value={volunteers}
            onChangeText={setVolunteers}
            editable={!noNeed}
          />
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>{t('eventCreation.noNeed')}</Text>
            <Switch
              value={noNeed}
              onValueChange={setNoNeed}
              trackColor={{ false: "#767577", true: "#10B981" }}
            />
          </View>
        </View>

        {/* 7. WHEELCHAIR ACCESSIBLE (NEW) */}
        <Text style={styles.label}>{t('eventCreation.wheelchairAccessible')}</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity 
            style={[styles.radioButton, isWheelchairAccessible && styles.radioButtonSelected]} 
            onPress={() => setIsWheelchairAccessible(true)}
          >
            <Ionicons 
              name={isWheelchairAccessible ? "radio-button-on" : "radio-button-off"} 
              size={20} 
              color={isWheelchairAccessible ? "#002C5E" : "#666"} 
            />
            <Text style={[styles.radioText, isWheelchairAccessible && styles.radioTextSelected]}>
              {t('common.yes')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.radioButton, !isWheelchairAccessible && styles.radioButtonSelected]} 
            onPress={() => setIsWheelchairAccessible(false)}
          >
            <Ionicons 
              name={!isWheelchairAccessible ? "radio-button-on" : "radio-button-off"} 
              size={20} 
              color={!isWheelchairAccessible ? "#002C5E" : "#666"} 
            />
            <Text style={[styles.radioText, !isWheelchairAccessible && styles.radioTextSelected]}>
              {t('common.no')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 8. TAG */}
        <Text style={styles.label}>{t('eventCreation.categoryTag')}</Text>
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setShowTagDropdown(!showTagDropdown)}
        >
          <Text style={styles.dropdownText}>
            {t(TAG_OPTIONS.find((option) => option.value === tag)?.labelKey ?? '')}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        
        {showTagDropdown && (
          <View style={styles.dropdownList}>
            {TAG_OPTIONS.map((option) => (
              <TouchableOpacity 
                key={option.value} 
                style={styles.dropdownItem}
                onPress={() => {
                  setTag(option.value);
                  setShowTagDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, tag === option.value && styles.activeDropdownItem]}>
                  {t(option.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* NEXT BUTTON */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleNext}>
          <Text style={styles.submitBtnText}>{t('common.next')}</Text>
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
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerText: {
    marginHorizontal: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#002C5E',
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
  radioGroup: {
    flexDirection: 'row',
    gap: 15,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 8,
    backgroundColor: '#fff',
    flex: 1, // Makes them split width equally
  },
  radioButtonSelected: {
    borderColor: '#002C5E',
    backgroundColor: '#F0F9FF', // Very light blue background when selected
  },
  radioText: {
    fontSize: 16,
    color: '#374151',
  },
  radioTextSelected: {
    color: '#002C5E',
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
    color: '#002C5E',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#002C5E',
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

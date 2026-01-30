import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import RNPickerSelect from 'react-native-picker-select';
import { postAnnouncement, postEventAnnouncement } from '@/services/announmentService';
import { useTranslation } from 'react-i18next';
import { fetchEvents } from '@/services/eventService';
import { Event } from '@/types/event';

const { width, height } = Dimensions.get("window");

interface PickerItem {
  label: string;
  value: string | number | null;
}

export default function CreateAnnouncementScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [events, setEvents] = useState<PickerItem[]>([]);
  const [isEventLoading, setIsEventLoading] = useState<boolean>(true);
  const [selectedEventId, setSelectedEventId] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Replace this with your actual API call
        const eventData = await fetchEvents();
        
        // Format for the Picker: { label: 'Name', value: 'ID' }
        const formattedEvents: PickerItem[] = eventData.filter(
          (event: Event) => new Date(event.date) > new Date()
        ).map((event: Event) => ({
          label: event.title + " (" + new Date(event.date).toLocaleDateString('en-GB') + ")", // or event.name
          value: event.id,
        }));
        console.log(formattedEvents);

        // Add a "Global" option at the very top
        setEvents([
          { label: t('createAnnouncement.globalOption', 'Global (All Users)'), value: null },
          ...formattedEvents
        ]);
      } catch (error) {
        console.error("Failed to fetch events", error);
        Alert.alert(t('common.error'), "Could not load events list.");
      } finally {
        setIsEventLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert(
        t('announcements.missingTitle'),
        t('announcements.missingTitleMessage'),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedEventId) {
        await postEventAnnouncement(selectedEventId, title, message.trim());
      } else {
        await postAnnouncement(title, message.trim());
      }
      Alert.alert(t('common.success'), t('createAnnouncement.announcementPosted'), [
        { text: t('common.ok'), onPress: () => router.navigate("/(tabs)/announcement") }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert(
        t('common.error'),
        t('announcements.failedToPost'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      
      {/* HEADER */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color='#002C5E' />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{t('createAnnouncement.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('createAnnouncement.subtitle')}</Text>
      </View>
      
      <View style={styles.divider} />

      <View style={styles.formContainer}>

        {/* RECIPIENT DROPDOWN */}
        <Text style={styles.label}>{t('createAnnouncement.recipient', 'Recipient')}</Text>
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.dropdownText}>
            {t(events.find((option) => option.value === selectedEventId)?.label ?? '')}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        
        {showDropdown && (
          <ScrollView style={styles.dropdownList}>
            {events.map((option) => (
              <TouchableOpacity 
                key={option.value} 
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedEventId(option.value);
                  setShowDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, selectedEventId === option.value && styles.activeDropdownItem]}>
                  {t(option.label)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {/* 1. TITLE INPUT */}
        <Text style={styles.label}>{t('createAnnouncement.announcementTitle')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('createAnnouncement.titlePlaceholder')}
          value={title}
          onChangeText={setTitle}
          maxLength={60}
          placeholderTextColor="#9CA3AF"
        />

        {/* 2. MESSAGE INPUT (Multiline) */}
        <Text style={styles.label}>
          {t('createAnnouncement.message')}
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('createAnnouncement.messagePlaceholder')}
          value={message}
          onChangeText={setMessage}
          multiline={true}
          numberOfLines={6}
          textAlignVertical="top" // Crucial for Android to start text at top
          placeholderTextColor="#9CA3AF"
        />

        {/* 3. SUBMIT BUTTON */}
        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
          onPress={handlePost}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{t('createAnnouncement.postAnnouncement')}</Text>
          )}
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
  backButton: {
    marginBottom: 15, // Space between arrow and title
    alignSelf: 'flex-start',
    paddingRight: 10, // Larger touch target
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
  optionalLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
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
    height: height * 0.25
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
  textArea: {
    minHeight: 150, // Fixed height for message box
    paddingTop: 12, // Ensure text starts at the very top
  },
  submitBtn: {
    backgroundColor: '#002C5E',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
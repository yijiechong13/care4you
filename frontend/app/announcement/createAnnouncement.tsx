import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { postAnnouncement } from '@/services/announmentService';
import { useTranslation } from 'react-i18next';

export default function CreateAnnouncementScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await postAnnouncement(title, message.trim());
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
          {t('createAnnouncement.message')}{' '}
          <Text style={styles.optionalLabel}>({t('announcements.optional')})</Text>
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

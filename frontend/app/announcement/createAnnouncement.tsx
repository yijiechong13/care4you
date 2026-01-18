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

export default function CreateAnnouncementScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePost = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Missing Fields", "Please fill in both the title and message.");
      return;
    }

    setIsSubmitting(true);

    try {
      await postAnnouncement(title, message);
      Alert.alert("Success", "Announcement posted successfully!", [
        { text: "OK", onPress: () => router.navigate("/(tabs)/announcement") }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to post announcement. Please check your connection.");
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
        
        <Text style={styles.headerTitle}>New Announcement</Text>
        <Text style={styles.headerSubtitle}>Share updates with everyone</Text>
      </View>
      
      <View style={styles.divider} />

      <View style={styles.formContainer}>
        
        {/* 1. TITLE INPUT */}
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Activity Canceled / New Event"
          value={title}
          onChangeText={setTitle}
          maxLength={60}
          placeholderTextColor="#9CA3AF"
        />

        {/* 2. MESSAGE INPUT (Multiline) */}
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Type your announcement details here..."
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
            <Text style={styles.submitBtnText}>Post Announcement</Text>
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
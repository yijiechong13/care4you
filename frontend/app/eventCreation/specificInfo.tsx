import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { publishEvent } from '@/services/eventService';

export default function SpecificInfoScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [questions, setQuestions] = useState([
    { id: 1, title: '', options: [''] } // Start with 1 empty question
  ]);
  const params = useLocalSearchParams();
  const basicInfo = params.basicInfo ? JSON.parse(params.basicInfo as string) : {};

  // 1. Image Picker
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 2. Question Logic
  const addQuestion = () => {
    const newId = questions.length + 1;
    setQuestions([...questions, { id: newId, title: '', options: [''] }]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestionTitle = (text: string, index: number) => {
    const newQuestions = [...questions];
    newQuestions[index].title = text;
    setQuestions(newQuestions);
  };

  // 3. Option Logic
  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push(''); // Add empty option
    setQuestions(newQuestions);
  };

  const updateOption = (text: string, qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = text;
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  // 4. Final Submit
  const handlePublish = async () => {
    const cleanedQuestions = questions
    .map(q => ({
        ...q,
        title: q.title.trim(),
        options: q.options.map(opt => opt.trim())
                            .filter(opt => opt != "")
    }))
    .filter(q => q.title != "" && q.options.length > 0);

    console.log("--- Event Data ---");
    console.log("Reminders:", reminders);
    console.log("Image:", imageUri);
    console.log("MCQ Questions:", JSON.stringify(cleanedQuestions, null, 2));

    try {
        await publishEvent(
            { 
                ...basicInfo, 
                reminders, 
                imageUrl: imageUri 
            }, 
            cleanedQuestions
        );

        Alert.alert("Success", "Event Published!", [
            { text: "OK", onPress: () => router.navigate('/(tabs)/events') }
        ]);
    } catch (error) {
        Alert.alert("Error", "Failed to publish event.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#002C5E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Additional Details</Text>
        <Text style={styles.headerSubtitle}>Customize your registration form</Text>
      </View>
      <View style={styles.divider} />

      <View style={styles.formContainer}>

        {/* SECTION 1 */}
        <Text style={styles.sectionHeader}>EVENT INFORMATION</Text>

        {/* Reminders */}
        <Text style={styles.label}>Important Reminders</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. Please bring your own towel and water bottle."
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
          value={reminders}
          onChangeText={setReminders}
        />

        {/* Photo Upload */}
        <Text style={styles.label}>Event Photo</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="cloud-upload-outline" size={32} color="#666" />
              <Text style={styles.uploadText}>Tap to upload banner image</Text>
            </View>
          )}
        </TouchableOpacity>


        {/* SECTION 2: MCQ BUILDER */}
        <View style={styles.mcqHeaderContainer}>
            <Text style={styles.sectionHeader}>REGISTRATION QUESTIONS (MCQ)</Text>
        </View>

        {questions.map((q, qIndex) => (
          <View key={q.id} style={styles.questionCard}>
            
            {/* Question Title Header */}
            <View style={styles.questionHeader}>
                <Text style={styles.questionLabel}>Question {qIndex + 1}</Text>
                {questions.length > 1 && (
                    <TouchableOpacity onPress={() => removeQuestion(qIndex)}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Question Input */}
            <TextInput
              style={styles.input}
              placeholder="e.g. Dietary Requirements / Meeting points?"
              value={q.title}
              onChangeText={(text) => updateQuestionTitle(text, qIndex)}
            />

            {/* Options List */}
            {q.options.map((option, oIndex) => (
              <View key={oIndex} style={styles.optionRow}>
                <Ionicons name="radio-button-off" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Option ${oIndex + 1}`}
                  value={option}
                  onChangeText={(text) => updateOption(text, qIndex, oIndex)}
                />
                {q.options.length > 1 && (
                  <TouchableOpacity onPress={() => removeOption(qIndex, oIndex)}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Add Option Button */}
            <TouchableOpacity style={styles.addOptionBtn} onPress={() => addOption(qIndex)}>
              <Text style={styles.addOptionText}>+ Add Option</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Question Button */}
        <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
            <Ionicons name="add-circle-outline" size={20} color="#002C5E" />
            <Text style={styles.addQuestionText}>Add Another Question</Text>
        </TouchableOpacity>

        {/* PUBLISH BUTTON */}
        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
          <Text style={styles.publishBtnText}>Publish Event</Text>
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginBottom: 15,
    marginTop: 10,
    letterSpacing: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
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
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    paddingTop: 12, // For multiline text align
  },
  uploadBox: {
    height: 150,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden'
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 8
  },
  uploadText: {
    color: '#6B7280',
    fontSize: 14
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  
  // MCQ STYLES
  mcqHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280'
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10
  },
  optionInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 4,
    fontSize: 14,
    color: '#374151'
  },
  addOptionBtn: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingVertical: 5,
  },
  addOptionText: {
    fontSize: 14,
    color: '#002C5E',
    fontWeight: '600'
  },

  // BOTTOM BUTTONS
  addQuestionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#002C5E',
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 10
  },
  addQuestionText: {
    color: '#002C5E',
    fontWeight: 'bold',
    fontSize: 14
  },
  publishBtn: {
    backgroundColor: '#002C5E',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  publishBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
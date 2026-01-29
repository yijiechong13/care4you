import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Button,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "@/types/event";
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadow,
  spacing,
} from "@/constants/theme";
import { cancelEvent, cancelRegistration } from "@/services/eventService";
import { useRouter } from "expo-router";
import { postAnnouncement } from "@/services/announmentService";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import { markAttendance } from "@/services/attendanceService";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";

interface EventCardProps {
  event: Event;
  isStaff?: boolean;
  onExport?: (eventId: string, eventTitle: string) => void;
  isExporting?: boolean;
  regId: string;
  regStatus: string;
}

export function EventCard({
  event,
  isStaff,
  onExport,
  isExporting,
  regId,
  regStatus,
}: EventCardProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const formatTime = (start: string, end: string) => `${start} - ${end}`;
  const [showQR, setShowQR] = React.useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showScanner, setShowScanner] = React.useState(false); // New state for staff
  const [scanned, setScanned] = React.useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  // Translate dynamic content (venue kept in English)
  const qaTexts = useMemo(
    () => (event.selectedResponses || []).flatMap((r) => [r.question, r.answer]),
    [event.selectedResponses]
  );
  const textsToTranslate = useMemo(
    () => [event.title || '', event.reminders || '', ...qaTexts],
    [event.title, event.reminders, qaTexts]
  );
  const translated = useTranslatedContent(textsToTranslate);
  const translatedTitle = translated[0] || event.title;
  const translatedReminders = translated[1] || event.reminders;
  const translatedResponses = useMemo(() => {
    if (!event.selectedResponses?.length) return [];
    return event.selectedResponses.map((item, index) => ({
      question: translated[2 + index * 2] || item.question,
      answer: translated[2 + index * 2 + 1] || item.answer,
    }));
  }, [event.selectedResponses, translated]);

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          t("common.error"),
          "Camera permission is required to scan QR codes.",
        );
        return;
      }
    }
    setScanned(false);
    setShowScanner(true);
  };

  const qrValue = JSON.stringify({
    uID: event.userId, // Your User/Guest ID
    eID: event.id, // The specific event
    rID: regId, // Registration ID
    ts: Date.now(), // Current timestamp for security
  });

  const formatDate = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return t("events.todayLabel");
    }
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleCancel = async () => {
    try {
      Alert.alert(
        t("events.cancelEventTitle"),
        t("events.cancelEventMessage"),
        [
          { text: t("common.exit"), style: "cancel" },
          {
            text: t("common.cancel"),
            style: "destructive",
            onPress: async () => {
              await cancelEvent(event.id);

              const announcementMsg =
                i18n.t("events.cancelAnnouncementIntro", {
                  title: event.title,
                  date: event.date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }),
                  lng: "en",
                }) +
                "\n\n" +
                i18n.t("events.cancelAnnouncementBody", { lng: "en" }) +
                "\n\n" +
                i18n.t("events.cancelAnnouncementThanks", { lng: "en" });
              await postAnnouncement(
                i18n.t("events.cancelAnnouncementTitle", {
                  title: event.title,
                  lng: "en",
                }),
                announcementMsg,
              );
              router.replace("/(tabs)/home");
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(t("common.error"), t("events.cancelFailed"));
    }
  };

  const handleCancelRegistration = () => {
    try {
      Alert.alert(
        t("events.cancelRegistrationTitle"),
        t("events.cancelRegistrationMessage"),
        [
          { text: t("common.exit"), style: "cancel" },
          {
            text: t("common.cancel"),
            style: "destructive",
            onPress: async () => {
              await cancelRegistration(regId);

              router.replace("/(tabs)/home");
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(t("common.error"), t("events.cancelRegFailed"));
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return; // Prevent double triggers
    setScanned(true);

    try {
      const payload = JSON.parse(data);

      // Validation logic
      if (payload.eID !== event.id) {
        Alert.alert("Wrong Event", "This QR code is for a different activity.");
        setScanned(false);
        return;
      }

      await markAttendance(payload);

      Alert.alert("Success", "Attendance marked!", [
        {
          text: "OK",
          onPress: () => {
            setShowScanner(false);
            setScanned(false);
          },
        },
      ]);
    } catch (e) {
      Alert.alert("Error", "Invalid QR code or network error.");
      setScanned(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Status Badge */}
      <View style={styles.statusContainer}>
        <View style={styles.statusDot} />
        <Text
          style={[styles.statusText, { color: statusColors[event.status] }]}
        >
          {t(`events.status.${event.status}`)}
        </Text>
      </View>
      {/* Cancel / Withdraw — top-right corner */}
      {event.eventStatus == "cancelled" && (
        <View style={styles.statusBadge}>
          <Ionicons name="close-circle" size={14} color={colors.gray[400]} />
          <Text style={styles.statusBadgeText}>{t("events.cancelled")}</Text>
        </View>
      )}

      {isStaff && event.eventStatus != "cancelled" && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Ionicons name="close-circle-outline" size={15} color="#DC2626" />
          <Text style={styles.cancelButtonText}>
            {t("events.cancelAction")}
          </Text>
        </TouchableOpacity>
      )}

      {regStatus == "cancelled" && (
        <View style={styles.statusBadge}>
          <Ionicons name="close-circle" size={14} color={colors.gray[400]} />
          <Text style={styles.statusBadgeText}>{t("events.withdraw")}</Text>
        </View>
      )}

      {!isStaff &&
        event.eventStatus != "cancelled" &&
        regStatus != "cancelled" && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRegistration}
          >
            <Ionicons name="log-out-outline" size={15} color="#DC2626" />
            <Text style={styles.cancelButtonText}>
              {t("events.withdrawAction")}
            </Text>
          </TouchableOpacity>
        )}

      {/* Event Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{translatedTitle}</Text>
          <Text style={styles.dateTime}>
            {formatDate(event.date)} •{" "}
            {formatTime(event.startTime, event.endTime)}
          </Text>
        </View>
      </View>
      {/* Important Notice */}
      {event.reminders && (
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeTitle}>{t("events.importantNotice")}</Text>
          <Text style={styles.noticeText}>{translatedReminders}</Text>
        </View>
      )}
      {/* Registration Counts - Staff View (uses same data as home page) */}
      {isStaff && (
        <View style={styles.registrationContainer}>
          <View style={styles.signUpHeader}>
            <Text style={styles.signUpTitle}>{t("events.signUps")}</Text>
            {onExport && (
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => onExport(event.id, event.title)}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="download-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.exportButtonText}>
                      {t("events.export")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.countsRow}>
            <View style={styles.countItem}>
              <Text style={styles.countNumber}>
                {event.takenSlots ?? 0}
                {event.participantSlots != null && (
                  <Text style={styles.countCap}>
                    {" "}
                    / {event.participantSlots}
                  </Text>
                )}
              </Text>
              <Text style={styles.countLabel}>{t("events.participants")}</Text>
            </View>
            <View style={styles.countDivider} />
            <View style={styles.countItem}>
              <Text style={styles.countNumber}>
                {event.volunteerTakenSlots ?? 0}
                {event.volunteerSlots != null && event.volunteerSlots > 0 && (
                  <Text style={styles.countCap}> / {event.volunteerSlots}</Text>
                )}
              </Text>
              <Text style={styles.countLabel}>{t("events.volunteers")}</Text>
            </View>
          </View>
        </View>
      )}
      {/* Event Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>{t("events.eventDetails")}</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <View>
            <Text style={styles.detailLabel}>{t("events.venue")}</Text>
            <Text style={styles.detailValue}>{event.venue}</Text>
          </View>
        </View>

        {translatedResponses.length ? (
          <View style={styles.qaContainer}>
            <Text style={styles.qaTitle}>{t("events.yourResponses")}</Text>
            {translatedResponses.map((item, index) => (
              <View key={`${item.question}-${index}`} style={styles.qaRow}>
                <Text style={styles.qaQuestion}>{item.question}</Text>
                <Text style={styles.qaAnswer}>{item.answer}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {isStaff ? (
        // STAFF BUTTON: Only triggers permission when clicked
        <TouchableOpacity
          style={styles.staffAttendanceButton}
          onPress={handleOpenScanner}
        >
          <Ionicons name="camera-outline" size={18} color="#16A34A" />
          <Text style={styles.staffAttendanceButtonText}>{t("events.scanParticipantQR")}</Text>
        </TouchableOpacity>
      ) : (
        // USER BUTTON
        regStatus !== "cancelled" && (
          <TouchableOpacity
            style={styles.attendanceButton}
            onPress={() => setShowQR(true)}
          >
            <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
            <Text style={styles.attendanceButtonText}>{t("events.takeAttendance")}</Text>
          </TouchableOpacity>
        )
      )}
      <Modal
        visible={showQR}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{translatedTitle}</Text>
            <Text style={styles.modalSubtitle}>Show this to the staff</Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={qrValue}
                size={200}
                color={colors.primary}
                backgroundColor="white"
              />
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQR(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          {/* Using CameraView instead of BarCodeScanner */}
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"], // Performance boost: only look for QRs
            }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTopInfo}>
              <Text style={styles.scannerText}>Event: {translatedTitle}</Text>
            </View>

            <View style={styles.scanTarget} />

            <TouchableOpacity
              style={styles.closeScannerButton}
              onPress={() => setShowScanner(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: fontSize.sm - 1,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  dateTime: {
    fontSize: fontSize.md,
    color: colors.gray[500],
  },
  cancelButton: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: borderRadius.md,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 1,
  },
  cancelButtonText: {
    fontSize: fontSize.xs,
    color: "#DC2626",
    fontWeight: fontWeight.semibold,
  },
  statusBadge: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 1,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    fontWeight: fontWeight.semibold,
  },
  noticeContainer: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  noticeText: {
    fontSize: fontSize.sm + 1,
    color: colors.warningDark,
  },
  detailsContainer: {
    marginTop: spacing.sm,
  },
  detailsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  detailIcon: {
    fontSize: fontSize.xl,
    marginRight: spacing.md,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.gray[700],
  },
  qaContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  qaTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.gray[500],
    marginBottom: spacing.sm,
    letterSpacing: 0.4,
  },
  qaRow: {
    marginBottom: spacing.sm,
  },
  qaQuestion: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: 2,
  },
  qaAnswer: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  registrationContainer: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  signUpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  signUpTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  exportButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
    marginLeft: 4,
  },
  capacityText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  countsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  countItem: {
    alignItems: "center",
    flex: 1,
  },
  countNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  countCap: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.gray[400],
  },
  countLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  countDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  totalCount: {
    color: colors.success,
  },
  attendanceButton: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  attendanceButtonText: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
  staffAttendanceButton: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  staffAttendanceButtonText: {
    color: "#16A34A",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    width: "100%",
    ...shadow.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
  },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  closeButton: {
    padding: spacing.md,
    width: "100%",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
  },
  closeButtonText: {
    fontWeight: fontWeight.bold,
    color: colors.gray[700],
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  scannerOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 100,
  },
  scannerText: {
    color: "white",
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 10,
  },
  scanTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: "transparent",
    borderRadius: 20,
  },
  closeScannerButton: {
    backgroundColor: "white",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  scannerTopInfo: {
    marginTop: 60, // Pushes it down past the phone's "notch" or status bar
    paddingHorizontal: 20,
    alignItems: "center",
    width: "100%",
  },
});

const statusColors = {
  today: colors.primary,
  upcoming: colors.primary,
  completed: colors.gray[500],
} as const;

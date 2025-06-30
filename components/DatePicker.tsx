import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { X, Calendar } from 'lucide-react-native';

interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  selectedDate?: string;
  minDate?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
  minDate,
}) => {
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate || '');

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    const minDateTime = minDate ? new Date(minDate).getTime() : today.getTime();
    
    // Generate next 30 days from min date
    for (let i = 0; i < 30; i++) {
      const date = new Date(minDateTime + (i * 24 * 60 * 60 * 1000));
      dates.push({
        value: date.toISOString().split('T')[0],
        label: formatDateLabel(date),
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    
    return dates;
  };

  const formatDateLabel = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} ${month} ${year}`;
  };

  const handleConfirm = () => {
    if (tempSelectedDate) {
      onSelectDate(tempSelectedDate);
    }
    onClose();
  };

  const dates = generateDates();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📅 Pilih Tanggal Jatuh Tempo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.datesList} showsVerticalScrollIndicator={false}>
            {dates.map((date) => (
              <TouchableOpacity
                key={date.value}
                style={[
                  styles.dateItem,
                  tempSelectedDate === date.value && styles.selectedDateItem,
                  date.isToday && styles.todayDateItem,
                ]}
                onPress={() => setTempSelectedDate(date.value)}
              >
                <View style={styles.dateContent}>
                  <Text
                    style={[
                      styles.dateLabel,
                      tempSelectedDate === date.value && styles.selectedDateLabel,
                      date.isToday && styles.todayDateLabel,
                    ]}
                  >
                    {date.label}
                  </Text>
                  {date.isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>Hari Ini</Text>
                    </View>
                  )}
                </View>
                {tempSelectedDate === date.value && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Batal"
              onPress={onClose}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title="Pilih Tanggal"
              onPress={handleConfirm}
              style={styles.confirmButton}
              disabled={!tempSelectedDate}
              leftElement={<Calendar size={16} color="#FFFFFF" />}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  datesList: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDateItem: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  todayDateItem: {
    backgroundColor: `${colors.secondary}10`,
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedDateLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  todayDateLabel: {
    color: colors.secondary,
  },
  todayBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  todayBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});
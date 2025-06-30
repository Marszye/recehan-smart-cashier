import { Linking, Alert } from 'react-native';

export const sendWhatsAppMessage = async (phoneNumber: string, message: string): Promise<void> => {
  try {
    // Clean phone number - remove any non-digit characters except +
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure the number starts with country code
    let formattedNumber = cleanedNumber;
    if (!formattedNumber.startsWith('+')) {
      // If no country code, assume Indonesia (+62)
      if (formattedNumber.startsWith('0')) {
        formattedNumber = '+62' + formattedNumber.substring(1);
      } else if (!formattedNumber.startsWith('62')) {
        formattedNumber = '+62' + formattedNumber;
      } else {
        formattedNumber = '+' + formattedNumber;
      }
    }
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`;
    
    // Check if WhatsApp is available
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback to web WhatsApp
      const webWhatsappUrl = `https://wa.me/${formattedNumber.replace('+', '')}?text=${encodedMessage}`;
      await Linking.openURL(webWhatsappUrl);
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    Alert.alert('Error', 'Gagal membuka WhatsApp. Pastikan WhatsApp terinstall di perangkat Anda.');
    throw error;
  }
};

export const formatPhoneForWhatsApp = (phoneNumber: string): string => {
  // Clean phone number - remove any non-digit characters except +
  const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure the number starts with country code
  let formattedNumber = cleanedNumber;
  if (!formattedNumber.startsWith('+')) {
    // If no country code, assume Indonesia (+62)
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '+62' + formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('62')) {
      formattedNumber = '+62' + formattedNumber;
    } else {
      formattedNumber = '+' + formattedNumber;
    }
  }
  
  return formattedNumber;
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic validation for Indonesian phone numbers
  const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check if it's a valid Indonesian number
  if (cleanedNumber.startsWith('+62')) {
    return cleanedNumber.length >= 12 && cleanedNumber.length <= 15;
  } else if (cleanedNumber.startsWith('62')) {
    return cleanedNumber.length >= 11 && cleanedNumber.length <= 14;
  } else if (cleanedNumber.startsWith('0')) {
    return cleanedNumber.length >= 10 && cleanedNumber.length <= 13;
  }
  
  return false;
};
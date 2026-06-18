import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, StyleProp, ViewStyle } from 'react-native'
import { COLORS } from '@/constants/theme'
import { Ionicons } from '@expo/vector-icons'

interface ButtonProps {
  label?: string
  onPress: () => void
  variant?: 'primary' | 'danger' | 'outline' | 'fab' | 'icon'
  isLoading?: boolean
  disabled?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  style?: StyleProp<ViewStyle>
}

export const Button = ({ label, onPress, variant = 'primary', isLoading, disabled = false, icon, style }: ButtonProps) => {
  const getBgColor = () => {
    if (variant === 'primary') return COLORS.primary
    if (variant === 'danger') return COLORS.danger
    if (variant === 'fab') return COLORS.primary
    if (variant === 'icon') return COLORS.surfaceLight
    return 'transparent'
  }

  const isDisabled = isLoading || disabled

  const getVariantStyles = (): ViewStyle => {
    if (variant === 'fab') {
      return {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      }
    }
    if (variant === 'icon') {
      return {
        padding: 8,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }
    }
    return {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: variant === 'outline' ? COLORS.border : 'transparent',
    }
  }
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        {
          backgroundColor: getBgColor(),
          opacity: isDisabled ? 0.3 : (isLoading ? 0.7 : 1),
        },
        getVariantStyles(),
        style
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.text} />
      ) : (
        <>
          {icon && (
            <Ionicons 
              name={icon} 
              size={variant === 'fab' ? 32 : 24} 
              color={variant === 'fab' ? COLORS.text : COLORS.primary} 
            />
          )}
          {label && (
            <Text style={{
              color: disabled && variant === 'outline' ? COLORS.textMuted : COLORS.text,
              fontSize: 16,
              fontWeight: '600',
              marginLeft: icon ? 8 : 0
            }}>
              {label}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  )
}

import React from 'react'
import { View, Text } from 'react-native'
import { COLORS } from '@/constants/theme'
import { Button } from '@/components/ui/Button'

interface CycleNavigatorProps {
  title: string
  isCurrent: boolean
  canGoBack: boolean
  cycleOffset: number
  onPrev: () => void
  onNext: () => void
}

export const CycleNavigator = ({ title, isCurrent, canGoBack, cycleOffset, onPrev, onNext }: CycleNavigatorProps) => {
  return (
    <View style={{ 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 15, 
      marginTop: 10, 
      marginBottom: 20 
    }}>
      <Button 
        variant="icon"
        icon="chevron-back"
        onPress={onPrev}
        disabled={!canGoBack}
      />

      <View style={{ 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingHorizontal: 10, 
        flexWrap: 'wrap', 
        gap: 8 
      }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text, textTransform: 'capitalize', textAlign: 'center' }}>
          {title}
        </Text>
        {isCurrent && (
          <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ color: COLORS.background, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>
              Actual
            </Text>
          </View>
        )}
      </View>

      <Button 
        variant="icon"
        icon="chevron-forward"
        onPress={onNext}
        disabled={cycleOffset <= 0} 
        style={{ opacity: cycleOffset <= 0 ? 0.3 : 1 }}
      />
    </View>
  )
}
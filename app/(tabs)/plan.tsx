import React from "react"
import { View, Text } from "react-native"
import { COLORS } from "@/constants/theme"

export default function PlanScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: COLORS.textMuted, fontSize: 18 }}>
        Aqui se construira la configuracion de Mi Plan
      </Text>
    </View>
  )
}
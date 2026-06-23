import React, { useState, useEffect } from "react"
import { useRouter } from "expo-router"
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/theme"
import { useSettingsStore } from "@/store/useSettingsStore"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { ExcelService } from "@/utils/excelHelpers"
import { useSheetStore } from "@/store/useSheetStore"

type PlanType = 'monthly' | 'biweekly' | 'free'

export default function PlanScreen() {
  const router = useRouter()
  
  const { 
    cycleMode, 
    baseSalary, 
    cycleStartDate, 
    saveSettings, 
    availableDbs, 
    currentDb, 
    switchDatabase, 
    refreshDatabaseList, 
    purgeFullDatabase,
    renameDatabase,
    createNewProfile
  } = useSettingsStore()

  const { refreshKey } = useSheetStore() // Para escuchar cambios en transacciones desde el home

  const [draftMode, setDraftMode] = useState<PlanType>('monthly')
  const [draftSalary, setDraftSalary] = useState('')
  // Estado para el renombrado de base de dato
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [newCreateProfileName, setNewCreateProfileName] = useState('')

  useEffect(() => {
    if (cycleMode) setDraftMode(cycleMode)
    setDraftSalary(baseSalary.toString())
  }, [cycleMode, baseSalary, currentDb])

  useEffect(() => {
    refreshDatabaseList()
  }, [refreshKey])

  const getNextCutDate = () => {
    if (!cycleMode || cycleMode === 'free' || !cycleStartDate) return 'No aplica'
    
    const start = new Date(cycleStartDate)
    const nextDate = new Date(start)
    
    if (cycleMode === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1)
    if (cycleMode === 'biweekly') nextDate.setDate(nextDate.getDate() + 15)
    
    return nextDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const handleSave = async () => {
    const finalSalary = draftMode === 'free' ? 0 : Number(draftSalary)
    
    // Si el modo en la interfaz es diferente al modo guardado actual, advertimos del corte obligatorio
    if (draftMode !== cycleMode && cycleMode !== null) {
      Alert.alert(
        "Corte de Ciclo Forzado",
        "Estás cambiando la modalidad de tu plan actual. Esto cerrará el ciclo vigente y creará un corte histórico inmutable en este perfil. ¿Deseas continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sí, Guardar y Cortar",
            style: "default",
            onPress: async () => {
              const startDate = new Date().toISOString()
              await saveSettings(draftMode, finalSalary, startDate)
              // AUTO-SWIPE: Para redirigir a la pestaña de Inicio
              router.navigate("/")
            }
          }
        ]
      )
    } else {
      let startDate = cycleStartDate || new Date().toISOString()
      await saveSettings(draftMode, finalSalary, startDate)
      Alert.alert("¡Plan Actualizado!", "Tu configuración financiera ha sido guardada con éxito.")
      // AUTO-SWIPE OBLIGATORIO: También cuando guarda cambios de sueldo normales
      router.navigate("/")
    }
  }

  const handlePurge = () => {
    Alert.alert(
      "Borrado Absoluto",
      "¿Estás completamente seguro de eliminar esta base de datos? Se borrarán permanentemente todos los ciclos y transacciones de este perfil de forma irreversible.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, Eliminar", 
          style: "destructive",
          onPress: async () => {
            await purgeFullDatabase()
            
            // Evaluar si el store quedó vacío para decidir el mensaje
            // Si el modo quedó nulo, significa que no quedaban bases de datos
            const { cycleMode } = useSettingsStore.getState()
            
            if (cycleMode) {
              Alert.alert("Perfil Eliminado", "La app ha cargado automáticamente tu siguiente perfil disponible.")
              // AUTO-SWIPE: PAra llevar al usuario al inicio para ver su perfil cargado
              router.navigate("/")
            } else {
              Alert.alert("Base de datos limpia", "Todos los perfiles han sido eliminados.")
            }
          }
        }
      ]
    )
  }

  const handleExport = async () => {
    try {
      await ExcelService.exportDatabaseToExcel()
    } catch (err) {
      Alert.alert("Error de Exportación", "No se pudo formatear la base de datos a Excel.")
    }
  }

  const handleImport = async () => {
    try {
      const importedName = await ExcelService.importDatabaseFromExcel()
      if (importedName) {
        await refreshDatabaseList()
        await switchDatabase(importedName)
        Alert.alert("Importación Exitosa", "Se ha cargado el nuevo perfil financiero desde tu archivo Excel.")
      }
    } catch (err) {
      Alert.alert("Error de Importación", "El archivo Excel seleccionado no contiene una estructura de GoCoink válida o está corrupto.")
      // restaurar la base de datos que estaba activa para no dejar la app en el aire
      await switchDatabase(currentDb)
    }
  }

  // renombrar base de datos
  const handleRenameProfile = async () => {
    if (!newProfileName.trim()) return
    try {
      await renameDatabase(newProfileName.trim())
      await refreshDatabaseList() // Forzar sincronización del select
      setIsRenameModalVisible(false)
      setNewProfileName('')
      Alert.alert("Éxito", "El perfil ha sido renombrado correctamente.")
    } catch (error) {
      Alert.alert("Error", "No se pudo renombrar el perfil. Intenta con otro nombre.")
    }
  }

  const handleCreateProfile = async () => {
    if (!newCreateProfileName.trim()) return
    try {
      await createNewProfile(newCreateProfileName.trim())
      await refreshDatabaseList() // Forzar actualización de la lista de perfiles
      setIsCreateModalVisible(false)
      setNewCreateProfileName('')

      // AUTO-SWIPE: Forzar la navegación a la pestaña de inicio limpia para activar el Onboarding controlado
      router.navigate("/")
    } catch (error) {
      Alert.alert("Error", "No se pudo crear el perfil. Intenta con otro nombre.")
    }
  }

  const handleSwitchDatabase = async (selectedDb: string) => {
    // Si el usuario selecciona la base de datos en la que ya está, no hacemos nada
    if (selectedDb === currentDb) return

    try {
      await switchDatabase(selectedDb)
      
      // Limpiamos el nombre para que se vea estético en la alerta
      const cleanName = selectedDb === 'gocoink_v1.db' 
        ? 'Balance Principal' 
        : selectedDb.replace('.db', '').replace('import_', '')

      Alert.alert(
        "Perfil Cargado", 
        `Has cambiado exitosamente al perfil: ${cleanName}`,
        [{ text: "Continuar", style: "default" }]
      )
    } catch (error) {
      Alert.alert("Error", "No se pudo cambiar de perfil en este momento.")
    }
  }

  const modeLabels = {
    monthly: 'Mensual',
    biweekly: 'Quincenal',
    free: 'Libre (Sin sueldo fijo)'
  }

  // Mapeo de listado de archivos de base de datos de la DB al formato de opciones del componente Select
  const dbOptions = availableDbs.map(db => ({
    value: db,
    label: db === 'gocoink_v1.db' ? 'Balance Principal (Defecto)' : `Perfil: ${db.replace('import_', '').replace('.db', '')}`,
    icon: 'server-outline'
  }))

  return (
    <KeyboardAvoidingView 
      // 'padding' para iOS y 'height' para Android para evitar el desfase con la barra de pestañas
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: COLORS.background }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 }}>
          Mi Plan
        </Text>

        {/* --- TARJETA DE RESUMEN ACTUAL --- */}
        <View style={{
          backgroundColor: COLORS.surface,
          padding: 20,
          borderRadius: 20,
          marginBottom: 30,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="wallet" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
            <Text style={{ color: COLORS.textMuted, fontSize: 16, fontWeight: '600', textTransform: 'uppercase' }}>
              Ciclo Actual: {cycleMode ? modeLabels[cycleMode] : 'No definido'}
            </Text>
          </View>
            
          <Text style={{ color: COLORS.text, fontSize: 36, fontWeight: 'bold', marginBottom: 8 }}>
            ${baseSalary.toLocaleString('es-CO')}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, padding: 10, borderRadius: 10 }}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
              Próximo corte: <Text style={{ color: COLORS.text, fontWeight: 'bold' }}>{getNextCutDate()}</Text>
            </Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 30 }} />

        {/* --- SECCIÓN DE EDICIÓN --- */}
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 }}>
          Modificar Configuración
        </Text>

        <View style={{ gap: 12, marginBottom: 24 }}>
          <PlanCard 
            title="Mensual" 
            desc="Sueldo fijo una vez al mes." 
            icon="calendar-outline" 
            active={draftMode === 'monthly'} 
            onPress={() => setDraftMode('monthly')} 
          />
          <PlanCard 
            title="Quincenal" 
            desc="Pago cada 15 días." 
            icon="calendar-number-outline" 
            active={draftMode === 'biweekly'} 
            onPress={() => setDraftMode('biweekly')} 
          />
          <PlanCard 
            title="Libre" 
            desc="Independiente, sin sueldo fijo." 
            icon="briefcase-outline" 
            active={draftMode === 'free'} 
            onPress={() => setDraftMode('free')} 
          />
        </View>

        {draftMode !== 'free' && (
          <View style={{ marginBottom: 20 }}>
            <Input 
              label="Nuevo Sueldo Base (COP)"
              keyboardType="numeric"
              value={draftSalary}
              onChangeText={setDraftSalary}
              placeholder="Ej: 3000000"
            />
          </View>
        )}

        <Button 
          label="Guardar Cambios" 
          variant="primary" 
          onPress={handleSave} 
          disabled={draftMode !== 'free' && !draftSalary} 
        />

        <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 35 }} />
        
        {/* CONTROL DE BASES DE DATOS BI-DIRECCIONAL */}
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 }}>
          Gestión de Base de Datos
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 20, lineHeight: 20 }}>
          Tus datos se guardan de forma 100% local en tu dispositivo y nada se envía a servidores. Administra tus perfiles o respalda en Excel.
        </Text>

        {/* SELECT DINÁMICO DE WORKSPACES/BASES DE DATOS */}
        <Select 
          label="Perfil Financiero Activo"
          options={dbOptions}
          selectedValue={currentDb}
          onSelect={(val) => handleSwitchDatabase(String(val))} 
          placeholder="Selecciona un archivo de datos"
        />
        <Button 
          label="Crear Nuevo Perfil"
          variant="outline"
          icon="add-circle-outline"
          iconPos="left"
          iconColor={COLORS.text}
          onPress={() => setIsCreateModalVisible(true)}
        />
        {/* CONTROLES DE LA BASE DE DATOS */}
        <View style={{ gap: 12, marginTop: 10 }}>
          <Button 
            label="Renombrar Perfil Actual"
            variant="outline"
            icon="pencil-outline"
            iconPos="left"
            iconColor={COLORS.text}
            onPress={() => {
              setNewProfileName(currentDb.replace('.db', '').replace('import_', ''))
              setIsRenameModalVisible(true)
            }}
          />
          
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>      
            <Button 
              variant="outline"
              icon="share-outline"
              iconColor={COLORS.text}
              label="Exportar"
              onPress={handleExport}
              style={{
                flex: 1
              }}
            />

            <Button 
              variant="outline"
              icon="download-outline"
              iconPos="left"
              iconColor={COLORS.text}
              label="Importar"
              onPress={handleImport}
              style={{
                flex: 1
              }}
            />
          </View>

          <Button 
            label="Borrar Perfil Actual"
            variant="danger"
            icon="trash-outline"
            onPress={handlePurge}
          />
        </View>
      </ScrollView>

      {/* MODAL PARA RENOMBRAR EL PERFIL */}
      <Modal visible={isRenameModalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <View style={{
            backgroundColor: COLORS.surface,
            padding: 24,
            borderRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 10
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 15, textAlign: 'center' }}>
              Renombrar Perfil
            </Text>
            
            <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 20, textAlign: 'center' }}>
              Escribe un nuevo nombre para identificar esta base de datos.
            </Text>

            <Input 
              label="Nombre del perfil"
              placeholder="Ej: Finanzas_Casa"
              value={newProfileName}
              onChangeText={setNewProfileName}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <View style={{ flex: 1 }}>
                <Button 
                  label="Cancelar" 
                  variant="outline" 
                  onPress={() => setIsRenameModalVisible(false)} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button 
                  label="Guardar" 
                  variant="primary" 
                  onPress={handleRenameProfile} 
                  disabled={!newProfileName.trim()}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={isCreateModalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}
        >
          <View style={{ backgroundColor: COLORS.surface, padding: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 15, textAlign: 'center' }}>
              Crear Nuevo Perfil
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 20, textAlign: 'center' }}>
              Inicia un nuevo balance financiero desde cero. Tus perfiles actuales seguirán intactos.
            </Text>
            <Input 
              label="Nombre del nuevo perfil"
              placeholder="Ej: Negocio_2026"
              value={newCreateProfileName}
              onChangeText={setNewCreateProfileName}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <View style={{ flex: 1 }}>
                <Button label="Cancelar" variant="outline" onPress={() => setIsCreateModalVisible(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Crear" variant="primary" onPress={handleCreateProfile} disabled={!newCreateProfileName.trim()} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  )
}

interface PlanCardProps {
  title: string
  desc: string
  icon: keyof typeof Ionicons.glyphMap
  active: boolean
  onPress: () => void
}

const PlanCard = ({ title, desc, icon, active, onPress }: PlanCardProps) => (
  <TouchableOpacity 
    activeOpacity={0.8} 
    onPress={onPress} 
    style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      padding: 16, 
      borderRadius: 16, 
      borderWidth: 2,
      borderColor: active ? COLORS.primary : COLORS.border, 
      backgroundColor: active ? COLORS.surfaceLight : COLORS.surface 
    }}
  >
    <View style={{
      width: 48, 
      height: 48, 
      borderRadius: 12, 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginRight: 16,
      backgroundColor: active ? COLORS.primary : COLORS.background 
    }}>
      <Ionicons name={icon} size={24} color={active ? COLORS.text : COLORS.textMuted} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: COLORS.textMuted }}>
        {desc}
      </Text>
    </View>
    <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={24} color={active ? COLORS.primary : COLORS.border} />
  </TouchableOpacity>
)
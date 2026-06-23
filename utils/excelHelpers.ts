import { cacheDirectory, EncodingType, writeAsStringAsync, readAsStringAsync } from 'expo-file-system/legacy'
import { isAvailableAsync, shareAsync } from 'expo-sharing'
import { getDocumentAsync } from 'expo-document-picker'
import { DatabaseService } from '@/services/database'
import { RawCategory, RawCycle, RawPaymentMethod, RawTransaction } from '@/types'

// Transforma la data en formato XML compatible con múltiples pestañas en Excel
const generateExcelXml = (
  profileName: string,
  transactions: RawTransaction[], 
  cycles: RawCycle[], 
  categories: RawCategory[], 
  methods: RawPaymentMethod[]
) => {
  
  // T es el tipo de dato, y keys solo puede ser un array de propiedades válidas de T
  const createSheet = <T extends object>(
    name: string, 
    headers: string[], 
    data: T[], 
    keys: (keyof T)[]
  ) => {
    let xml = `  <Worksheet ss:Name="${name}">\n    <Table>\n      <Row>\n`
    headers.forEach(h => { xml += `        <Cell><Data ss:Type="String">${h}</Data></Cell>\n` })
    xml += '      </Row>\n'
    
    data.forEach(row => {
      xml += '      <Row>\n'
      
      // Si estamos en la pestaña de Transacciones, añadimos el dato del perfil en la primera celda
      if (name === 'Transacciones') {
        xml += `        <Cell><Data ss:Type="String">${profileName}</Data></Cell>\n`
      }

      keys.forEach(k => {
        const val = (row as any)[k] === null || (row as any)[k] === undefined ? '' : (row as any)[k]
        const type = typeof val === 'number' ? 'Number' : 'String'
        xml += `        <Cell><Data ss:Type="${type}">${val}</Data></Cell>\n`
      })
      xml += '      </Row>\n'
    })
    xml += '    </Table>\n  </Worksheet>\n'
    return xml
  }

  let fileXml = `<?xml version="1.0" encoding="utf-8"?>\n<?mso-application progid="Excel.Sheet"?>\n`
  fileXml += `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">\n`
  
  // La columna "Perfil" en la cabecera de las transacciones
  fileXml += createSheet<RawTransaction>('Transacciones', ['Perfil', 'ID', 'Monto', 'Tipo', 'Descripción', 'Fecha', 'ID Categoría', 'ID Método'], transactions, ['id', 'amount', 'type', 'description', 'date', 'category_id', 'payment_method_id'])
  fileXml += createSheet<RawCycle>('Ciclos', ['ID', 'Modo', 'Sueldo Base', 'Inicio', 'Fin'], cycles, ['id', 'cycle_mode', 'base_salary', 'start_date', 'end_date'])
  fileXml += createSheet<RawCategory>('Categorias', ['ID', 'Nombre', 'Icono', 'Personalizado'], categories, ['id', 'name', 'icon', 'is_custom'])
  fileXml += createSheet<RawPaymentMethod>('Metodos Pago', ['ID', 'Nombre', 'Icono', 'Personalizado'], methods, ['id', 'name', 'icon', 'is_custom'])
  
  fileXml += '</Workbook>'
  return fileXml
}

export const ExcelService = {
  async exportDatabaseToExcel() {
    try {
      const tx = await DatabaseService.getRawTableData<RawTransaction>('transactions')
      const cy = await DatabaseService.getRawTableData<RawCycle>('cycles')
      const cat = await DatabaseService.getRawTableData<RawCategory>('categories')
      const meth = await DatabaseService.getRawTableData<RawPaymentMethod>('payment_methods')

      const currentDb = DatabaseService.getCurrentDbName()
      const cleanProfileName = currentDb === 'gocoink_v1.db' ? 'Balance Principal' : currentDb.replace('.db', '').replace('import_', '')

      // Ordenar transacciones por fecha de registro de forma ascendente (antiguas primero)
      const sortedTx = tx.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const excelContent = generateExcelXml(cleanProfileName, sortedTx, cy, cat, meth)
      const filename = `${cacheDirectory}${currentDb.replace('.db', '')}_reporte.xls`

      await writeAsStringAsync(filename, excelContent, { encoding: EncodingType.UTF8 })

      if (await isAvailableAsync()) {
        await shareAsync(filename, { mimeType: 'application/vnd.ms-excel', dialogTitle: 'Exportar mi balance financiero' })
      }
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      throw error
    }
  },

  async importDatabaseFromExcel(): Promise<string | null> {
    try {
      const result = await getDocumentAsync({
        type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true
      })

      if (result.canceled || !result.assets || result.assets.length === 0) return null

      const selectedFile = result.assets[0]
      const rawXml = await readAsStringAsync(selectedFile.uri, { encoding: EncodingType.UTF8 })

      if (!rawXml.includes('ss:Name="Transacciones"') || !rawXml.includes('ss:Name="Ciclos"')) {
        throw new Error('El archivo no tiene el formato compatible de GoCoink')
      }

      // Tomar el nombre del archivo importado
      const originalName = selectedFile.name.replace(/\.[^/.]+$/, '')
      const safeName = originalName.replace(/[^a-zA-Z0-9_-]/g, '_')
      const newDbName = `${safeName}.db`
      
      DatabaseService.setDatabaseName(newDbName)
      const db = await DatabaseService.initialize()

      const parseSheetRows = (sheetName: string): string[][] => {
        const sheetMatch = rawXml.match(new RegExp(`<Worksheet ss:Name="${sheetName}">([\\s\\S]*?)</Worksheet>`))
        if (!sheetMatch) return []
        const rowMatches = sheetMatch[1].match(/<Row>([\s\S]*?)<\/Row>/g) || []
        return rowMatches.slice(1).map(row => {
          const cells = row.match(/<Data ss:Type=".*?">([\s\S]*?)<\/Data>/g) || []
          return cells.map(c => c.replace(/<Data ss:Type=".*?">/, '').replace('</Data>', ''))
        })
      }

      // Restaurar Categorías
      const categoriesRows = parseSheetRows('Categorias')
      for (const row of categoriesRows) {
        if (row.length >= 3) {
          await db.runAsync('INSERT OR IGNORE INTO categories (id, name, icon, is_custom) VALUES (?, ?, ?, ?)', [Number(row[0]), row[1], row[2], Number(row[3] || 0)])
        }
      }

      // Restaurar Métodos de Pago
      const methodsRows = parseSheetRows('Metodos Pago')
      for (const row of methodsRows) {
        if (row.length >= 3) {
          await db.runAsync('INSERT OR IGNORE INTO payment_methods (id, name, icon, is_custom) VALUES (?, ?, ?, ?)', [Number(row[0]), row[1], row[2], Number(row[3] || 0)])
        }
      }

      // Restaurar Ciclos Históricos
      const cyclesRows = parseSheetRows('Ciclos')
      let lastMode = 'free'
      let lastSalary = 0
      let lastStart = new Date().toISOString()
      
      for (const row of cyclesRows) {
        if (row.length >= 5) {
          await db.runAsync('INSERT INTO cycles (id, cycle_mode, base_salary, start_date, end_date) VALUES (?, ?, ?, ?, ?)', [Number(row[0]), row[1], Number(row[2]), row[3], row[4]])
          lastMode = row[1]
          lastSalary = Number(row[2])
          lastStart = row[3]
        }
      }

      // Restaurar Transacciones
      const txRows = parseSheetRows('Transacciones')
      for (const row of txRows) {
        if (row.length >= 8) {
          // El índice 0 es el nombre de la columna del Perfil, los datos reales de la transacción se corren 1 espacio
          await db.runAsync('INSERT INTO transactions (id, amount, type, description, date, category_id, payment_method_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [Number(row[1]), Number(row[2]), row[3], row[4], row[5], Number(row[6]), Number(row[7])])
        }
      }

      if (cyclesRows.length > 0) {
        await db.runAsync('UPDATE user_settings SET cycle_mode = ?, base_salary = ?, cycle_start_date = ? WHERE id = 1', [lastMode, lastSalary, lastStart])
      }

      return newDbName
    } catch (error) {
      console.error('Error procesando archivo de importación:', error)
      throw error
    }
  }
}
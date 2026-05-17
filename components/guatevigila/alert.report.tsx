import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica', color: '#111' },
  title: { fontSize: 22, marginBottom: 12, fontFamily: 'Helvetica-Bold' },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 14, marginBottom: 8, fontFamily: 'Helvetica-Bold', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2 },
  row: { marginBottom: 4 },
  danger: { color: '#b91c1c', fontFamily: 'Helvetica-Bold' },
  table: { marginTop: 8, borderWidth: 1, borderColor: '#ddd' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableHeader: { backgroundColor: '#f3f4f6' },
  cell: { flex: 1, padding: 6, fontSize: 10 },
  aiText: { lineHeight: 1.5, fontSize: 10.5, color: '#27272a' },
  
  // ESTILOS PARA LA GRÁFICA DE BARRAS NATIVA
  chartContainer: { marginTop: 8, padding: 8, backgroundColor: '#fbfbfb', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 4 },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  chartLabel: { width: 45, fontSize: 10, fontFamily: 'Helvetica-Bold' },
  chartBarWrapper: { flex: 1, backgroundColor: '#e4e4e7', height: 14, marginRight: 10, borderRadius: 2, overflow: 'hidden' },
  chartBar: { backgroundColor: '#18181b', height: '100%' },
  chartValue: { width: 90, fontSize: 9, textAlign: 'right', color: '#4b5563' },

  footer: { marginTop: 'auto', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  footerText: { fontSize: 9, color: '#666' }
})

export type AlertReportData = {
  id: string
  entityName: string
  riskLevel: string
  riskScore: number
  totalAmount: number
  contracts: number
  supplier: { name: string; nit: string }
  signals: { title: string; description: string; severity: string }[]
  aiAnalysis: string
  yearlyHistory: { year: number; amount: number }[]
}

type AlertReportProps = { alert: AlertReportData }

export function AlertReport({ alert }: AlertReportProps) {
  // Calculamos el monto más alto para definir el 100% de la barra visual
  const maxAmount = alert.yearlyHistory.length > 0 
    ? Math.max(...alert.yearlyHistory.map(h => h.amount)) 
    : 1;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Reporte de Alerta Institucional</Text>

        {/* ENTIDAD INVESTIGADA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entidad e Implicados</Text>
          <Text style={styles.row}>Comprador: {alert.entityName}</Text>
          <Text style={styles.row}>Contratista: {alert.supplier.name} (NIT: {alert.supplier.nit})</Text>
          <Text style={[styles.row, styles.danger]}>Índice de Riesgo: {alert.riskLevel} ({alert.riskScore}/100)</Text>
          <Text style={styles.row}>Contratos bajo análisis: {alert.contracts}</Text>
          <Text style={styles.row}>Monto total adjudicado: Q {alert.totalAmount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</Text>
        </View>

        {/* NUEVA SECCIÓN: GRÁFICA DE BARRAS DE HISTORIAL ANUAL */}
        {alert.yearlyHistory && alert.yearlyHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolución Financiera Histórica (Adjudicaciones por Año)</Text>
            <View style={styles.chartContainer}>
              {alert.yearlyHistory.map((item) => {
                // Porcentaje matemático de ancho para la barra
                const barWidth = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                return (
                  <View key={item.year} style={styles.chartRow}>
                    <Text style={styles.chartLabel}>{item.year}</Text>
                    <View style={styles.chartBarWrapper}>
                      <View style={[styles.chartBar, { width: `${barWidth}%` }]} />
                    </View>
                    <Text style={styles.chartValue}>
                      Q {item.amount.toLocaleString('es-GT', { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SEÑALES ACTIVAS */}
        {alert.signals && alert.signals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Matriz de Señales de Alerta</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.cell, { flex: 0.4, fontFamily: 'Helvetica-Bold' }]}>Indicador</Text>
                <Text style={[styles.cell, { flex: 0.6, fontFamily: 'Helvetica-Bold' }]}>Hallazgo Estadístico / Descripción</Text>
              </View>
              {alert.signals.map((signal, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.cell, { flex: 0.4, fontFamily: 'Helvetica-Bold' }]}>{signal.title}</Text>
                  <Text style={[styles.cell, { flex: 0.6 }]}>{signal.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ANÁLISIS DE IA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dictamen y Resumen de Riesgos (IA Analytics)</Text>
          <Text style={styles.aiText}>{alert.aiAnalysis}</Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>GuateVigila - Sistema de Monitoreo de Compras Públicas</Text>
          <Text style={styles.footerText}>Generado el: {new Date().toLocaleString('es-GT')}</Text>
        </View>
      </Page>
    </Document>
  )
}
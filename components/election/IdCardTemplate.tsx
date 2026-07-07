import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    backgroundColor: '#ffffff'
  },
  card: {
    width: '45%',
    height: 180,
    border: '1pt solid #ccc',
    borderRadius: 8,
    margin: '2.5%',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#1a365d' // AGS typical blueish color
  },
  studentName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  details: {
    fontSize: 10,
    color: '#4a5568',
    marginTop: 2,
  },
  codeBox: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#f7fafc',
    border: '1pt dashed #cbd5e0',
    width: '100%',
    textAlign: 'center',
  },
  codeLabel: {
    fontSize: 8,
    color: '#718096',
    marginBottom: 2,
  },
  code: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#e53e3e', // Red to stand out
  },
  footer: {
    fontSize: 6,
    color: '#a0aec0',
    marginTop: 5,
    textAlign: 'center',
  }
});

interface VoterCard {
  studentName: string;
  className: string;
  secretCode: string;
}

export const IdCardTemplate = ({ cards, electionTitle }: { cards: VoterCard[], electionTitle: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {cards.map((card, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.header}>AGS Student Council Election</Text>
          <Text style={{ fontSize: 10, color: '#718096', marginBottom: 5 }}>{electionTitle}</Text>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.studentName}>{card.studentName}</Text>
            <Text style={styles.details}>Class: {card.className}</Text>
          </View>
          
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>YOUR SECRET VOTER CODE</Text>
            <Text style={styles.code}>{card.secretCode}</Text>
          </View>
          
          <Text style={styles.footer}>Keep this code secret. Do not share it.</Text>
        </View>
      ))}
    </Page>
  </Document>
);

import { Card, Text, Avatar, Chip } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { Machine } from '../../types/machine';

export function MachineCard({ machine }: { machine: Machine }) {
  return (
    <Card style={styles.card} mode="outlined">
      <Card.Title
        title={machine.name}
        subtitle={`Provedor: ${machine.provider?.name || 'N/A'}`} // Usa o include do back
        left={(props) => <Avatar.Icon {...props} icon="washing-machine" />}
      />
      <Card.Content>
        <View style={styles.badgeRow}>
          <Chip icon="weight-kilogram">{machine.capacityKg}kg</Chip>
          <Text variant="titleMedium" style={styles.price}>R$ {machine.pricePerLoad}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { color: '#2e7d32', fontWeight: 'bold' }
});
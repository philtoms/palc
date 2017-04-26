import React, {PropTypes as P} from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'

const Results = ({results}) => (
  <ScrollView>
    {results.map(({type, value}, i) => <Text key={value + i} style={styles[type]}>{value}</Text>)}
  </ScrollView>
)

Results.propTypes = {
  results: P.array
}

const styles = StyleSheet.create({
  branch: {
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: '80%'
  },
  node: {
    fontSize: 16,
    minWidth: '70%'
  }
})

export default Results

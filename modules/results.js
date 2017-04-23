import React, {PropTypes as P} from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'

const Results = ({results}) => (
  <ScrollView>
    results.map(result => <Text style={styles.listRow}>{result}</Text>)
  </ScrollView>
)

Results.propTypes = {
  results: P.array
}

const styles = StyleSheet.create({
  listRow: {
    fontSize: 18,
    minWidth: '80%'
  }
})

export default Results

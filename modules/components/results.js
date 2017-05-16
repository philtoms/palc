import React, {PropTypes as P} from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'

import memo from '../memo'

const test = (p1, p2) => p1.results.length !== p2.results.length || p1.results.some((e, i) => e.value !== p2.results[i].value)

const Results = ({results, handleClick}) => (
  <ScrollView style={styles.container}>
    {results.map(({type, value}, i) => <TouchableOpacity
      key={value + i}
      onPress={() => handleClick(value)}
      >
      <Text
        style={styles[type]}
        ellipsizeMode="tail"
      >{value}</Text>
    </TouchableOpacity>)}
  </ScrollView>
)

Results.propTypes = {
  results: P.array,
  handleClick: P.func
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    padding: '5%'
  },
  branch: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  node: {
    fontSize: 16,
    paddingLeft: '10%'
  }
})

export default memo(test)(Results)

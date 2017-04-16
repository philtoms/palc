import React, {PropTypes as P} from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'

const borderWidth = Math.floor(Dimensions.get('window').width * 0.1)

export default class Layout extends React.Component {
  static propTypes = {
    children: P.node
  }

  render () {
    return (
      <View style={styles.container}>
        {this.props.children}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderColor: '#fff3da',
    borderWidth: borderWidth
  }
})

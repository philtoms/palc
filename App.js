import React from 'react'
import { ListView, StyleSheet, Text, TextInput, View } from 'react-native'

import generatePath, {alias} from './engine'
import foodGraph from './engine/foodGraph.json'
import aliasGraph from './engine/aliasGraph'

export default class App extends React.Component {
  state = {
    category: 'Kitchen',
    inputValue: '',
    dataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
  }

  componentWillUnmount () {
    GLOBAL.cancelAnimationFrame(this.animationId)
  }

  _handleTextChange = inputValue => {
    this.setState({
      inputValue
    }, () => {
      GLOBAL.cancelAnimationFrame(this.animationId)
      this._updateList(generatePath(foodGraph, inputValue.split(/\s+/)), [])
    })
  }

  _updateList = (it, list) => {
    this.animationId = GLOBAL.requestAnimationFrame(() => {
      const path = it.next()
      if (!path.done) {
        list.unshift(alias(aliasGraph, path.value))
        console.log(list)
        this.setState({dataSource: this.state.dataSource.cloneWithRows(list)})
        this._updateList(it, list)
      }
    })
  }

  render () {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>PALC</Text>
        <Text style={styles.paragraph}>for</Text>
        <Text style={styles.paragraph}>{this.state.category}</Text>
        <TextInput
          autoFocus
          value={this.state.inputValue}
          placeholder="Type a numer or a unit..."
          onChangeText={this._handleTextChange}
          style={styles.input}
        />
        <ListView
          dataSource={this.state.dataSource}
          renderRow={rowData => <Text>{rowData}</Text>}
        />
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
    borderWidth: 30,
    paddingTop: 20
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  paragraph: {
    fontSize: 18,
    textAlign: 'center',
    color: '#34495e'
  },
  input: {
    fontSize: 18,
    width: 200,
    height: 20,
    color: 'black'
  }
})

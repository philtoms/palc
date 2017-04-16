import React, {PropTypes as P} from 'react'
import { ListView, StyleSheet, Text, TextInput, View } from 'react-native'

import generateList from '../../engine'
import foodGraph from '../../engine/foodGraph.json'
import aliasGraph from '../../engine/aliasGraph'

const generate = generateList(foodGraph, aliasGraph)

export default class Main extends React.Component {
  static propTypes = {
    category: P.string
  }

  state = {
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
      this._updateList(generate(inputValue.split(/\s+/)), [])
    })
  }

  _updateList = (it, list) => {
    this.animationId = GLOBAL.requestAnimationFrame(() => {
      const path = it.next()
      if (!path.done) {
        list.unshift(path.value)
        this._updateList(it, list)
      }
      this.setState({dataSource: this.state.dataSource.cloneWithRows(Array.from(list))})
    })
  }

  render () {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>PALC</Text>
        <Text style={styles.paragraph}>for</Text>
        <Text style={styles.paragraph}>{this.props.category}</Text>
        <TextInput
          autoFocus
          value={this.state.inputValue}
          placeholder="Just type..."
          onChangeText={this._handleTextChange}
          style={styles.input}
        />
        <ListView
          dataSource={this.state.dataSource}
          renderRow={rowData => <Text style={styles.listRow}>{rowData}</Text>}
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
    marginTop: 20,
    fontSize: 18,
    width: '80%',
    height: 60,
    borderWidth: 1,
    padding: 10,
    color: 'black'
  },
  listRow: {
    fontSize: 18,
    minWidth: '80%'
  }
})

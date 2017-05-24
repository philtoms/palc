import React, {PropTypes as P} from 'react'
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native'

import Results from './results'

import generator from '../graph'
import foodGraph from '../graph/foodGraph.json'
import aliasGraph from '../graph/aliasGraph'

const generate = generator(foodGraph, aliasGraph)

export default class Main extends React.Component {
  static propTypes = {
    category: P.string
  }

  state = {
    topAnim: new Animated.Value(100),
    fadeAnim: new Animated.Value(1),
    inputValue: '',
    results: []
  }

  componentWillUnmount () {
    GLOBAL.cancelAnimationFrame(this.rafId)
  }

  shouldComponentUpdate (nextProps, nextState) {
    const {inputValue, topAnim, fadeAnim, hasResults = !!inputValue} = nextState
    if (hasResults !== this.hasResults && !this.animating) {
      this.hasResults = hasResults
      const topValue = hasResults ? 0 : 100
      const fadeValue = hasResults ? 0 : 1
      console.log(hasResults, this.animateId)
      this.animating = false
      clearTimeout(this.animateId)
      this.animateId = setTimeout(() => {
        this.animating = true
        Animated.parallel([
          Animated.timing(topAnim, { toValue: topValue }),
          Animated.timing(fadeAnim, { toValue: fadeValue })
        ]).start(res => {
          this.animating = false
        })
      }, hasResults ? 0 : 3000)
    }
    return true
  }

  _handleTextChange = inputValue => {
    this.setState({
      inputValue
    }, () => {
      GLOBAL.cancelAnimationFrame(this.rafId)
      this._updateList(generate(inputValue), [])
    })
  }

  _updateList = (it, results) => {
    this.rafId = GLOBAL.requestAnimationFrame(() => {
      const path = it.next()
      if (!path.done) {
        results = results.concat(path.value)
        this._updateList(it, results)
        return
      }
      clearTimeout(this.delayId)
      this.delayId = setTimeout(() => this.setState({delayed: !!this.state.inputValue}), 1000)
      this.setState({results, delayed: false})
    })
  }

  render () {
    const {results, inputValue, delayed, topAnim, fadeAnim, hasResults = !!results.length} = this.state
    const animStyle = {
      height: topAnim,
      opacity: fadeAnim
    }

    return (
      <View style={styles.container}>
        <Animated.View style={animStyle}>
          <Text style={styles.title}>PALC</Text>
          <Text style={styles.paragraph}>for</Text>
          <Text style={styles.paragraph}>{this.props.category}</Text>
        </Animated.View>
        <TextInput
          value={inputValue}
          placeholder="Start typing..."
          onChangeText={this._handleTextChange}
          style={styles.input}
          underlineColorAndroid="rgba(0,0,0,0)"
        />
        {hasResults
          ? <Results results={results} handleClick={this._handleTextChange}/>
          : delayed
            ? <Text>Nothing here :(</Text>
            : !inputValue && <View>
              <Text>a number for conversions,</Text>
              <Text>or a topic such as aga, cup, etc,</Text>
              <Text>or just type chicken...</Text>
            </View>
        }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#fff',
    shadowRadius: 10,
    shadowOpacity: 1.0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    width: '100%'
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
    marginBottom: 10,
    fontSize: 18,
    width: '100%',
    height: 60,
    borderWidth: 1,
    padding: 10,
    color: 'black',
    backgroundColor: 'white'
  }
})

import React, {PropTypes as P} from 'react'
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native'

import Title from './svg/Title'
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
          <Title style={styles.title} width={150} height={50}/>
          <Text style={styles.paragraph2}>{this.props.category}</Text>
        </Animated.View>
        <TextInput
          value={inputValue}
          placeholder="Search PALc"
          onChangeText={this._handleTextChange}
          style={styles.input}
          underlineColorAndroid="rgba(0,0,0,0)"
        />
        {hasResults
          ? <Results results={results} handleClick={this._handleTextChange}/>
          : delayed
            ? <Text>Nothing here :(</Text>
            : !inputValue && <View>
              <Text style={styles.intro}>Solve your cooking measurement, temperature and timing queries
              with one simple search.</Text>
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
  paragraph1: {
    fontSize: 18,
    textAlign: 'center',
    color: '#34495e'
  },
  paragraph2: {
    fontSize: 20,
    padding: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0ca50b'
  },
  input: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 18,
    width: '100%',
    height: 60,
    borderWidth: 1,
    padding: 10,
    color: 'black',
    backgroundColor: 'white'
  },
  intro: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#777',
    padding: 10,
    textAlign: 'center',
    lineHeight: 20
  }
})

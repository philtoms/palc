import React from 'react'
import { Image, StyleSheet } from 'react-native'
import Layout from './modules/components/layout'
import Main from './modules/components/main'
import backgroundImg from './assets/palc1.png'

export default class App extends React.Component {
  state = {
    category: 'Kitchen'
  }

  render () {
    return (
      <Image
        style={styles.background}
        source={backgroundImg}
      >
        <Layout>
          <Main {...this.state}/>
        </Layout>
      </Image>
    )
  }
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover'
  }
})

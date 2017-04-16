import React from 'react'
import Layout from './modules/layout'
import Main from './modules/main'

export default class App extends React.Component {
  state = {
    category: 'Kitchen'
  }

  render () {
    return (
      <Layout>
        <Main {...this.state}/>
      </Layout>
    )
  }
}

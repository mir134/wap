import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import Shell from '../../../../shell'
import TopicList from '../../../../components/topic-list'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { loadPeopleById } from '../../../../actions/people'
import { loadTopics } from '../../../../actions/topic'

export class PeopleTopics extends React.Component {

  // 服务器预加载内容
  static loadData({ store, props }, callback) {

    const { id } = props.params
    const { dispatch } = store

    dispatch(loadPeopleById({
      id,
      callback:(people)=>{
        if (!people) {
          callback(404)
          return;
        }
        dispatch(loadTopics({name:id, filters:{ people_id: id, child: 1 }, callback:()=>{
          callback()
        }}))
      }
    }))

  }

  constructor(props) {
    super(props)
  }

  render() {

    const { people } = this.props

    return (
      <div>
        <TopicList name={people._id} filters={{ people_id: people._id, child: 1 }} />
      </div>
    )

  }

}

export default Shell(PeopleTopics)

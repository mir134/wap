import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import { browserHistory } from 'react-router'
import { reactLocalStorage } from 'reactjs-localstorage'

import Device from '../../common/device'
import styles from './style.scss'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { loadPostsById } from '../../actions/posts'
import { getPostsById } from '../../reducers/posts'
import { addComment } from '../../actions/comment'

import Shell from '../../shell'
import Meta from '../../components/meta'
import Subnav from '../../components/subnav'
import Editor from '../../components/editor'
import CommentEditor from '../../components/comment-editor'

class WriteComment extends React.Component {

  static loadData(option, callback) {

    const { posts_id, parent_id, reply_id } = option.props.location.query

    option.store.dispatch(loadPostsById({
      id: posts_id,
      callback: (posts)=>{
        if (!posts) {
          callback('not found')
        } else {
          callback()
        }
      }
    }))
  }

  constructor(props) {
    super(props)
    this.state = {
      contentJSON: '',
      contentHTML: '',
      content: <div></div>
    }
    this.submitQuestion = this.submitQuestion.bind(this)
    this.syncContent = this._syncContent.bind(this)
  }

  componentWillMount() {

    let { posts_id } = this.props.location.query
    let { loadPostsById } = this.props

    const [ posts ] = this.props.posts

    if (!posts) {
      loadPostsById({
        id: posts_id,
        callback: function(posts){
          if (!posts) {
            browserHistory.push('/')
          }
        }
      })
    }

  }

  componentDidMount() {

    const { posts_id } = this.props.location.query
    const [ posts ] = this.props.posts

    const commentId = reactLocalStorage.get('comment-id') || ''
    let commentContent = reactLocalStorage.get('comment-content') || ''

    if (posts_id != commentId) {
      commentContent = ''
    }

    this.setState({
      content: <div><Editor syncContent={this.syncContent} content={commentContent} /></div>
    });

  }

  submitQuestion() {

    const self = this
    let { addComment } = this.props

    const { posts_id, parent_id = '', reply_id = '' } = this.props.location.query

    const { contentJSON, contentHTML } = this.state

    if (!contentJSON) {
      alert('不能提交空的答案')
      return
    }

    addComment({
      posts_id,
      parent_id,
      reply_id,
      contentJSON: contentJSON,
      contentHTML: contentHTML,
      deviceId: Device.getCurrentDeviceId(),
      callback: function(result) {

        if (result && result.success) {

          setTimeout(()=>{
            reactLocalStorage.set('comment-id', '')
            reactLocalStorage.set('comment-content', '')
          }, 200)

          browserHistory.push('/posts/'+posts_id+'?subnav_back=/')
          return
        }

        if (result && !result.success) {
          alert(result.error)
        }

      }
    })

  }

  _syncContent(contentJSON, contentHTML) {
    this.state.contentJSON = contentJSON
    this.state.contentHTML = contentHTML
    
    let { posts_id } = this.props.location.query

    reactLocalStorage.set('comment-id', posts_id)
    reactLocalStorage.set('comment-content', contentJSON)
  }

  render() {

    const [ posts ] = this.props.posts
    const { content } = this.state
    const { posts_id = '', parent_id = '', reply_id = '' } = this.props.location.query


    if (!posts) {
      return (<div></div>)
    }

    return (<div>
      <Meta meta={{title: '写回复'}} />
      <Subnav left="取消" middle="写回复" />
      <CommentEditor
        posts_id={posts_id}
        parent_id={parent_id}
        reply_id={reply_id}
        successCallback={()=>{
          browserHistory.push('/posts/'+posts_id+'?subnav_back=/')
        }}
        />
    </div>)
  }

}

WriteComment.propTypes = {
  posts: PropTypes.array.isRequired,
  addComment: PropTypes.func.isRequired,
}

function mapStateToProps(state, props) {
  let { posts_id } = props.location.query
  return {
    posts: getPostsById(state, posts_id)
  }
}

function mapDispatchToProps(dispatch, props) {
  return {
    loadPostsById: bindActionCreators(loadPostsById, dispatch),
    addComment: bindActionCreators(addComment, dispatch)
  }
}


WriteComment = connect(mapStateToProps, mapDispatchToProps)(WriteComment)

export default Shell(WriteComment)

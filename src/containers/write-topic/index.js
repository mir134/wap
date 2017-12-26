import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'

import avatarPicker from '../../common/avatar-picker'
import styles from './style.scss'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { loadTopics, addTopic } from '../../actions/topic'
import { getTopicListByName } from '../../reducers/topic'

import Shell from '../../shell'
import Meta from '../../components/meta'
import Nav from '../../components/nav'
import Subnav from '../../components/subnav'
import QiniuUploadImage from '../../components/qiniu-upload-image'

class WriteTopic extends Component {

  constructor(props) {
    super(props)
    this.state = {
      updateButton: <div></div>,
      image: ''
    }
    this.submit = this.submit.bind(this)
    this.upload = this.upload.bind(this)
  }

  componentWillMount() {

    const { nodes, loadTopics } = this.props

    if (nodes.data) {
      return
    }

    loadTopics({ name: 'write-node', filters: { child: -1 } })

  }

  componentDidMount() {
    this.setState({
      updateButton: <QiniuUploadImage upload={this.upload} multiple={false} name={'上传社群封面'} />
    })
  }

  upload(url) {

    const self = this

    avatarPicker({
      img: url,
      selectAreaScale: 0.9,
      previews: [],
      imgLoadComplete: function() {},
      done: function(p){
        self.setState({
          image: url + "?imageMogr2/crop/!"+parseInt(p.width)+"x"+parseInt(p.height)+"a"+parseInt(p.x)+"a"+parseInt(p.y)+"/thumbnail/!200"
        })
      }
    })

  }

  submit() {

    const self = this
    const { addTopic } = this.props
    const { name, brief, description, node } = this.refs
    const { image } = this.state

    // if (!image) return alert('请上传社群封面')
    if (!name.value) return name.focus()
    if (!brief.value) return brief.focus()
    if (!description.value) return description.focus()
    if (node.value == -1) return alert('请选择分类')

    addTopic({
      name: name.value,
      brief: brief.value,
      avatar: image,
      description: description.value,
      parentId: node.value,
      callback: (result) => {
        if (result && result.success) {
          alert('添加成功')
          self.context.router.goBack()
        } else {
          alert(result.error || '添加失败')
        }
      }
    })

  }

  render() {

    const { updateButton, image } = this.state
    const { me, nodes } = this.props

    if (!nodes.data) {
      return (<div></div>)
    }

    // <Subnav middle="创建社群" />
    return (
      <div>
        <Meta meta={{title:'创建社群'}} />
        <Nav />
        <div className="container">

          <div className="list">
            <br />
            <div className={styles.avatar}>
              {updateButton}
              {image ? <img src={image} /> : null}
            </div>
            <br />
          </div>

          <div className="list">
            <input type="text" ref="name" placeholder="名称"></input>
            <input type="text" ref="brief" placeholder="简介"></input>
            <textarea ref="description" placeholder="详细描述"></textarea>
          </div>

          <div className="list">
            <select className="select" ref="node">
              <option value="-1">请选择分类</option>
              <option value="">无</option>
              {nodes.data.map(item=>{
                return (<option key={item._id} value={item._id}>{item.name}</option>)
              })}
            </select>
          </div>

          <div className="list">
            <a className="center" href="javascript:void(0);" onClick={this.submit}>提交</a>
          </div>

        </div>
      </div>
    )

  }

}

WriteTopic.contextTypes = {
  router: PropTypes.object.isRequired
}

WriteTopic.propTypes = {
  nodes: PropTypes.object.isRequired,
  loadTopics: PropTypes.func.isRequired,
  addTopic: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  return {
    nodes: getTopicListByName(state, 'write-node')
  }
}

function mapDispatchToProps(dispatch) {
  return {
    addTopic: bindActionCreators(addTopic, dispatch),
    loadTopics: bindActionCreators(loadTopics, dispatch)
  }
}

WriteTopic = connect(mapStateToProps, mapDispatchToProps)(WriteTopic)

export default Shell(WriteTopic)

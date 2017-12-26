import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { getProfile } from '../../reducers/user'

import { resetBrief, loadUserInfo } from '../../actions/user'

import Meta from '../../components/meta'
import Subnav from '../../components/subnav'
import Shell from '../../shell'

export class ResetBrief extends Component {

  constructor(props) {
    super(props)
    this.submitResetBrief = this.submitResetBrief.bind(this)
  }

  componentDidMount() {
    const { brief } = this.refs
    setTimeout(()=>{

      if (typeof brief.selectionStart == "number") {
        brief.selectionStart = brief.selectionEnd = brief.value.length;
      } else if (typeof brief.createTextRange != "undefined") {
        brief.focus();
        var range = brief.createTextRange();
        range.collapse(false);
        range.select();
      }

    })
  }

  submitResetBrief() {

    const self = this
    const { resetBrief, loadUserInfo } = this.props
    const { brief } = this.refs

    resetBrief({
      brief: brief.value,
      callback: function(res){
        if (!res.success) {
          alert(res.error)
        } else {
          loadUserInfo({})
          alert('修改成功')
          self.context.router.goBack()
        }
      }
    })

  }

  render() {

    const { me } = this.props

    return (
      <div>
        <Meta meta={{title:'个性签名'}} />
        <Subnav middle="个性签名" />
        <div className="container">
          <div className="list">
            <textarea defaultValue={me.brief} ref="brief"></textarea>
          </div>
          <div className="list">
            <a className="center" href="javascript:void(0);" onClick={this.submitResetBrief}>保存</a>
          </div>
        </div>
      </div>
    )

  }

}

ResetBrief.contextTypes = {
  router: PropTypes.object.isRequired
}

ResetBrief.propTypes = {
  me: PropTypes.object.isRequired,
  resetBrief: PropTypes.func.isRequired,
  loadUserInfo: PropTypes.func.isRequired
}

function mapStateToProps(state) {
  return {
    me: getProfile(state)
  }
}

function mapDispatchToProps(dispatch) {
  return {
    resetBrief: bindActionCreators(resetBrief, dispatch),
    loadUserInfo: bindActionCreators(loadUserInfo, dispatch)
  }
}

ResetBrief = connect(
  mapStateToProps,
  mapDispatchToProps
)(ResetBrief)

export default Shell(ResetBrief)

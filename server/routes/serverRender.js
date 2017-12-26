import express from 'express'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'
import { RouterContext, match } from 'react-router'
import createMemoryHistory from 'history/lib/createMemoryHistory'
import axios from 'axios'
import DocumentMeta from 'react-document-meta'


import configureStore from '../../src/store/configureStore'
import { getInitialState } from '../../src/reducers'
import crateRoutes from '../../src/routes'
import { loadUserInfo } from '../../src/actions/user'
import { exchangeNewToken } from '../../src/actions/token'

const serverRender = express.Router()

import config from '../../config'

// 在服务端加载数据
function loadData(props, store, userinfo, callback) {

  // 壳组件，每个 container 组件，都是套在壳组件里面
  let shellComponent = props.components[props.components.length - 1].WrappedComponent
  // 容器组件，组装 components 里面各种小组件
  let containerComponent = shellComponent.defaultProps.component

  // 如果有服务器预加载，那么执行回调
  if (!containerComponent.loadData) {
    callback()
    return
  }

  if (process.env.NODE_ENV == 'development') {
    console.log('开始获取数据')
  }

  containerComponent.loadData({ store, props }, (notFound, desc)=>{

    if (process.env.NODE_ENV == 'development') {
      console.log('获取成功')
    }

    callback(notFound, desc)
  })

}



serverRender.route('*').get((req, res) => {

  let accessToken = req.cookies[config.auth_cookie_name] || null,
        expires = req.cookies['expires'] || 0,
        history = createMemoryHistory(),
        store = configureStore(getInitialState())

  const start = (result)=> {

    let userinfo = result && result.success ? result.data : null

    if (userinfo) {
      // 如果获取到用户信息，那么说明token是有效的，因此将用户信息添加到store
      // res.cookie(config.auth_cookie_name, accessToken, { path: '/', httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30 })
      store.dispatch({ type: 'ADD_ACCESS_TOKEN', access_token: accessToken, expires: expires })
    } else if (result && !result.success) {
      // 如果无效，则删除token
      res.clearCookie(config.auth_cookie_name)
      res.clearCookie('expires')

      // 被拒绝的请求
      if (result._error && result._error == 10007) {
        res.redirect('/notice?notice=block_account')
        return
      }

    }

    let routes = crateRoutes(history, userinfo ? userinfo : null)

    if (process.env.NODE_ENV == 'development') console.log('请求地址:' + req.originalUrl)

    match({ routes, location: req.originalUrl }, (error, redirectLocation, renderProps) => {

      if (redirectLocation) {
        res.redirect(302, redirectLocation.pathname + redirectLocation.search);

      } else if (error) {
        res.send(500, error.message);

      } else if (!renderProps) {
        res.status(404);
        res.redirect('/not-found');

      } else if (renderProps) {

        loadData(renderProps, store, userinfo, (httpStatusCode, desc) => {

          if (httpStatusCode && httpStatusCode == 403) {
            res.status(403);
            res.redirect('/notice?notice='+desc)
            return

          } else if (httpStatusCode) {
            res.status(404);
            res.redirect('/not-found');
            return
          }

          let reduxState = JSON.stringify(store.getState()).replace(/</g, '\\x3c');
          const html = renderToString(<Provider store={store}>{<RouterContext {...renderProps} />}</Provider>)

          // 获取页面的meta，嵌套到模版中
          let meta = DocumentMeta.renderAsHTML()

          res.render('../dist/index.ejs', { meta, html, reduxState });

          if (process.env.NODE_ENV == 'development') console.log('页面渲染完成')

        })

      }
    })

  }

  /*
  const handleExchangeNewToken = () => {
    // 如果token失效，去换取新的token
    store.dispatch(exchangeNewToken({
      accessToken,
      callback: (result) => {

        if (result && !result.success) return start(result)

        accessToken = result.data.access_token

        expires = new Date().getTime() + 1000*60*24

        res.cookie('expires', expires, { path: '/', httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30 })
        res.cookie(config.auth_cookie_name, accessToken, { path: '/', httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30 })

        store.dispatch(loadUserInfo({
          accessToken: accessToken,
          callback: start
        }))

      }
    }))
  }
  */

  /*
  // 已经过了有效期
  if (expires && parseInt(expires) < new Date().getTime()
    // parseInt(expires) - new Date().getTime() < 1000 * 60 * 60 * 4
    ) {
    handleExchangeNewToken()
    return
  }
  */

  if (accessToken && accessToken != 'undefined') {
    store.dispatch(loadUserInfo({
      accessToken: accessToken,
      callback: start
      /*
      callback: (result)=>{
        if (result && !result.success) {
          handleExchangeNewToken()
        } else {
          start(result)
        }
      }
      */
    }))
  } else {
    start(false)
  }

})

export default serverRender;

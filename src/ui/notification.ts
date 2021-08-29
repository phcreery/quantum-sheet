import { ref, Ref, computed } from 'vue'
// import { notification } from 'ant-design-vue'
import { useNotification } from 'naive-ui'
const notification = useNotification()

function objToString(value: any) {
  if (typeof value === 'string') {
    return value
  } else {
    try {
      return JSON.stringify(value)
    } catch (e) {
      return value + ''
    }
  }
}

function notify(type: 'success' | 'error' | 'warning' | 'info', content: string, details: any) {
  let meta = objToString(details)
  const config = {
    content,
    meta,
  }
  console.log('n', notification, useNotification(), config, type)
  notification[type](config)
}

function log(content: string, details: any) {
  let meta = objToString(details)
  const config = {
    content,
    meta,
  }
  notification.info(config)
}

function warn(content: string, details: any) {
  let meta = objToString(details)
  const config = {
    content,
    meta,
  }
  notification.warning(config)
}

function error(content: string, details: any) {
  let meta = objToString(details)
  const config = {
    content,
    meta,
  }
  notification.error(config)
}

export { notify, log, warn, error }

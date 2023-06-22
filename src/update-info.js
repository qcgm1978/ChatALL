const { autoUpdater } = require('electron-updater');

// 检查更新
autoUpdater.checkForUpdatesAndNotify();

// 监听更新事件
autoUpdater.on('update-available', () => {
  // 在这里可以向用户展示升级提示和更新内容
  // 可以使用 Electron 的弹窗或通知机制进行展示
  console.log('has update')
});

autoUpdater.on('update-not-available', () => {
  // 在这里可以向用户展示无可用更新的消息
  console.log('no update')
});

autoUpdater.on('error', (error) => {
  // 在这里可以处理更新过程中的错误
});

autoUpdater.on('update-downloaded', () => {
  // 在这里可以提示用户下载的更新已经准备好安装
});
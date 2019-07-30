const {app, BrowserWindow, webContents, dialog} = require('electron')
const prompt = require('electron-prompt');
const Pusher = require('pusher-js')
var fs = require('fs');
var exec = require('child_process').exec;
var dotenv = require('dotenv');


dotenv.config();

const url = 'https://displayapp.site';


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

Pusher.logToConsole = true

var pusher = new Pusher('f9c2971a084563106442', {

  app_id: '547755',
  key:'f9c2971a084563106442',
  secret:'678714fed034a58a2dcb',
  cluster: 'eu',
  encrypted: true,
  authEndpoint: url + '/api/presence/auth'
});

function init(){

// Read and Store Setting Variable

// Check that settings exists
if (fs.existsSync('settings.json')) {

  var settings = fs.readFileSync('settings.json', 'utf8')
  var settings = JSON.parse(settings);
  var uid = settings.uid;
  var displayClientId = settings.displayClientId;
  console.log(displayClientId);
  console.log('Settings File Exists')

  // is the variable isn't null
  if (settings === null){

    // Launch settingsDialogue or event listener
    listenForRegisterEvent()


  } else {

    // Launch Window and subscribe to PresenceChannel
    eventDriver(uid, displayClientId)
    createWindow(uid)



  }


} else {

  // Settings File Does Not Exist
  console.log('Settings File Does Not Exist, Launch Diaglogue')

  // Launch settingsDialogue or event listener Here
  listenForRegisterEvent()


}

}


function createWindow(uid) {

  // Create the browser window.

  var kiosk = process.env.KISOSK;
  mainWindow = new BrowserWindow( { webPreferences: {nodeIntegration: false}, kiosk: true, frame: false});

  // and load the index.html of the app.
  mainWindow.loadURL('http://www.displayapp.site/display/' + uid)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null

  })




}


function eventDriver(uid, displayClientId) {

  console.log('starting Event Driver')

  var clientid = displayClientId;

  var pusher = new Pusher('f9c2971a084563106442', {

    app_id: '547755',
    key:'f9c2971a084563106442',
    secret:'678714fed034a58a2dcb',
    cluster: 'eu',
    encrypted: true,
    authEndpoint: url + '/api/presence/auth?uid=' + uid + '&clientid=' + displayClientId
  });

  var presenceChannel = pusher.subscribe('presence-online.' + uid);

  presenceChannel.bind('pusher:subscription_succeeded', function(members) {

    console.log('Subscribed to presence channel')
    presenceChannel.trigger('client-subscribed', uid);

 });

  // refresh from app if issue

   presenceChannel.bind('hardRefresh', function(data) {
      console.log('Reloading Window')
      mainWindow.reload()
      presenceChannel.trigger('client-subscribed', uid);

   });






}


function listenForRegisterEvent() {

          console.log('Listening for remote registration')

          var channel = pusher.subscribe('register');

          channel.bind('pusher:subscription_succeeded', function(members) {

            console.log('Subscribed to register channel, waiting for data')

          });

          // refresh from app if issue

          channel.bind('register', function(data) {

              console.log(data)

              var id = data.id
              var displayClientId = data.displayClientId
              var settings = {uid: id, 'displayClientId': displayClientId}
              var settingsJSON = JSON.stringify(settings)

              fs.writeFileSync("settings.json", settingsJSON)
              console.log('broadcast received, Configuration saved, starting app.')

              init()

          });

          dialog.showMessageBox({type: "info", message: "Waiting for registration, go to web app to register."})


}





// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.on('ready', init)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

process.on('SIGINT', function() {
  process.exit()

})

const readline = require('readline');

readline.emitKeypressEvents(process.stdin);

process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'r') {
    console.log('Deleting Settings File');
    fs.unlink('./settings.json')
    console.log('Settings Deleted');
    process.exit()
    init()
  }
});

if (fs.existsSync('settings.json')) {

  var settings = fs.readFileSync('settings.json', 'utf8')
  var settings = JSON.parse(settings);
  var settings = settings.uid;

  pusher.subscribe(settings);


}







// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

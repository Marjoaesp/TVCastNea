
const tizen = Tizen.Application;

function launchApp() {

  const mainWindow = tizen.getAppMainWindow();

  const webAppFrame = new tizen.WebAppFrame({
    id: "myWebAppFrame",
    url: "index.html"
  });


  mainWindow.add(webAppFrame);

 
  mainWindow.show();
}

tizen.on('service_app_start', launchApp);

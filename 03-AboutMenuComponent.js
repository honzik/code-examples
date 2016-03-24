var _ = require("underscore");
var aboutMenuStoreDebug = debug("app:Stores/AboutMenuStore");

var AboutMenuStore = new Simple.Model();

//Private
var has_data = false;

// initial load
AboutMenuStore.url = 'URL_HIDDEN_FOR_SECURITY_PURPOSES';

// Public methods
AboutMenuStore.getMainMenuSecondArray = function(){
  var data = this.attrs();
  var secondMenu = [];

  _.each(data, function(element, index){
    secondMenu.push({
      url: '/info/'+ element.id,
      name: element.title,
      class: 'menu--second-link',
      submenu: false
    });
  });

  return secondMenu;
};

AboutMenuStore.hasData = function(){
  return has_data;
};

var addParams = {
  method: 'POST',
  data: {
    cmd: 'getjson',
    type: 'embedwidget',
    id: 1002,
    lang: Settings.lang
  }
};

AboutMenuStore.fetch({}, addParams).then(function(){
  aboutMenuStoreDebug("About Menu data loaded.");
  has_data = true;
  AboutMenuStore.trigger("change");
});

module.exports = AboutMenuStore;
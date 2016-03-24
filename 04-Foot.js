var Mustache = require("mustache");
var SettingsStore = require("../../stores/SettingsStore.js");
var footDebug = debug("app:Components/Foot");

var template = '<div class="footer--block">{{&data.content}}</div>';

var Foot = Simple.View.extend({
  data: {},
  getData: function(){
    this.data = SettingsStore.getFootData();
  },
  dataNotReady: function(){},
  dataReady: function(){
    SettingsStore.off('change', this.dataReady);
  },
  render: function(){

    if(SettingsStore.hasData() === false) {
      this.dataNotReady();
      SettingsStore.on("change", this.dataReady, this);
      return this.el;
    }

    this.getData();
    this.el.html(Mustache.to_html(template, this));

    footDebug("Foot created");

    return this.el;
  },
  refresh: function(){
    this.render();
  },
  initialize: function(){
    SettingsStore.on("change", this.refresh, this);
    this.render();
  },
  destruct: function() {
    this.destroy(function(){
      SettingsStore.off('change', this.dataReady);
      footDebug("Foot destroyed");
    });
  }
});

module.exports = Foot;
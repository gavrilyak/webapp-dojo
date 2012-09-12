define(["dojo/_base/declare", "dojo/json"], function(declare, json){
  // add functionality for saving/recalling from localStorage
  return declare([], {
    localStorageKey: "dgrid_list",
    constructor: function(){
      var jsondata = localStorage[this.localStorageKey];
      //console.log(jsondata);
      jsondata && this.setData(json.parse(jsondata));
    },
    put: function(object, options){
      // persist new/updated item to localStorage
      //console.log("Persisting:" + uneval(this.data));
      var r = this.inherited(arguments);
      localStorage[this.localStorageKey] = json.stringify(this.data);
      return r;
    },
    remove: function(id){
      // update localStorage to reflect removed item
      var r = this.inherited(arguments);
      localStorage[this.localStorageKey] = json.stringify(this.data);
      return r;
    }
  })
})

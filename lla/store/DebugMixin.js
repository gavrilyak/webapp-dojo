define(["dojo/_base/declare"], function(declare){
  function Debug(name){
    return function(){
      console.log(">>Store." + name + ":" + JSON.stringify([].slice.call(arguments, 0)));
      var result = this.inherited(arguments);
      console.log("<<Store." + name + ":" + JSON.stringify(result));
      return result;
    };
  }
  return declare([], {
    get:Debug("get"),
    query:Debug("query"),
    put:Debug("put"),
    add:Debug("add"),
    remove:Debug("remove")
  });
});

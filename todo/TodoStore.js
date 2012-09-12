define(["dojo/_base/declare", "dojo/store/Memory","lla/store/AsyncMixin", "lla/store/DebugMixin", "lla/store/LocalStorageMixin", "lla/store/OrderedMixin"],
function(           declare,               Memory,           AsyncMixin,             DebugMixin,             LocalStorageMixin,             OrderedMixin){
  var TodoValidatorMixin = declare([], {
    put:function(object, options){
      if(!object.summary) throw Error("Empty summary");
      if( ~object.summary.indexOf("fuck") || 
        (object.description && ~object.description.indexOf("fuck"))) {
        throw Error("Swearing is disallowed here");
      }
      return this.inherited(arguments);
    },
    remove:function(id){
      if(~id.indexOf('!')) throw Error("Important tasks cannot be removed");
      return this.inherited(arguments);
    }
  });

  var storeMixins = [
    Memory,
    DebugMixin,
    //AsyncMixin,
    OrderedMixin,
    LocalStorageMixin,
    TodoValidatorMixin,
    AsyncMixin
  ];



  var Store = declare(storeMixins, {
    idProperty:"summary",
    localStorageKey: "dgrid_demo_todo_list"
  });
  //var store = new Store();
  //console.log(Store);
  return Store;
});

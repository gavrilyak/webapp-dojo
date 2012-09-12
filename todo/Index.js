define([
  "dgrid/Grid",
  "dgrid/Keyboard",
  "dgrid/Selection",
  "dgrid/editor",
  "dgrid/extensions/DnD",
  "dgrid/extensions/Pagination",
  "dgrid/OnDemandGrid",
  "dojo/_base/declare",
  "dojo/store/Observable",
  "put-selector/put",
  "dojo/when",
  "dojo/on",
  "todo/TodoStore",
  "dojo/Deferred",
  "dojo/query",
], function(
  Grid,
  Keyboard,
  Selection,
  editor,
  DnD,
  Pagination,
  OnDemandGrid,
  declare,
  Observable,
  put,
  when,
  on,
  TodoStore,
  Deferred,
  query
){
function byId(id){ return document.getElementById(id); }

return function Index(params, domNode){
  //allow constructing without new;
  if(!(this instanceof Index)) return new Index(params, domNode);

  console.log("init");
  //HELPERS

  //MODEL, instance of dojo/store, simulated from Memory
  //200ms sleep on each request to simulate network lag
  var MyStore = declare([TodoStore],{
    asyncSleepTime:500,
    get:function(){
      showLoading();
      var res = this.inherited(arguments);
      when(res, getSuccess, getError);
      return res;
    },
    put:function(){
      showSaving();
      var res = this.inherited(arguments);
      when(res, saveSuccess, saveError);
      return res;
    }
  });

  var store = Observable(MyStore());

  //VIEW
  //our grid class, mixed with plugins - this is pagination grid
  //var TodoGrid = declare([Grid, /*Keyboard, Selection, DnD,*/ Pagination]);
  //example of on-demand grid
  var TodoGrid = declare([Grid, Keyboard, Selection, DnD, OnDemandGrid]);

  //create grid instance and put it at "#list"
  var grid = TodoGrid({
    store: store,
    rowsPerPage:20,
    loadingMessage:"LOADING!!!",
    columns: {
      completed: editor({
        label: " ",
        autoSave: true,
        sortable: false
      }, "checkbox"),
      summary: {
        field: "_item", // get whole item for use by formatter
        label: "TODOs",
        sortable: false,
        formatter: function(item){
          return "<div" + (item.completed ? ' class="completed"' : "") +
            ">" + item.summary + "</div>";
        }
      },
      description: {
        field: "description",
        label: "DESCRIPTION",
        sortable: false
      }
    }
  }, query("#list", domNode)[0]);

  grid.sort("summary");

  //Much simpler grid, shows only completed items, put at #list2
  var gridCompleted = OnDemandGrid({
    store: store,
    query: {completed:true},
    columns: {
      summary: "TODOS",
      description: "DESCRIPTION"
    }
  }, query("#list2", domNode)[0]);
  gridCompleted._used_ = true; //silence unused var warning

  //other html elements
  var taskField            = query("#txtTask", domNode)[0];
  var removeSelectedButton = query("#removeSelected", domNode)[0];
  var editSelectedButton   = query("#editSelected", domNode)[0];
  var removeCompletedButton= query("#removeCompleted", domNode)[0];
  var itemForm             = query("#itemForm", domNode)[0];
  var generateDataButton   = query("#generateData", domNode)[0];
  var savingDiv            = query("#saving", domNode)[0];
  var loadingDiv           = query("#loading", domNode)[0];

  //local storage button - generate it when localStorage is present
  //uses put-selector to generate html
  var clearLocalStorageButton = window.localStorage ? put(byId("removeArea"), "button[type=button]", "Clear localStorage") : null;

  // observer - can be used for manual binding, not used with grid
  //store.query().observe(function(){ console.log("Observer:" + uneval(Array.slice(arguments)))})
  //store.query({completed:true}).observe(function(){ console.log("Completed Observer:" + uneval(Array.slice(arguments)))})

  //CONTROLLER

  //edit form, we simulate async here, because typically form is modal
  //arguments obj - object to edit
  //returns object after edit
  //show prompt with current object description
  //check wether cancelled and aborts editing
  //otherwice return promise for edited object (here it is resolved immediately)
  function editForm(obj) {
    var newDescription = prompt("Enter description for todo:" + obj.summary, obj.description || "");
    if (newDescription === null) return new Deferred().reject("Cancelled");
    var result = {summary:obj.summary, description:newDescription, completed:obj.completed};
    return new Deferred().resolve(result);
  }
  //can show/hide some div here

  function showLoading(){
    put(loadingDiv, '!hidden')
  }


  function getSuccess(){
    put(loadingDiv, '.hidden');
  }

  function getError(err){
    put(loadingDiv, '.fail');
    put(loadingDiv, '!hidden');
    alert("Get failed:" +  err);
    put(loadingDiv, '!fail');
    //return new Deferred().reject("Cancelled");
  }

  function showSaving(){
    put(savingDiv, '!hidden');
  }

  //store errors, including validation
  function saveSuccess(id) {
    put(savingDiv, '.hidden');
  }

  function saveError(err) {
    put(savingDiv, '.fail');
    put(savingDiv, '!hidden');
    when(alert("Store failed:" +  err), function(){
      put(savingDiv, '!fail');
      put(savingDiv, '.hidden');
    })
  }

  //save object and show errors or success
  function save(obj){
    return store.put(obj);
  }

  //edit object by id - get it from store, edit in edit form, save
  function edit(id){
    return store.get(id)
    .then(editForm)
    .then(save);
  }

  //edit many objects, not sure if loop or promise.all here
  function editMany(idsHash){
    for(var id in idsHash) edit(id);
  }


  //add object with summary
  //call put, it's ok here
  function add(summary){
    return save({completed: false, summary: summary});
  }

  //remove object by id, remove from store, show errors
  function remove(id){
    return store.remove(id).then(saveSuccess, saveError);
  }

  // query for all completed items and remove them
  function removeCompleted(){
    return store.query({completed: true}).forEach(function(item){
      remove(item.summary); //store.remove(item[store.idProperty])
    });
  }

  //remove many objects, hash or ids is simpler then array
  function removeMany(idsHash){
    for (var id in idsHash) remove(id);
  }

  //generate fake data, ask how much and put to store, ignore errors
  function generateManyData() {
    var howMuch = prompt("How much data:", 100);
    if(!howMuch) return;
    for(var i=0; i<howMuch; i++) store.put({summary:"summary " + i, description:"description " + i});
    //must be promise.all
    //setTimeout(function(){ grid.refresh();}, 1000);
  }

  // remove all items in grid the quick way (no need to iteratively remove)
  function clearLocalStorage() {
    localStorage.removeItem(store.localStorageKey);
    store.setData([]);
    grid.refresh();
  }

  //enable/disable buttons when selection is present in grid
  function selectionChanged() {
    for(var hasOneSelection in grid.selection) break;
    editSelectedButton.disabled = removeSelectedButton.disabled = hasOneSelection?"":"disabled";
  }


  //events wiring, aka dispatcher
  on(grid, ".dgrid-row:dblclick", function(event){ return edit(grid.row(event).id);});
  on(grid, "dgrid-select", selectionChanged);
  on(grid, "dgrid-deselect", selectionChanged);
  on(editSelectedButton, "click", function(){ editMany(grid.selection);});
  on(itemForm, "submit", function(evt){ evt.preventDefault(); add(taskField.value);});
  on(removeSelectedButton, "click", function(){ removeMany(grid.selection);});
  on(removeCompletedButton,  "click", removeCompleted);
  on(generateDataButton, "click", generateManyData);
  if(clearLocalStorageButton){
    on(clearLocalStorageButton, "click", clearLocalStorage);
  }

 store.put({summary:"1", description:"will be updated from server"});
 store.put({summary:"err", description:"try to edit it, should fail to load"});
 
 //STARTUP
 //fire selectionChanged, so buttons will disable/enable
 selectionChanged();

 setInterval(function(){
    var id = "1";
    store.notify({summary:id, description:"updated from server:" + (+new Date()), changedBy:"gvv"}, id );
    store.notify(null, "2");
    setTimeout(function(){store.notify({summary:"2", description:"added from server"});}, 1000);
 }, 2000);

}});

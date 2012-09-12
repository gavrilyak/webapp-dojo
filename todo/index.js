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
  "dojo/Deferred"
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
  Deferred
){

  //HELPERS
  function byId(id){ return document.getElementById(id); }

  //MODEL, instance of dojo/store, simulated from Memory
  //200ms sleep on each request to simulate network lag
  var store = new Observable(TodoStore({
    asyncSleepTime:100
  }));

  //VIEW
  //our grid class, mixed with plugins - this is pagination grid
  var TodoGrid = declare([Grid, /*Keyboard, Selection, DnD,*/ Pagination]);
  //example of on-demand grid
  //var TodoGrid = declare([Grid, Keyboard, Selection, DnD, OnDemandGrid]);

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
  }, "list");

  //Much simpler grid, shows only completed items, put at #list2
  var gridCompleted = OnDemandGrid({
    store: store,
    query: {completed:true},
    columns: {
      summary: "TODOS",
      description: "DESCRIPTION"
    }
  }, "list2");
  gridCompleted._used_ = true; //silence unused var warning

  //other html elements
  var taskField            = byId("txtTask");
  var removeSelectedButton = byId("removeSelected");
  var editSelectedButton   = byId("editSelected");
  var removeCompletedButton= byId("removeCompleted");
  var itemForm             = byId("itemForm");
  var generateDataButton   = byId("generateData");

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
    var newDescription = prompt("Edit row:" + obj.summary, obj.description || "");
    if (newDescription === null) return new Deferred().reject("Cancelled");
    var result = {summary:obj.summary, description:newDescription, completed:obj.completed};
    return new Deferred().resolve(result);
  }
  //can show/hide some div here
  function saveSuccess(id) {
    console.log("Save success:" + id);
  }

  //store errors, including validation
  function storeError(err) {
    //if(error.fields) - highligth invalid fields
    alert("Store failed:" +  err);
  }

  //save object and show errors or success
  function save(obj){
    return store.put(obj)
    .then(saveSuccess, storeError);
  }

  //edit object by id - get it from store, edit in edit form, save
  function edit(id){
    return store.get(id)
    .then(editForm, storeError)
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
    return store.remove(id)
    .then(saveSuccess, storeError);
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
 //on(byId("serverNotify", "click", function(){ })
 //

 //STARTUP
 //fire selectionChanged, so buttons will disable/enable
 selectionChanged();
});

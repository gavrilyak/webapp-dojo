define(["dojo/_base/declare"], function(){
// function used to support ordered insertion of store items
  function calculateOrder(store, object, before, orderField){
    // Calculates proper value of order for an item to be placed before another
    var afterOrder, beforeOrder = 0;
    if (!orderField) { orderField = "order"; }

    if(before){
      // calculate midpoint between two items' orders to fit this one
      afterOrder = before[orderField];
      store.query({}, {}).forEach(function(object){
        var ord = object[orderField];
        if(ord > beforeOrder && ord < afterOrder){
          beforeOrder = ord;
        }
      });
      return (afterOrder + beforeOrder) / 2;
    }else{
      // find maximum order and place this one after it
      afterOrder = 0;
      store.query({}, {}).forEach(function(object){
        var ord = object[orderField];
        if(ord > afterOrder){ afterOrder = ord; }
      });
      return afterOrder + 1;
    }
  }

  return declare([], {
    put: function(object, options){
      // honor order if present
      options = options || {};
      if(options.before !== undefined || !object.order){
        // if options.before is provided or this item doesn't have any order,
        // calculate a new one
        object.order = calculateOrder(this, object, options.before);
      }
      return this.inherited(arguments);
    },
    query: function(query, options){
      // sort by order field
      options = options || {};
      options.sort = [{attribute:"order"}];
      return this.inherited(arguments);
    }
  });
})

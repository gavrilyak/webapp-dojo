define(["dojo/_base/declare", "dojo/Deferred", "dojo/store/util/QueryResults"],
function( declare,             Deferred,        QueryResults){
  function Async(name){ return function async(){
    var d = new Deferred();
    var toReturn = d.promise;
    try{
      var res =  this.inherited(arguments);
      if(name == "query"){
        toReturn = new QueryResults(d.promise)
        toReturn.total = res.total;
      }
      setTimeout(function(){
         d.resolve(res);
      },this.asyncSleepTime)
    }catch(e){
      setTimeout(function(){
        d.reject(e)
      },this.asyncSleepTime)
    }
    return toReturn;
  }}

  return declare([], {
    asyncSleepTime: 0,
    get    : Async("get"),
    query  : Async("query"),
    put    : Async("put"),
    remove : Async("remove")
  })
})

define(["dojo/_base/declare", "dojo/Deferred", "dojo/store/util/QueryResults"],
function( declare,             Deferred,        QueryResults){
  function Async(name){ return function async(){
    var d = new Deferred();
    var toReturn = d.promise;
    try{
      var res =  this.inherited(arguments);
      if(name == "query"){ //need to simulate query separately
        toReturn = new QueryResults(toReturn);
        toReturn.total = res.total;
      }
      if(this.asyncSleepTime == 0){
        d.resolve(res);
      }else{
        setTimeout(function(){ d.resolve(res); },this.asyncSleepTime);
      }
    }catch(e){
      if(this.asyncSleepTime == 0){
        d.reject(e);
      }else{
        setTimeout(function(){ d.reject(e); },this.asyncSleepTime);
      }
    }

    return toReturn;
  };}

  return declare([], {
    asyncSleepTime: 0,
    get    : Async("get"),
    query  : Async("query"),
    put    : Async("put"),
    remove : Async("remove")
  });
});

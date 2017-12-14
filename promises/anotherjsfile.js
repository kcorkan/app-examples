Ext.define('myToolbox',{
   singleton: true,

   loadWsapiRecords: function(config){
      var deferred = Ext.create('Deft.Deferred');

      Ext.create('Rally.data.wsapi.Store',config).load({
         callback: function(records, operation){
             if (operation.wasSuccessful()){
                deferred.resolve(records);
             } else {
                deferred.reject('Error ' + operation.error.errors.join(','));
             }
         }
      });

      return deferred.promise;
   }
});

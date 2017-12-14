Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        //Write app code here

        this.getAccpetedStories();  //simple promise example #1

        this.getStoriesByStateInParallel();  //Deft Chain Parallel proise example #1

        this.getStoriesAndChildTestCases();  //Demonstrates Deft.Chain.Pipeline so that we can load child test cases for a set of storeis

        //API Docs: https://help.rallydev.com/apps/2.1/doc/
    },
    getAccpetedStories: function(){
        //This function demonstrates how to call a function that returns a promise.

        this._getStoryCountByState('Accepted').then({
            success: function(successResult){
                //result is what we sent back in the resolve method of the deferred object
                console.log('This is really the number of accepted stories ' + successResult);
                alert (successResult + ' Accepted Stories Found!');
            },
            failure: function(failureResult){
              //result is what we sent back in the reject method of the deferred object after getting an error
              alert ("Oh No!! There was an error:  " + failureResult);
            }
        });
        console.log('We are waiting to find out what the number of accepted stories is even though we have already called the function');
    },
    _getStoryCountByState: function(state){
        var deferred = Ext.create('Deft.Deferred');

        var store = Ext.create('Rally.data.wsapi.Store',{
            model: 'UserStory',
            fetch: ['ObjectID','FormattedID','ScheduleState'],
            filters: [{
               property: 'ScheduleState',
               value: state
            }]
        }).load({
             callback: function(records, operation){
                  if (operation.wasSuccessful()){
                     //This will return the count of stories that met the filter criteria in the promise's success function because we
                     //are using the "resolve" method of the deferred object.
                     deferred.resolve(operation.resultSet.totalRecords);
                  } else {
                     //If we get an error, then we will return the error in the promises failure function via the "reject " method of the deferred object
                     deferred.reject('Error loading story count');
                  }
             }
        });

        return deferred.promise;
    },
    getStoriesByStateInParallel: function(){
        //This will run all items in parallel - if you look at the network tab, you will see execution in parallel
        //the success function will be called when ALL promises are done running
        Deft.Chain.parallel([
            function(){ return this._getStoryCountByState('Accepted')},  //The functions in this array need to return a deferred.promise object.
            function(){ return this._getStoryCountByState('Completed')},
            function(){ return this._getStoryCountByState('In-Progress')},
            function(){ return this._getStoryCountByState('Defined')},
        ], this).then({
           success: function(successResults){
               //Success results will be an array of what was returned in the deferred.resolve for each promise.  The order of the
               //results will be the same as the order of the array that was passed into the Deft.Chain.parallel function.
               console.log('Accepted stories: ' + successResults[0]);
               console.log('Completed stories: ' + successResults[1]);
               console.log('In-Progress stories: ' + successResults[2]);
               console.log('Defined stories: ' + successResults[3]);
           },
           failure: function(failureResult){
              alert ("Oh No!! There was an error:  " + failureResult);
           }
        });
    },
    getStoriesAndChildTestCases: function(){
        Deft.Chain.pipeline([
           function(){ return this._getStories2(); },
           function(stories){ return this._getTestCases(stories); }
        ], this).then({
           success: function(successResult){
               console.log('All stories and test case s have been loaded ');
           },
           failure: function(failureResult){
              alert ('error loading test cases and stories ' + failureResult);
           }
        });
    },
    _getStories: function(){
        var deferred = Ext.create('Deft.Deferred');

        var store = Ext.create('Rally.data.wsapi.Store',{
            model: 'UserStory',
            fetch: ['ObjectID','FormattedID','ScheduleState'],
            filters: [{
               property: 'ScheduleState',
               operator: '>=',
               value: 'Completed'
            }]  //
        }).load({
             callback: function(records, operation){
                  if (operation.wasSuccessful()){
                     //This will return the story records that met the filter criteria in the promise's success function because we
                     //are using the "resolve" method of the deferred object.
                     console.log('stories ', records );
                     deferred.resolve(records);
                  } else {
                     //If we get an error, then we will return the error in the promises failure function via the "reject " method of the deferred object
                     deferred.reject('Error loading storys');
                  }
             }
        });

        return deferred.promise;
    },
    _getTestCases: function(stories){
         //Now we want to get the test cases for all of the stories that we loaded
         var deferred = Ext.create('Deft.Deferred');
         console.log('_getTestCases', stories);
         var filters = Ext.Array.map(stories, function(s){
            return {
               property: 'WorkProduct.ObjectID',
               value: s.get('ObjectID')
            };
         });
         filters = Rally.data.wsapi.Filter.or(filters);

         var store = Ext.create('Rally.data.wsapi.Store',{
             model: 'TestCase',
             fetch: ['ObjectID','FormattedID','LastVerdict'],
             filters: filters,
              enablePostGet: true  //We are enabling post get for this becuase we are passing in what could be a pretty large filter since it is an or of object ids
         }).load({
              callback: function(records, operation){
                   if (operation.wasSuccessful()){
                      //This will return the test case records that met the filter criteria in the promise's success function because we
                      //are using the "resolve" method of the deferred object.
                      console.log('test cases', records)
                      deferred.resolve([stories, records]); //Here, we want to return stories and test cases
                   } else {
                      //If we get an error, then we will return the error in the promises failure function via the "reject " method of the deferred object
                      deferred.reject('Error loading test cases: ' + operation.error.errors.join(','));
                   }
              }
         });

         return deferred.promise;
    },
    _getStories2: function(){

      return myToolbox.loadWsapiRecords({
        model: 'UserStory',
        fetch: ['ObjectID','FormattedID','ScheduleState'],
        filters: [{
           property: 'ScheduleState',
           operator: '>=',
           value: 'Completed'
        }]
        });

    }



});
